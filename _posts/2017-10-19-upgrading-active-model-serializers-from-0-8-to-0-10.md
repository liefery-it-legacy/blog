---
layout: post
title: "Upgrading ActiveModelSerializers from 0.8 to 0.10"
date: 2017-10-19
author: Adam Niedzielski
categories: ruby rails rubyonrails api json active_model_serializers
---
This blog post presents our battle story from upgrading ActiveModelSerializers
from version 0.8 to 0.10. Version 0.10 introduces significant changes in the
library, including **backwards incompatible changes**. That's totally
understandable, the library is before version 1.0, which, at least according
to Semantic Versioning, means that it's 100% experimental. That said, it's also
a popular solution in the Ruby / Rails community and it has been around for
quite a while.

In the past the version 0.8 received a lot of fixes when the version 0.10 was
already in development, so the pressure to upgrade was lower. However when we
started preparing for Rails 5 upgrade we decided that it's safer to upgrade
ActiveModelSerializers first, because version 0.8 may not be compatible with
Rails 5.

## First try

At first we attempted to follow the
[official upgrade guide](https://github.com/rails-api/active_model_serializers/blob/0-10-stable/docs/howto/upgrade_from_0_8_to_0_10.md)
found in the gem documentation. It lists the breaking changes and provides
patches that bring back the old behaviour.

We applied the patches, run our test suite, and... saw a lot of red. The
thing with monkey patches is that they are helpful when they work out of the
box. When they don't work and you have to debug these patches and develop
patches for the patches, their value diminishes.

The code snippets in the guide are certain solutions, but it's difficult to
say which backwards incompatibility a given line attempts to solve. When you
copy someone else's code to your repository you have to "adopt it". This means
that you have to be able to **understand and justify every single line of the
code**.

After a few hours of debugging our failing tests without any success we
decided to start from scratch, avoid using monkey patches and update our code
instead. We knew that it would take a few days of work (we have a lot of
serializers), but in the end we would end up with code that uses the latest
syntax and requires no ugly hacks.

## Second try

We developed the following upgrade procedure:

1. create a list (as a Google Doc) of known breaking changes based on the
[guide](https://github.com/rails-api/active_model_serializers/blob/0-10-stable/docs/howto/upgrade_from_0_8_to_0_10.md)
2. update the version of ActiveModelSerializers
3. run our test suite to get the number of failing tests
4. go through the breaking changes, try to estimate their impact (some of
   them don't apply to our codebase) and suggest potential solutions
5. fix one breaking change and see if the number of failing tests decrease
6. focus on one failing test and debug which breaking change causes the failure
7. if it's not in the list, add it there and repeat the same procedure

We ended up with a clear write-up that lists all breaking changes that we
found, discusses their impact, available solutions and the possibility of
slipping through our tests. This list proved to be **incredibly helpfulfor code
reviewers** and forms the basis for this blog post.

I'm definitely not claiming that it's complete or that the presented solutions
will work for everybody. This is what we had to consider in our codebase and
what worked for us. That said, I still think that it may be helpful for other
people.

## Breaking changes and solutions

### Redefined concept of serializer

In 0.8 serializer was "an object that can give you JSON". Because of that we
had a lot of code that looked like this:

```ruby
render(
  json: Api::ActiveAdmin::ServiceAreaMapSerializer.new(service_area)
)
```

or even this:

```ruby
render json: Api::Internal::UserSerializer.new(current_user).to_json
```

We also used serializers directly in views to generate initial data for
AngularJS components.

In 0.10 the
[definition of a serializer](https://github.com/rails-api/active_model_serializers/blob/v0.10.6/README.md#architecture)
is different:

> [Serializer] allows you to specify which attributes and associations should
be represented in the serialization of the resource. It requires an adapter to
transform its attributes into a JSON document; **it cannot be serialized
itself**.

This means that we have to go through all the places where we called a
serializer and rewrite it to:

```ruby
render(
  json: current_user,
  serializer: Api::Internal::UserSerializer
)
```

Outside of the controller context we have to rewrite the code to use
`ActiveModelSerializers::SerializableResource`:

```ruby
ActiveModelSerializers::SerializableResource.new(
  @tour_appointment,
  serializer: Api::ActiveAdmin::TourAppointmentSerializer,
  adapter: :attributes
).to_json
```

### Nested relationships are no longer walked by default

I was really scared when I read about this breaking change. We definitely have
a lot of places where we include nested records and we heavily rely on the
previous behaviour. Fortunately I quickly find a
[configuration option to specify that globally](https://github.com/rails-api/active_model_serializers/blob/v0.10.6/docs/general/configuration_options.md#default_includes).

```ruby
ActiveModelSerializers.config.default_includes = "**"
```

This worked like a charm, yay!

### Root key

In our API responses we use the following structure:

```json
{
  "user": {
    "name": "Adam"
  }
}
```

or (for multiple records):

```json
{
  "users": [
    {
      "name": "Adam"
    }
  ]
}
```

`user` and `users` are called "root key" of the JSON document. We found several
breaking changes here.

#### Specifying root key

We used the following ways to specify it:

```ruby
class UserSerializer < ActiveModel::Serializer
  self.root = "application_user"
end
```

or:

```ruby
class UserSerializer < ActiveModel::Serializer
  root "application_user"
end
```

They both stopped working after the upgrade and we had to change it to:

```ruby
class UserSerializer < ActiveModel::Serializer
  type "application_user"
end
```

#### Root key not included in JSON

After that we noticed that the root key is not included at all in the JSON
structure, so we have:

```json
{
  "name": "Adam"
}
```

instead of:

```json
{
  "user": {
    "name": "Adam"
  }
}
```

To fix that we have to configure `json` as the adapter (the new library default
is `attributes`).

```ruby
ActiveModelSerializers.config.adapter = :json
```

#### Default root key

The next interesting breaking change is related to what happens when the root
key is not explicitly specified. **In 0.8 it is derived from the serializer
name. In 0.10 it is derived from the model name.**

In our case this means that when we pass `TourShipment` model to
`ShipmentSerializer` the root key will change from `shipment` to
`tour_shipment`.

The solution was to specify root key explicitly in all these ambiguous cases.
Yay explicit code!

#### Empty array

And last, but not least, an important edge case for automatically deriving the
root key from model name. One of our failing tests revealed that if you want
to serialize an empty array it will give you an empty string as the root key,
so the output looks like:

```json
{
  "": []
}
```

To make it even more interesting, when you pass an empty Active Record
relation, ActiveModelSerializers will correctly derive the name. This magic can
burn you if at some point you decide to use `.to_a` to preload the relation.

**This convinced us that we should not rely on implicitly derived root key at
all**. We configured it explicitly in every single serializer that we use. Yay
explicit code again!

### `include_*?` methods no longer work

We had following code:

```ruby
class UserSerializer < ActiveModel::Serializer
  attributes :name, :email, :level

  def include_name?
    object.name.start_with?("a")
  end
end
```

This will include `name` key in JSON output only when `include_name?` returns
true. This stopped working in 0.10 which means that the key will always be
included regardless of the return value of `include_name?`.

That's quite scary, especially when you use this feature to remove
attributes that are sensitive in a certain context and should not be included
for security purposes.

The new syntax is:

```ruby
class UserSerializer < ActiveModel::Serializer
  attributes :email, :level
  attribute :name, if: :awesome_name?

  def awesome_name?
    object.name.start_with?("a")
  end
end
```

This is relatively simple, mechanical change. I'm happy to see the old syntax
gone, because it makes it difficult to connect the attribute with the method
that is responsible for its conditional inclusion. When your serializer class
doesn't fit in a single screen this makes it really easy to overlook.

### URL helpers are no longer automatically available

Instead of:

```ruby
class UserSerializer < ActiveModel::Serializer
  attributes :profile_link

  def profile_link
    profile_path(object)
  end
end
```

You have to do:

```ruby
class UserSerializer < ActiveModel::Serializer
  attributes :profile_link

  def profile_link
    Rails.application.routes.url_helpers.profile_path(object)
  end
end
```

### `@options` changed to `instance_options`

Simple, mechanical change, nothing to worry here.

### Attributes with question mark

```ruby
class UserSerializer < ActiveModel::Serializer
  attributes :admin?
end
```

In 0.8 this will give you:

```json
{
  "user": {
    "admin": true
  }
}
```

In 0.10 it gives you:

```json
{
  "user": {
    "admin?": true
  }
}
```

Please mind the extra question mark! In other words, version 0.8 was implicitly
stripping question marks for field names in output.

The solution:

```ruby
class UserSerializer < ActiveModel::Serializer
  attributes :admin

  def admin
    object.admin?
  end
end
```

### Serializing Plain Old Ruby Objects

In version 0.8 we were using following code to serialize Plain Old Ruby
Objects:

```ruby
class PackageSummary
  include ActiveModel::SerializerSupport

  attr_accessor :package_size, :count
end
```

This stopped working in 0.10. We explored different options, but in the end we
asked ourselves a question "what kind of interface do we actually need?". We
realised that for PORO ActiveModelSerializers needs `model_name` to
automatically derive root key, and it needs to read the attributes.

However, if we explicitly specify the root key and we explicitly specify how
to get the attributes, not further adapter is needed:

```ruby
class PackageSummary
  attr_accessor :package_size, :count
end

class PackageSummarySerializer < ActiveModel::Serializer
  type "package_summary"

  attributes :package_size, :count

  delegate :package_size, :count, to: :object
end
```

### No default serializer when serializer doesn't exist

We were always specifying the serializer explicitly so this breaking change
did not apply to us.

### Attribute methods are no longer defined on the serializer

Before:

```ruby
class UserSerializer < ActiveModel::Serializer
  attributes :first_name, :last_name, :full_name

  def full_name
    "#{first_name} #{last_name}"
  end
end
```

After:

```ruby
class UserSerializer < ActiveModel::Serializer
  attributes :first_name, :last_name, :full_name

  def full_name
    "#{object.first_name} #{object.last_name}"
  end
end
```

Please notice that now you have to explicitly refer to `object`. I like the
clarity here, and we were not using the old version much anyway.

### Passing a `nil` resource to serializer now fails

At the beginning we were thinking that it didn't apply to our codebase. Why
would we try to return `nil` in the response? When an API client asks for a
single record then you typically return 404 when the record does not exist.
When the client asks for multiple records then you return an empty array.

However, our tests caught one place where we did that:

```ruby
address = current_user.default_pick_up_address
current_user.update!(default_pick_up_address: nil)
render(
  json: address,
  Api::Client::Customer::AddressSerializer
)
```

Here we remove the default address and return it in the response. Looks fine at
first glance. Then you realise that the address may already be `nil` when we
try to remove it. We pass `nil` to the serializer and this triggers an
exception. Watch out for cases like this!

## Results

Updating AMS took us about 5 developer days. We have 2195 lines of code in
`app/serializers` and 107 serializers. After deploying the code to production
we didn't identify any regressions related to the upgrade.

Take-aways:
1. Usually it makes sense to upgrade using backwards compatibility patches and
   then slowly remove the patches.
2. However, there are no silver bullets and sometimes performing a full upgrade
   is more cost-effective.
3. Make a list of breaking changes, share it in your team, and work through it.
4. Tests for serializers are more helpful than you may think.
