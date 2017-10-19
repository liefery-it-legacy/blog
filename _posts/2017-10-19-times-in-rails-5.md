---
layout: post
title:  "Time zone aware columns in Rails 5"
date:   2017-10-19
categories: rails rubyonrails time postgres upgrade timezone ruby
---

Our backend application is running on Rails 4.2 (Ruby 2.4.2), and we've been eager to upgrade to Rails 5 for ages. We do weekly retrospectives here at Liefery, and almost every week for the last few months, someone has said that they wish we could upgrade to Rails 5.

Once all our gems were updated and Rails 5 compatible, the upgrade ticket was scheduled, and the big day arrived! After some back and forth with our Gemfile, we had Rails pinned to version 5.0.6 and we pushed our code up to Github to see what Jenkins had to say about it.

Jenkins was not happy (for many reasons), but one particularly scary reason jumped out in the form of a deprecation warning.

```
DEPRECATION WARNING: Time columns will become time zone aware in Rails 5.1. This still causes `String`s to be parsed as if they were in `Time.zone`, and `Time`s to be converted to `Time.zone`.

To keep the old behavior, you must add the following to your initializer:

    config.active_record.time_zone_aware_types = [:datetime]

To silence this deprecation warning, add the following:

    config.active_record.time_zone_aware_types = [:datetime, :time]
```

I'm not sure about you, but it doesn't matter how many times I read this deprecation warning, I can't understand what it's trying to tell me. So let's just ignore it for now and try to figure out what's happening on our own with an example. Since we'll need to compare Rails 4 with Rails 5 behaviour, let's start with something we're already familiar with, Rails 4.

### Rails 4

*At the time of writing, I am in Berlin, and we are still on summer time (CEST), which means we are 2 hours ahead of UTC.*

For this example, let's pretend we have a store model (I'm going to call it "CornStore", it sells corn) and that store wants to have a sale that will start on a certain date at a certain time. The store also opens every day at the same time, the date doesn't matter here. Since we use postgres 9.6.1 at Liefery, our store's database will be the same. Let's run a migration and see what that looks like:

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

If we take a look at our `structure.sql`, it looks like this:

```ruby
CREATE TABLE corn_stores (
    id SERIAL PRIMARY KEY,
    sale_starts_at timestamp without time zone,
    opening_time time without time zone
);
```

Let's add some data in there. My current time is October 19th, 11:40 am CEST.

```ruby
corn_store = CornStore.create!(sale_start_at: Time.current + 1.day, opening_time: Time.zone.parse("09:00"))
corn_store.reload

corn_store.sale_start_at
# => Fri, 20 Oct 2017 11:24:31 CEST +02:00
corn_store.opening_time
# => "2000-01-01T07:00:00.000Z"
```

This looks weird. Let's double check postgres before we make any assumptions:

```sql
select sale_start_at from corn_stores where id = 1;

#      sale_start_at
# --------------------------
# 2017-10-20 09:40:36.513386

select opening_time from corn_stores where id = 1;

# opening_time
# -------------
#   07:00:00
```

There are a few interesting things going on here.

1. Our `sale_start_at` value is stored in postgres in UTC. This is a bit confusing though, because it doesn't actually say "UTC" anywhere.
2. When we're in the rails console, ActiveRecord delivers the `sale_started_at` value back to us as an ActiveSupport::TimeWithZone object. Our application knows our timezone because it's set in a yaml file as "Berlin". If I were to change that to "London", we would get "Fri, 20 Oct 2017 10:40:36 BST +01:00" back as a value instead of "Fri, 20 Oct 2017 11:24:31 CEST +02:00". This means our datetime column is *time zone aware*. It knows what timezone the application is in and serves us back our value based on that.
3. Our `opening_time` value in postgres is just a time (no date!). It's also in UTC, which again, is confusing.
4. When we're in the rails console, ActiveRecord delivers the `opening_time` value back to us as a Time object, which... confusingly... now has a date attached to it and that date is January 1st, 2000 (this just seems to be the dummy value which [originates from the founding of Rails](https://github.com/rails/rails/blob/b3df95985a449fd155868b4ec04a556530a03e6c/activerecord/lib/active_record/connection_adapters/abstract/schema_definitions.rb#L78)). It's also still in UTC. The value wasn't translated to Berlin time for us. This means our time column is *not time zone aware*. It doesn't know the time of our application, and it doesn't care.

If we now look back at our deprecation warning, things are starting to make a bit more sense. In Rails 4, datetime columns were already time zone aware. So to keep this behaviour in Rails 5, we can add `config.active_record.time_zone_aware_types = [:datetime]` to the `application.rb` (this will silence the deprecation warning). If you were to repeat all the exercises in a Rails 5 project with the above configuration, you'd get the exact same results.

## Rails 5

Let's try out the new - **and Rails 5.1 default** - behaviour. In a Rails 5 project, let's add `config.active_record.time_zone_aware_types = [:datetime, :time]` to our `application.rb` and exit out of and then into the console again (just to make sure everything's reloaded properly). Let's revisit that old corn store and see what's different.

```ruby
corn_store = CornStore.last

corn_store.sale_start_at
# => Fri, 20 Oct 2017 11:24:31 CEST +02:00
corn_store.opening_time
# => Sat, 01 Jan 2000 08:00:00 CET +01:00
```

Something's changed! Here you can see that instead of getting a Time object back for the `opening_time`, we've gotten a ActiveSupport::TimeWithZone object. Like the deprecation warning suggested, it has become *time zone aware*. We set the value as 9am CEST, it was saved to postgres as 7am UTC and it was returned to us as 8am CET (winter time)! This is unfortunate, because it's not even a little bit the time that we wanted.

How you deal with this change is up to you. We decided that using the new configuration would be quite problematic for us and switching to the new behaviour would throw our times off by an hour - not a good idea for a delivery company! Our current course of action the is just to use the `config.active_record.time_zone_aware_types = [:datetime]` configuration and discuss a possible future refactoring.

As a final point, it's worth mentioning that the deprecation warning here is really confusing. If you want to get rid of the deprecation warning, you have to add this configuration option to your Rails 5 project regardless. It's important though that you and your team decide which configuration is right for your project.

Maybe this is a good way of thinking about it: which columns in your application should be time zone aware?

* To keep the old behaviour and only have datetime columns be timezone aware, use `[:datetime]`.
* To use the new behaviour and have time columns also be timezone aware, use `[:datetime, :time]`.
