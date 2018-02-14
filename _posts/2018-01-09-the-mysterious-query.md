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
We'll use [benchee](https://github.com/PragTob/benchee).

* only the 2.3 Million input

## Boom!

* boom image

## What happened?

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
