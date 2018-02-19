---
layout: post
title: "The curious case of the query that gets slower the fewer elements it affects"
date: 2018-01-04
author: Tobias Pfeiffer
tags: elixir postgresql performance benchee
---

Once on a shiny nice summer day I was thinking of nothing evil when _Bugsnag_
popped up in our _Slack_ and complained about an
`Elixir.DBConnection.ConnectionError` - curiously I took a look and it turns out
it was a timeout error! [Ecto (elixir database tool) defaults to a timeout of 15
seconds](https://hexdocs.pm/ecto/Ecto.Repo.html#module-shared-options) and we
had a query that took longer than this? Yikes! What went wrong?

This is the story of what happened, where we went wrong and how we made sure we
fixed it.

## The problem

The application we are looking at here is our courier tracker. It gets the
gps locations of couriers on the road and then makes them available for admins
to look at with live channels. One important part of this is that as soon as
you look at a shipment its last known location is displayed. This was were
the exception was coming from. The rather innocent line where it occurred:

```elixir
last_courier_location =
  LatestCourierLocation
  |> CourierLocation.with_courier_ids(courier_id)
  |> Repo.one
```

How could this take so long (remember the query took 15 minutes to execute)
and what does it do?

`with_courier_ids/1` basically resolves to this:

```elixir
def with_courier_ids(query, courier_ids) when is_list(courier_ids) do
  from location in query,
  where: location.courier_id in ^courier_ids
end
```

Instead of a straight `id = my_id` check it checks against the inclusion in a list
(the list being `[courier_id]`).

`LatestCourierLocation` on the other hand is a database view that we created
as follows:

```SQL
CREATE OR REPLACE VIEW latest_courier_locations AS
  SELECT DISTINCT ON(courier_id)
  *
  FROM courier_locations
  ORDER BY courier_id, time DESC
```

So it does what we said in the beginning - it gets the latest location for
a given courier. Easy enough.

## Why did it take so long?

A quick debugging showed that it took so long because a misbehaving client
was submitting locations at a way too frequent rate. At the time that courier
had around 2.3 Million locations in the database. Quite some, but nothing
that should cause the database to take that long. 

This is probably also a good time to mention that we are running PostgreSQL.
At the time I think it was 9.5, results shown here are with Postgres 9.6 though.

## Attempt#1

Ok let's make this faster. I got this. I know this. Let's write a benchmark!
We'll use [benchee](https://github.com/PragTob/benchee):

```elixir
alias CourierTracker.{Repo, CourierLocation, LatestCourierLocation}
require Ecto.Query

courier_id = 3799 # about 2.5 Million locations

Benchee.run %{
  "DB View" => fn ->
    LatestCourierLocation
    |> CourierLocation.with_courier_ids(courier_id)
    |> Repo.one(timeout: :infinity)
  end,
  "with_courier_ids" => fn ->
    CourierLocation.with_courier_ids(courier_id)
    |> Ecto.Query.order_by(desc: :time)
    |> Ecto.Query.limit(1)
    |> Repo.one(timeout: :infinity)
  end,
  "full custom" => fn ->
    CourierLocation
    |> Ecto.Query.where(courier_id: ^courier_id)
    |> Ecto.Query.order_by(desc: :time)
    |> Ecto.Query.limit(1)
    |> Repo.one(timeout: :infinity)
  end
}, time: 30,
   warmup: 5,
   formatters: [
     &Benchee.Formatters.Console.output/1,
     &Benchee.Formatters.HTML.output/1
   ],
   html: [file: "benchmarks/reports/latest_location_single.html"]
```

What does this do? It defines 3 variants that we want to benchmark (`DB View`,
`with_courier_ids` and `full customer`) along with the code that should be 
measured. We measure this with a specific id that was causing the error, which
had about 2.5 Millions locations.
We then also define a _warmup_ period of 5 seconds and an measurement
_time_ of 30 seconds for each of the defined jobs. We also say we want to output
this in the console as well as in an HTML format (that allows png exports).

So what does the benchmark say?

```
tobi@liefy ~/projects/liefery-courier-tracker $ mix run benchmarks/latest_location_no_input.exs 
Operating System: Linux
CPU Information: Intel(R) Core(TM) i7-6700HQ CPU @ 2.60GHz
Number of Available Cores: 8
Available memory: 15.49 GB
Elixir 1.4.5
Erlang 20.1
Benchmark suite executing with the following configuration:
warmup: 5 s
time: 30 s
parallel: 1
inputs: none specified
Estimated total run time: 1.75 min


Benchmarking DB View...
Benchmarking full custom...
Benchmarking with_courier_ids...

Name                       ips        average  deviation         median         99th %
with_courier_ids        983.21        1.02 ms    ±43.22%        0.91 ms        3.19 ms
full custom             855.07        1.17 ms    ±53.86%        0.96 ms        4.25 ms
DB View                   0.21     4704.70 ms     ±4.89%     4738.83 ms     4964.49 ms

Comparison: 
with_courier_ids        983.21
full custom             855.07 - 1.15x slower
DB View                   0.21 - 4625.70x slower
```

It says a lot of things, so if you're interested in what the system for running
this looked like, you got all the information right there! The other thing that
might be interesting is that we used `ecto 2.1.6` and `postgrex 0.13.3`.

But what do the results say? Apparently `with_courier_ids` and `full_custom`
rock! `DB View` is over **4600 times slower!**. Wow case solved. Using a nice
visual representation from the HTML report makes this even clearer:

![benchee report locations single report](/images/posts/curious_query/benchee_single_run.png)

The standard deviation seems sort of high (~10% would be expected) but our
worst case performance (99th%) is still under 5 ms so we seem to be goog. 

Let's roll this out, pat ourselves on the shoulder for one of the best
performance improvements ever and call it a day!


## Boom!

We deploy and boom...

![many errors pop up burning house](/images/posts/curious_query/boooom.jpg)

The bugsnags start rolling in! All these `DBConnectionError`s - more than
before? How? We benchmarked this!

No time to argue, let's rollback these changes (I'll spare you this part of the
story).

