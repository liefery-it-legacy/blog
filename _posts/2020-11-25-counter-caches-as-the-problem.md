---
layout: post
title: "N+1 queries - What if counter caches are the problem and not the solution?"
date: 25-11-2020
author: Stephan Leibelt
tags: rails activerecord counter-caches delayed-counter-caches performance database sub-selects n+1-queries 
excerpt: "N+1 queries are a common performance issue and Rails' built-in counter caches a well-known solution to avoid them.
But what do you do if the counter cache is the problem?"
---

<div style="width:100%;">
  <img src="/images/posts/counter-caches-as-the-problem/counting.gif">
</div>
<div style="text-align: center">
  <a href="https://giphy.com/gifs/latenightseth-lol-seth-meyers-lnsm-l0XtbC8EniiuwAEOQn">via GIPHY</a>
</div>

[TL;DR](#takeaway-tldr)

At Liefery we use counter caches to avoid N+1 queries.
If you are already familiar with that topic you can skip directly to the
section [when counter caches become a problem](#parallel-updates-during-request-spikes).
 

## The problem

N+1 queries are a well known problem for page load and database performance.
Let's imagine we have an online shop and a customer has many orders.

```ruby
# models/customer.rb
class Customer < ApplicationRecord
  has_many :orders
end

# models/order.rb
class Order < ApplicationRecord
  belongs_to :customer
end
```

To display 10 customers with their number of orders we could do this:

```ruby
# controller
@customers = Customer.limit(10)
```

```haml
-# views/customers/index.haml
- @customers.each do |customer|
  %div 
    = customer.name
    -# size does a count query if the association is not loaded yet -> N+1 query
    %span= customer.orders.size
```

This will cause 1 query to load the customers and 10 queries to count the orders for each of the 10 customers.
So now we have an N+1 `COUNT(*)` query.

## Counter caches

To avoid the N+1 count queries we can use the built-in counter caches from `ActiveRecord`:

```ruby
# models/order.rb
class Order < ApplicationRecord
  # assumes you have the column `orders_count` in the customers table 
  belongs_to :customer, counter_cache: true 
end
```

```haml
-# views/customers/index.haml
- @customers.each do |customer|
  %div 
    = customer.name
    -# size uses customer.orders_count if the orders association
    -# is defined with `counter_cache: true`
    %span= customer.orders.size
```

Now we can display the order count for each customer with only one query which fetches the customers from the database.

So is everything fine now and we can go home and enjoy our afternoon?

## Limitations of Rails counter caches

There are some limitations for the built-in counter caches:
* What do we do if we also want to display canceled orders, pending orders or orders filtered by some other condition?
* We cannot easily control when they are executed.

### Counter culture

When we encountered these problems we discovered the gem [counter_culture](https://github.com/magnusvk/counter_culture)
which enables e.g. conditional counter caches.

```ruby
# models/order.rb
class Order < ApplicationRecord
  belongs_to :customer, counter_cache: true # uses `orders_count`

  counter_culture :customer, column_name: ->(order) {
    # will increase the column canceled_orders_count only if the order is canceled
    order.canceled? ? "canceled_orders_count" : nil 
  }
end
```

```haml
-# views/customers/index.haml
- @customers.each do |customer|
  %div 
    = customer.name
    %span= "#{customer.orders.size} orders"                    # standard Rails cache
    %span= "#{customer.canceled_orders_count} canceled orders" # counter_culture cache
```

Now we can have multiple counter caches for the same association for different types of orders.

So is everything fine now and we can go home and enjoy our afternoon?


## Parallel updates during request spikes

Remember that there was a second limitation I mentioned before in [Limitations of Rails counter caches](#limitations-of-rails-counter-caches)?

> We cannot easily control when they are executed.

The counter cache option added to the order model as well as the `counter_culture` cache update the counter
on the customer model every time we create a new order for the customer.

Neither Rails nor the `counter_culture` gem offer any control over when they are executed.
In some situations it can be necessary to use something other than the built-in mechanism to update the counter
every time after an order is created.

At Liefery we have a time window based delivery model.
Our customers can book shipments for a specified time window, e.g. for Berlin 25th November 6pm-9pm.
This information is represented by the `TourAppointment` model.
If our customers book the shipments via our API they might book many shipments at once all for the same
delivery window, so in our case for the same `TourAppointment`.

What does it look like?

```ruby
# models/tour_appointment.rb
class TourAppointment < ApplicationRecord
  has_many :shipments
end

# models/shipment.rb
class Shipment < ApplicationRecord
  belongs_to :tour_appointment, counter_cache: true

  counter_culture :tour_appointment, column_name: ->(shipment) {
    shipment.canceled? ? "canceled_shipments_count" : nil
  }
end
```

If many parallel requests book shipments for the same tour appointment we have many parallel attempts to update
the 2 counter columns on the same tour appointment.

Since the update needs to create consistent values this tour appointment gets locked by PostgreSQL when
the first request tries to update the value.
If we have 10 parallel requests coming in, the other 9 requests now have to wait for the first request to finish the
update and PostgreSQL to release the database lock for the tour appointment.
Then the next request can increase the value again making the remaining 8 requests wait for this update as well,
and so on.

How bad is it?
Well...

![4 seconds only for the counter update](/images/posts/counter-caches-as-the-problem/skylight.png)

Only updating the shipment counter caches on the tour appointment now takes 4 seconds on average
if we have many parallel update attempts to the same tour appointment. 

So now we have a big performance issue!

We could solve this problem in 2 different ways.

## Sub-selects

For simplicity let's get back to our example of customers and orders in an online shop.
Instead of introducing counter caches we could use normal SQL count queries on the show page of the customer because 
this will only lead to 3 count queries for the orders and therefore isn't as bad as an N+1 query for many customers.

Then we will handle only the places where we display multiple customers and their order counts which cause N+1
queries by already calculating the counts in the same query in which we load the customers using SQL sub-selects. 

```ruby
# models/order.rb
class Order < ApplicationRecord
  belongs_to :customer

  scope :canceled, -> { where state: :canceled }
end
```

```ruby
# controller
orders                = Order.where("orders.customer_id = customers.id")

orders_count          = orders.select("COUNT(*)").to_sql
canceled_orders_count = orders.canceled.select("COUNT(*)").to_sql

# Instances in @customers now have the additional methods orders_count
# and canceled_orders_count
@customers = Customer.limit(10).select(
  <<~SQL
    customers.*,
    (#{orders_count})          AS orders_count,
    (#{canceled_orders_count}) AS canceled_orders_count
  SQL
)
```

`ActiveRecord` will recognize the additional values calculated by the SQL query and add methods to the customer
instances returned by that query. 

```haml
-# views/customers/index.haml
- @customers.each do |customer|
  %div 
    = customer.name
    %span= "#{customer.orders_count} orders"
    %span= "#{customer.canceled_orders_count} canceled orders"
```

Eric Anderson [wrote a nice article](https://medium.com/@eric.programmer/the-sql-alternative-to-counter-caches-59e2098b7d7)
about this approach and its advantages and disadvantages.

It's a good approach if you don't use it for all the entries in a huge database table
(where it can become slower than the counter cache) or if you have many different
types of counts which are e.g. only displayed on one page.
That would lead to many additional columns which are all only used once or twice. 

What if you want to use those values in a piece of code which is shared between the index and the show page,
e.g. a decorator?

You could move the code from the controller into a scope on the customer model and use it on both pages:

```ruby
# models/customer.rb
class Customer < ApplicationRecord
  has_many :orders

  scope :with_order_counts, -> {
    orders_count = Order.where("orders.customer_id = customers.id")
                        .select("COUNT(*)").to_sql
    
    select "customers.*, (#{orders_count}) AS orders_count"
  }
end
```

```ruby
# decorators/customer_decorator.rb
class CustomerDecorator < Draper::Decorator
  def canceled_orders_count
    "#{object.canceled_orders_count} canceled orders"
  end
end
```

```ruby
# controller
def index
  @customers = CustomerDecorator.decorate_collection(
    Customer.limit(10).with_order_counts
  )
end

def show
  @customer = Customer.with_order_counts.find(params[:id]).decorate
end
```

This also works well when combining it with preloading.

Let's say the shop is an offline shop with physical stores and a customer belongs to a store.
Now we want to list all stores with their customers and their order counts.
By adding the scope to the definition of the association preloading the 
customers will additionally calculate the order counts.

```ruby
# models/store.rb
class Store < ApplicationRecord
  has_many :customers
  has_many :customers_with_order_counts, -> { with_order_counts }, class: "Customer"
end

# controller
def index
  @stores = Store.limit(10).includes(:customers_with_order_counts)
end
```

```haml
-# views/stores/index.haml
- @stores.each do |store|
  %div
    = store.city
    - store.customers_with_order_counts.each do |customer|
      %div 
        = customer.name
        %span= customer.orders_count
```

This works well if the calculated attributes are only used in a few places.

But what if this decorator is used on many pages?
We would need to add the scope to all these pages, even if it was only a show page without an N+1 query.
Otherwise we would get a `NoMethodError` for the customer instances that were not loaded with the scope.

To solve this we can use virtual attributes for our model.
Like this we can use the precalculated value on index pages where we
used the scope with the sub-select.
On show pages where the query is not an N+1 query we can then fall back to a separate count query.

### Virtual attributes

I found this approach in Tom Chens article about [Avoiding N+1 Queries with Rails Virtual Attributes](https://www.rightpoint.com/rplabs/avoiding-n1-queries-virtual-attributes-rails-order-by-association).

We can define additional attributes for `ActiveRecord` models like this:

```ruby
# models/customer.rb
class Customer < ApplicationRecord
  has_many :orders

  attribute :orders_count, :integer
end
```

Now all the customer instances will have the `orders_count` method but it will be `nil` by default so that we can
use the precalculated value or fall back to a separate count query:

```ruby
# decorators/customer_decorator.rb
class CustomerDecorator < Draper::Decorator
  def orders_count
    count = object.orders_count || object.orders.count
    "#{count} orders"
  end
end
```
```ruby
# controller
def index
  # calculates the value for orders_count, so we avoid an additional count query
  @customers = CustomerDecorator.decorate_collection(
    Customer.limit(10).with_order_counts
  )
end

def show
  # will use a separate count query because we didn't calculate the value
  # in our SQL query
  @customer = Customer.find(params[:id]).decorate
end
```

This approach is helpful if you have many places where the method is used and therefore the scope on the customer
would have to be added in many places without gaining a big improvement in response times in many of those cases.


## Delayed counter cache calculation

So what if we use those count values all over our application?
Having to add the scope with the sub-select for the
order counts makes it difficult to maintain since we have to keep this code in sync and also have to add the scope to
every new place where we might need those values.

In the [Liefery API example](#parallel-updates-during-request-spikes) all the shipments are causing a separate update
query to the same tour appointment.
If they all update the same record we could delay the calculation of the counter value and only calculate the value
once after a specified time so that instead of 10 requests causing 10 update queries we wait for 10 seconds and then do
a single count query to set the counter to the correct value.

This is what the gem [counter-cache](https://github.com/wanelo/counter-cache) can do.
However for our needs it doesn't allow enough flexibility to control in which situation which counter should be
updated with which delay.

## Sidekiq unique jobs to the rescue

Sidekiq enterprise supports scheduling [unique jobs](https://github.com/mperham/sidekiq/wiki/Ent-Unique-Jobs#use)
based on queue, worker class and worker arguments.

This allows us to schedule a worker for updating the counter value when the first request for a tour appointment
comes in.
Every additional request creating shipments for the same tour appointment will now only schedule another worker if
there is no worker for this tour appointment in the queue.
This reduces the number of update queries on the tour appointment significantly.

```ruby
# api/shipments_controller.rb
class Api::ShipmentsController < ApplicationController
  def create
    shipment = Shipment::Create.call(params)

    TourAppointment::CalculateShipmentCountWorker
      .perform_in 10.seconds, shipment.tour_appointment_id 
  end
end

# workers/calculate_shipment_count_worker.rb
class TourAppointment::CalculateShipmentCountWorker
  include Sidekiq::Worker

  # we can schedule another job for the same tour appointment if the job didn't get
  # executed after 10 seconds or if the execution already started
  sidekiq_options unique_for: 10.seconds, unique_until: :start

  def perform(tour_appointment_id)
    appointment = TourAppointment.find(tour_appointment_id)
    appointment.update_columns shipment_count: appointment.shipments.count 
  end
end
```

This allows us to handle 3 cases:
* use a bigger delay for the counter calculation in places where the load can be high (our API)
* reuse the worker to update the counter in other places where we don't need a big delay by using `perform_async`.
* calculate the counter synchronously in cases where we need to make sure we get up-to-date counter
  values in the same request by using a normal update in the controller
  
This allows us to avoid N+1 queries by using counter cache columns and also avoid the performance issue
if many requests try to update the counter value for the same record at the same time.

## Takeaway, TL;DR

There are many different approaches to handle N+1 `COUNT(*)` queries:
* [Rails counter caches](#counter-caches)
* [the `counter_culture` gem](#counter-culture), e.g. for conditional counters
* [SQL sub-selects](#sub-selects)
* [SQL sub-selects with virtual attributes](#virtual-attributes)

If updating the counter cache value
[happens in a place with potentially high load](#parallel-updates-during-request-spikes)
and many requests try to update the
counter on the same record in parallel Rails counter caches can lead to performance issues because requests
have to wait for each other because of the database lock during the SQL update queries for the counter.

This can be solved by
* removing the counter cache and using [SQL sub-selects](#sub-selects)
* delaying the calculation with [the `counter-cache` gem](#delayed-counter-cache-calculation)
* delaying the calculation with custom [unique sidekiq jobs](#sidekiq-unique-jobs-to-the-rescue)

**Problems solved!**

We can go home now and enjoy our afternoon!

<div style="width:100%;">
  <img src="/images/posts/counter-caches-as-the-problem/success.gif">
</div>
<div style="text-align: center"><a href="https://giphy.com/gifs/mrw-week-job-4xpB3eE00FfBm">via GIPHY</a></div>
