---
layout: post
title: "The curious case of the query that gets slower the fewer elements it affects"
date: 2018-01-04
author: Tobias Pfeiffer
tags: elixir postgresql performance benchee
---

On a shiny nice summer day once I was thinking of nothing evil when _Bugsnag_
popped up in our _Slack_ and complained about an
`Elixir.DBConnection.ConnectionError` - curiously I took a look and it turns out
it was a timeout error! [Ecto (elixir database tool) defaults to a timeout of 15
seconds](https://hexdocs.pm/ecto/Ecto.Repo.html#module-shared-options) and we
had a query that took longer than this? Yikes! What went wrong?

The application gets the locations of couriers on the road and then makes them
available for admins to look at with live channels. One important part of that is
that as soon as you look at a shipment its last known location is displayed.
This was were the bug was coming from. The rather innocent line:



* create gif? for moving courier?
* One day timeout error (show error)

* I know this stuff write first benchmark
* Boom again -- What happened?!?!
* Write new benchmark with more meaningful records
* PG EXPLAIN
* Combined indexes to the rescue
* performance comparison
* takeaway: INPUTS MATTER

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