## What happened?

So, what happened? Taking a look at the logs we find out that the new errors
happened especially when the courier we were requesting locations for had no
locations at all. This can happen when the feature is turned off or the courier
doesn't use our app.

Ok then, let's write a new benchmark this time we'll use a wider range of
inputs. Luckily benchee has us covered with the `inputs` feature:

```elixir
alias CourierTracker.{Repo, CourierLocation, LatestCourierLocation}
require Ecto.Query

inputs = %{
  "Big 2.5 Million locations" => 3799,
  "No locations"              => 8901,
  "~200k locations"           => 4238,
  "~20k locations"            => 4201
}

Benchee.run %{
  "DB View" => fn(courier_id) ->
    LatestCourierLocation
    |> CourierLocation.with_courier_ids(courier_id)
    |> Repo.one(timeout: :infinity)
  end,
  "with_courier_ids" => fn(courier_id) ->
    CourierLocation.with_courier_ids(courier_id)
    |> Ecto.Query.order_by(desc: :time)
    |> Ecto.Query.limit(1)
    |> Repo.one(timeout: :infinity)
  end,
  "full custom" => fn(courier_id) ->
    CourierLocation
    |> Ecto.Query.where(courier_id: ^courier_id)
    |> Ecto.Query.order_by(desc: :time)
    |> Ecto.Query.limit(1)
    |> Repo.one(timeout: :infinity)
  end
}, inputs: inputs, time: 30, warmup: 5,
   formatters: [
     &Benchee.Formatters.Console.output/1,
     &Benchee.Formatters.HTML.output/1
   ],
   html: [file: "benchmarks/reports/latest_location.html"]
```

I'll spare you the output of system metrics etc. this time around. Let's have
a look at the results divided by input:

```

```

It seems like `DB View` is faster than our 2 alternatives for everything that
doesn't have the 2.5 Million locations? How can this be? `full_custom` and
`with_courier_ids` get slower the fewer elements are affected by it?

To find out what's going on, let's get the respective queries, fire up a
PostgreSQL shell and `EXPLAIN ANALYZE` what's up.

To get the SQL query each one of those would generate, let's get it from an
`iex` session:

```

```

And now to `EXPLAIN ANALYZE` - it's basically asking PostgreSQL (or the query 
planner, more precisely) how it wants to get that data. Seeing that, we might
see where we are missing an index or where our data model hurts us.



* benchmark number 2 with old indexes
* Combined indexes to the rescue
* performance comparison


## Takeaway

* takeaway: always benchmark, INPUTS MATTER, PG EXPLAIN is your friend



```
##### With input Big 2.3 Million locations #####
Name                                  ips        average  deviation         median         99th %
full custom                       1032.69      0.00097 s    ±24.98%      0.00091 s      0.00224 s
with_courier_ids + order           949.10      0.00105 s    ±38.37%      0.00095 s      0.00300 s
Using LatestCourierLocation          0.21         4.79 s     ±8.10%         4.79 s         5.18 s

Comparison:
full custom                       1032.69
with_courier_ids + order           949.10 - 1.09x slower
Using LatestCourierLocation          0.21 - 4947.34x slower

##### With input No locations #####
Name                                  ips        average  deviation         median         99th %
Using LatestCourierLocation       2489.78      0.00040 s    ±29.78%      0.00039 s      0.00091 s
full custom                        0.0513        19.51 s     ±0.00%        19.51 s        19.51 s
with_courier_ids + order           0.0487        20.52 s     ±0.00%        20.52 s        20.52 s

Comparison:
Using LatestCourierLocation       2489.78
full custom                        0.0513 - 48584.15x slower
with_courier_ids + order           0.0487 - 51098.57x slower

##### With input ~200k locations #####
Name                                  ips        average  deviation         median         99th %
Using LatestCourierLocation          3.84         0.26 s     ±4.85%         0.26 s         0.29 s
with_courier_ids + order            0.103         9.73 s     ±0.00%         9.73 s         9.73 s
full custom                         0.103         9.74 s     ±0.00%         9.74 s         9.74 s

Comparison:
Using LatestCourierLocation          3.84
with_courier_ids + order            0.103 - 37.36x slower
full custom                         0.103 - 37.40x slower

##### With input ~20k locations #####
Name                                  ips        average  deviation         median         99th %
Using LatestCourierLocation         32.58       0.0307 s     ±7.30%       0.0298 s       0.0399 s
full custom                        0.0976        10.25 s     ±0.00%        10.25 s        10.25 s
with_courier_ids + order           0.0970        10.31 s     ±0.00%        10.31 s        10.31 s

Comparison:
Using LatestCourierLocation         32.58
full custom                        0.0976 - 333.89x slower
with_courier_ids + order           0.0970 - 335.83x slower
```
