---
layout: post
title:  "Time zone aware columns in Rails 5"
date:   2017-10-19
categories: rails rubyonrails time postgres upgrade timezone ruby
---

Our backend application is running on Rails 4.2 (Ruby 2.4.2), and we've been eager to upgrade to Rails 5 for ages. We do weekly retrospectives here at Liefery, and someone mentions almost every week that they'd love for us to do the upgrade. Unfortunately, it wasn't as easy as just changing the version in our Gemfile and calling it a day. We were blocked for a while because of incompatible gems, so we kept our eyes open and upgraded these when possible.

Getting all our gems in order took some time, but once they were Rails 5 compatible we could finally start! After some back and forth with our Gemfile, we had Rails pinned to version 5.0.6 and we pushed our code up to Github to see what Jenkins had to say about it.

Jenkins was not happy (for many reasons), but one particularly scary reason jumped out in the form of a deprecation warning.

```
DEPRECATION WARNING: Time columns will become time zone aware in Rails 5.1. This still causes `String`s to be parsed as if they were in `Time.zone`, and `Time`s to be converted to `Time.zone`.

To keep the old behavior, you must add the following to your initializer:

    config.active_record.time_zone_aware_types = [:datetime]

To silence this deprecation warning, add the following:

    config.active_record.time_zone_aware_types = [:datetime, :time]
```

I'm not sure about you, but it doesn't matter how many times I read this deprecation warning, I can't understand what it's trying to tell me. So let's just put it aside it for now and try to figure out what's happening on our own with an example. Since we'll need to compare Rails 4 with Rails 5 behaviour, let's start with something we're already familiar with, Rails 4.

### Behaviour in Rails 4

*At the time of writing, I am in Berlin, and we are still on summer time (CEST), which means we are 2 hours ahead of UTC.*

For this example, let's pretend we have a store model (I'm going to call it "CornStore", it sells corn) and that store wants to have a sale that will start on a certain date at a certain time. For that we'll need a `datetime` column. The store also opens every day at 9 am, the date doesn't matter here, so for that we'll use a `time` column. Since we use postgres (version 9.6) at Liefery, our store's database will be the same. Let's do a migration and see what that looks like:

```ruby
rails generate migration AddTimesToCornStore sale_start_at:datetime opening_time:time
```

That creates the following migration:

```ruby
class AddTimesToCornStore < ActiveRecord::Migration
  def change
    add_column :corn_stores, :sale_start_at, :datetime
    add_column :corn_stores, :opening_time, :time
  end
end
```

After running `rake db:migrate`, if we take a look at our `structure.sql`, it looks like this:

```ruby
CREATE TABLE corn_stores (
    id SERIAL PRIMARY KEY,
    sale_starts_at timestamp without time zone,
    opening_time time without time zone
);
```

Let's add some data in there. My current time is October 19th, 11:24 am CEST.

```ruby
corn_store = CornStore.create!(
                sale_start_at: Time.current + 1.day,
                opening_time: Time.zone.parse("09:00"))
corn_store.reload

corn_store.sale_start_at
# => Fri, 20 Oct 2017 11:24:31 CEST +02:00
corn_store.sale_start_at.class
# => ActiveSupport::TimeWithZone

corn_store.opening_time
# => "2000-01-01T07:00:00.000Z"
corn_store.opening_time.class
# => Time
```

This looks weird. Why does the `opening_time` have such an strange date? And why is it a string? Why is its return value so different from `sale_start_at`? Let's double check postgres before we make any assumptions:

```sql
SELECT sale_start_at FROM corn_stores WHERE id = 1;

#      sale_start_at
# --------------------------
# 2017-10-20 09:24:31.513386

SELECT opening_time FROM corn_stores WHERE id = 1;

# opening_time
# -------------
#   07:00:00
```

There are a few interesting things going on here.

