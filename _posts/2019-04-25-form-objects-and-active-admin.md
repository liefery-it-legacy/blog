---
layout: post
title: "Form objects and ActiveAdmin: There is a way!"
date: 25-04-2019
author: Irmela Göhl and Tam Eastley
tags: activeadmin form objects ruby inherited resources
excerpt:
---

We introduced form objects into our code base about a year ago, and since then we've slowly been trying to integrate them into our project more and more. We have a handful of them, but they are all a little bit different and implement similar things in slightly different ways. Refactoring them to all be the same seemed easy enough, but there one problem, we use [ActiveAdmin](https://activeadmin.info/).

<div style="width:100%;height:0;padding-bottom:56%;position:relative;"><iframe src="https://giphy.com/embed/1isfHC4xV65mvjqGth" width="100%" height="100%" style="position:absolute" frameBorder="0" class="giphy-embed" allowFullScreen></iframe></div><p><a href="https://giphy.com/gifs/1isfHC4xV65mvjqGth">via GIPHY</a></p>

ActiveAdmin is great for quickly putting together simple CRUD based user interfaces, but as soon as your forms become more complex and more workflow based, things get a bit tricky. Soon you'll find yourself with lots of form specific validations in your models and things can quickly get out of hand.

There are a few different ways to use form objects, and they correspond to your controller actions: `new/create`, and `edit/update`. This blogpost will focus on form objects that use the `new` and `create` actions. In the future we hope to publish some more blgposts about `edit/update` as well as form objects with nested resources. We are also assuming you already know what a form object is. If you don't, [this is a good (albeit a slightly out of date) introduction](https://thoughtbot.com/blog/activemodel-form-objects).

### What is ActiveAdmin doing?

One of the big problems we ran up against was trying to weed out what is ActiveAdmin and what is actually something else. One of ActiveAdmin's strong points is drying up your controllers. For example, if you're just using all the basic actions in your controller and you're not doing anything beyond that, ActiveAdmin gives you the ability to just not write any of those actions. If you have a user in your application who has a name and an email address, your controller will look like this:

```ruby
ActiveAdmin.register User do
  permit_params :name, :email
end
```

And :tada:, with just three lines of code you can do all the things. However, this magic doesn't actually come from ActiveAdmin. It comes from [Inherited Resources](https://github.com/activeadmin/inherited_resources) which is a dependency of ActiveAdmin and which is also now maintained by the ActiveAdmin organization. And if you want to use form objects with ActiveAdmin, you might find yourself digging in the Inherited Resources source code every once in a while. Fortunately, ActiveAdmin's methods have inline documentation and (at least in our case) explicitly tell you when they are using Inherited Resources.

### Let's get started

#### Using build_new_resource

In a standard Rails project that uses form objects, you are able to just define and instantiate your form object in the `new` and `create` actions of your controller. However, as we've just learned, Inherited Resources gives you all of these controller actions already, so you can either overwrite them, or _instead_ you can _just_ overwrite ActiveAdmin's `build_new_resource` method. This is what we are doing.

```ruby
def build_new_resource
  MyFormObject.new
end
```

Doing this makes sure your hidden Inherited Resources `new` and `create` actions are using your form object. [According to the docs](https://github.com/activeadmin/activeadmin/blob/master/lib/active_admin/resource_controller/data_access.rb#L126), this method "uses the method_for_build provided by inherited resources". [The Inherited Resources docs](https://github.com/activeadmin/inherited_resources/blob/master/lib/inherited_resources/base_helpers.rb#L188) say that `method_for_build` "returns the appropriated method to build the resource". A `resource` here is the object you're handling in your in your controller.

#### Handling your params

So you've overwritten `build_new_resource` and you're ready to submit your form, but what happens to all your params? Normally they're handled by your controller, but now they need to be passed to your form object.

We had handled our params differently across a few of our form object controllers. As you can see, in some places we were using ActionController's `permit` method, in some places we were using ActiveAdmin's `permit_params`, in another place were were just accessing keys from the `params` hash, and somewhere else we were using `resource_params`. We decided that we wanted to streamline this and come up with one way to handle params across all controllers (even if there were potentially multiple ways to do it).

```ruby
  # old code example 1
```

```ruby
  # old code example 2
```

After some experimentation we decided to embrace, instead of fight, ActiveAdmin, and came up with the following solution which was easily replicated across all our controllers that only required `new` and `create` methods.

```ruby
  # new and beautiful code example 3
```

(some explanation of the new code example)

<div style="width:100%;height:0;padding-bottom:56%;position:relative;"><iframe src="https://giphy.com/embed/BpRyocAi6VDBFol4bj" width="100%" height="100%" style="position:absolute" frameBorder="0" class="giphy-embed" allowFullScreen></iframe></div><p><a href="https://giphy.com/gifs/foxtv-BpRyocAi6VDBFol4bj">via GIPHY</a></p>

In the process, we learned a few things.

* When you add `permit_params` to the top of your ActiveAdmin controller, this defines for you a `permitted_params` method which returns your params to you as an `ActionController::Parameters` object. Interestingly, `permitted_params` comes from Inherited Resources. [According to the docs](https://github.com/activeadmin/inherited_resources#strong-parameters): "If your controller defines a method named `permitted_params`, InheritedResources
will call it where it would normally call params." This is yet another place where ActiveAdmin and Inherited Resources are heavily intertwined.
* Because `build_new_resource` is used both for the `new` and the `create` action, it needs to be able to handle both a hash with values, and an empty hash.
* Inherited Resources also comes with a `resource_params` method, which returns the permitted parameters in an array (ex: `[ActionController::Parameters{"name" => "Buffy Summers", "email" => "vampire_hunter@example.com}]`). Without our gained knowledge of `permitted_params`, we were sometimes trying to access our params by calling `resource_params.first` which doesn't look or feel very nice. We're glad that we can get rid of that. [The docs also suggest overriding this]((https://github.com/activeadmin/inherited_resources#strong-parameters)), but this seems unnecessary when using ActiveAdmin's `permit_params` method.