1. Our `sale_start_at` value is stored in postgres in UTC. This is a bit confusing though, because it doesn't actually say "UTC" anywhere.
2. When we're in the rails console, `ActiveRecord` returns the `sale_started_at` value as an `ActiveSupport::TimeWithZone` object. Our application knows our timezone because it's set in a yaml file as "Berlin". If I were to change that to "London", we would get "Fri, 20 Oct 2017 10:24:31 BST +01:00" back as a value instead of "Fri, 20 Oct 2017 11:24:31 CEST +02:00". This means our `datetime` column is *time zone aware*. It knows what timezone the application is in and returns our value based on that.
3. Our `opening_time` value in postgres is just a time (no date!). It's also in UTC, which again, is confusing.
4. When we're in the rails console, `ActiveRecord` returns the `opening_time` value as a `Time` object, which... confusingly... now has a date attached to it and that date is January 1st, 2000 (this just seems to be a dummy value which [originates from the early days of Rails](https://github.com/rails/rails/blob/b3df95985a449fd155868b4ec04a556530a03e6c/activerecord/lib/active_record/connection_adapters/abstract/schema_definitions.rb#L78)). It's also still in UTC. The value wasn't translated to Berlin time for us. This means our `time` column is *not time zone aware*. It doesn't know the time zone of our application, and it doesn't care.

If we now look back at our deprecation warning, things are starting to make a bit more sense. In Rails 4, `datetime` columns were already time zone aware. So to keep this behaviour in Rails 5, we can add `config.active_record.time_zone_aware_types = [:datetime]` to the `application.rb` (this will silence the deprecation warning). If you were to repeat all the exercises in a Rails 5 project with the above configuration, you'd get the exact same results.

### Behaviour in Rails 5

Let's try out the new - **and Rails 5.1 default** - behaviour. In a Rails 5 project, let's add `config.active_record.time_zone_aware_types = [:datetime, :time]` to our `application.rb` and exit out of and then into the console again (just to make sure everything's reloaded properly). Let's revisit that old corn store and see what's different. Remember, my original time was October 19th, 11:24 am CEST. My sale starts tomorrow (October 20th), and my store opens every day at 9am.

```ruby
corn_store = CornStore.last

corn_store.sale_start_at
# => Fri, 20 Oct 2017 11:24:31 CEST +02:00
corn_store.sale_start_at.class
# => ActiveSupport::TimeWithZone

corn_store.opening_time
# => Sat, 01 Jan 2000 08:00:00 CET +01:00
corn_store.opening_time.class
# => ActiveSupport::TimeWithZone
```

Something's changed! Here you can see that instead of getting a `Time` object back for the `opening_time`, we've gotten a `ActiveSupport::TimeWithZone` object. Like the deprecation warning suggested, it has become *time zone aware*. We set the value as 9am CEST, it was saved to postgres as 7am UTC and it was returned as 8am CET (winter time)! This is unfortunate, because it's not even a little bit the time that we wanted.

How you deal with this change is up to you. We decided that using the new configuration would be quite problematic for us as it would throw our times off by an hour - not a good idea for a delivery company! Our current course of action is just to use the `config.active_record.time_zone_aware_types = [:datetime]` configuration for now and discuss a possible future refactoring.

### Conclusion

Let's look at the deprecation warning again. What is it trying to tell us?

```
DEPRECATION WARNING: Time columns will become time zone aware in Rails 5.1. This still causes `String`s to be parsed as if they were in `Time.zone`, and `Time`s to be converted to `Time.zone`.

To keep the old behavior, you must add the following to your initializer:

    config.active_record.time_zone_aware_types = [:datetime]

To silence this deprecation warning, add the following:

    config.active_record.time_zone_aware_types = [:datetime, :time]
```

It makes more sense now, but the explanation for the suggested configuration options is wrong. If you want to keep the old behaviour, you have to add the first configuration option to your Rails 5 project. If you want to use the *entirely new behaviour*, you can instead add the second configuration option. You *have to* add one of these two configuration options to silence the deprecation warning.

Here's a good way of thinking about it: which columns in your application should be time zone aware?

* To keep the old behaviour and *only* have `datetime` columns be timezone aware, use `[:datetime]`.
* To use the new behaviour and have `time` columns *also* be timezone aware, use `[:datetime, :time]`.
