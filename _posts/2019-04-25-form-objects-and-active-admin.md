---
layout: post
title: "Form Objects and Active Admin: There is a way!"
date: 03-06-2019
author: Tam Eastley and Irmela Göhl
tags: active admin form objects ruby inherited resources
excerpt: We want to move towards using more form objects in our code base, but we first had to properly integrate them with Active Admin. Learn how we did it in this post.
---

We introduced form objects into our code base about a year ago. We have a handful of them, but we realized that despite being similar, they're all implemented in slightly different ways. We'd like to convert more of our code into form objects, but we first thought it would be a good idea to take a look at the ones we have and try to streamline them a bit. Refactoring seemed easy enough, but there's one issue to take into consideration, we use [Active Admin](https://activeadmin.info/).

<div style="width:100%;height:0;padding-bottom:56%;position:relative;"><iframe src="https://giphy.com/embed/1isfHC4xV65mvjqGth" width="100%" height="100%" style="position:absolute" frameBorder="0" class="giphy-embed" allowFullScreen></iframe></div><p><a href="https://giphy.com/gifs/1isfHC4xV65mvjqGth">via GIPHY</a></p>

Active Admin is great for quickly putting together simple CRUD based user interfaces, but as soon as your forms become more complex and more workflow based, things start to get tricky. Soon you'll find yourself with lots of form specific code in places it doesn't belong and things can quickly get out of hand.

### Introduction

#### What are we going to talk about?

This blogpost will focus on how to implement form objects with Active Admin. There are a few different ways to use them, and they correspond to your controller actions: `new/create`, and `edit/update`. We're just going to take a look at the `new` and `create` actions for now. In the future we hope to publish some more blogposts about `edit/update`, as well as form objects with nested resources. We are also assuming you already know what a form object is. If you don't, [this is a good (albeit a slightly out of date) introduction](https://thoughtbot.com/blog/activemodel-form-objects).

#### Why make the switch?

One of the reasons why we wanted to make the switch to form objects was because we had a few controllers like this one:

```ruby
ActiveAdmin.register Issue do
  belongs_to :project
  actions :new, :create

  permit_params :title, :short_description, :description

  controller do
    def create
      if description.empty?
        redirect_back fallback_location: parent_url,
                      flash: { error: I18n.t("active_admin.issues.description_required") }
      end

      if short_description.empty?
        redirect_back fallback_location: parent_url,
                      flash: { error: I18n.t("active_admin.issues.short_description_required") }
      end

      create! do |success, failure|
        success.html { redirect_to parent_url }
        failure.html { render :new }
      end
    end
  end
end
```

We've had to add some "fake" validations in our `create` method in order to make sure the `Issue` has a description and short description. This is only needed when creating a new `Issue` via the UI. We don't want to add model validations because maybe we don't care if all of our old issues have descriptions, or maybe this isn't needed when creating an issue via the Api. Controllers like this are annoying to test (especially as they grow) and are just begging to be turned into form objects, which are nice and compact and can be tested easily.

Another reason we wanted to make the switch is because we don't like using [`accepts_nested_attributes_for`](https://api.rubyonrails.org/classes/ActiveRecord/NestedAttributes/ClassMethods.html#method-i-accepts_nested_attributes_for). In the words of one of our colleagues, `accepts_nested_attributes_for` isn't nice to use because

> it adds methods to the model, which only serve to help with the forms. But why should a model care about forms?

If we switch to form objects, we can get rid of this and can still persist multiple records in one form.

Our old colleague, Tobi Pfeiffer, gave a great talk at Ruby on Ice and touched on form objects and when they're a good idea. [His talk is well worth a watch (also because there's bunny pictures).](https://rubyonice.com/speakers/tobias_pfeiffer)

### Let's get started

#### What is Active Admin doing?

One of the big problems we initially ran up against when trying to implement form objects was weeding out what is Active Admin and what is actually something else.

One of Active Admin's strong points is drying up your controllers. If you're just using all the basic actions in your controller and you're not doing anything beyond that, you don't actually have to write any of those actions. Your controller will be essentially empty. However, this magic doesn't come from Active Admin. It comes from [Inherited Resources](https://github.com/activeadmin/inherited_resources) which is a dependency of Active Admin and which is also now maintained by the Active Admin organization. And if you want to use form objects with Active Admin, you might find yourself digging through the Inherited Resources source code every once in a while. Fortunately, Active Admin's methods have inline documentation and (at least in our case) explicitly tell you when they are using Inherited Resources.


#### Using build_new_resource

In a standard Rails project that uses form objects, you are able to just define and instantiate your form object in the `new` and `create` actions of your controller. However, as we've just learned, Inherited Resources gives you all of these controller actions already, so you can either overwrite them and include your form object in them, or instead you can _just_ overwrite Active Admin's `build_new_resource` method. This is what we are doing and an example of how we refactored our controllers to incorporate form objects:

```ruby

ActiveAdmin.register Issue do
  belongs_to :project
  actions :new, :create, :index

  permit_params :title, :short_description, :description

  controller do
    def create
      create! do |success, failure|
        success.html { redirect_to parent_url }
        failure.html { render :new }
      end
    end

    def build_new_resource
      # This is our form object and it will handle our validations
      IssueForm.new(issue_params)
    end

    def issue_params
      # to be discussed
    end
  end
end
```

Doing this makes sure your `new` and `create` actions provided by Inherited Resources are using your form object. [According to the docs](https://github.com/activeadmin/activeadmin/blob/master/lib/active_admin/resource_controller/data_access.rb#L126), this method "uses the method_for_build provided by inherited resources". [The Inherited Resources docs](https://github.com/activeadmin/inherited_resources/blob/master/lib/inherited_resources/base_helpers.rb#L188) say that `method_for_build` "returns the appropriated method to build the resource". A `resource` here is the object you're handling in your in your controller, aka, your form object.

#### Handling your params

So you've overwritten `build_new_resource` and you're ready to submit your form, but what happens to all your params? We need to pass them to your form object.

Prior to our refactoring, we had handled our params differently across a few of our form object controllers. As you can see in the examples below, in some places we were using `ActionController::Parameters#permit`, in some places we were using Active Admin's `permit_params`, in another place were were just accessing keys from the `params` hash, and somewhere else we were using Active Admin's `resource_params` (this will be discussed below).


Accessing params directly from the params hash:
```ruby
ActiveAdmin.register Issue do
  belongs_to :project
  actions :new, :create, :index

  # Notice we didn't use Active Admin's permit_params here

  controller do
    def create
      # this doesn't change
    end

    def build_new_resource
      # this doesn't change
    end

    def issue_params
      issue_params = {
                        title:             params[:issue_form][:title],
                        short_description: params[:issue_form][:short_description],
                        description:       params[:issue_form][:description]
                      }
      default_params = { project: parent }
      default_params.merge(issue_params)
    end
  end
end
```

Using Active Admin's `resource_params`:
```ruby
ActiveAdmin.register Issue do
  belongs_to :project
  actions :new, :create, :index

  # Here we are using Active Admin's permit_params
  permit_params :title, :short_description, :description

  controller do
    def create
      # this doesn't change
    end

    def build_new_resource
      # this doesn't change
    end

    def issue_params
      default_params = { project: parent }
      issue_params   = resource_params.first

      default_params.merge(issue_params)
    end
  end
end
```

Using `ActionController:Parameters#permit`:
```ruby
ActiveAdmin.register Issue do
  belongs_to :project
  actions :new, :create, :index

  # We also didn't use Active Admin's permit_params here

  controller do
    def create
      # this doesn't change
    end

    def build_new_resource
      # this doesn't change
    end

    def issue_params
      issue_params = if params[:issue_form].present?
                        params.require(:issue_form).permit(
                          :project, :title, :short_description, :description
                        )
                      else
                        {}
                      end
      default_params = { project: parent }
      issue_params.merge(default_params)
    end
  end
end
```

We were obviously doing this so many different ways, and everytime we added a new form object we had to struggle with which never-really-defined guideline to follow.
After some experimentation we decided to embrace, instead of fight, Active Admin, and came up with the following solution.

```ruby
ActiveAdmin.register Issue do
  belongs_to :project
  actions :new, :create, :index

  permit_params :title, :short_description, :description

  controller do
    def create
      # this doesn't change
    end

    def build_new_resource
      # this doesn't change
    end

    def issue_params
      default_params = { project: parent }

      (permitted_params[:issue_form] || {}).merge(default_params)
    end
  end
end
```

With this solution we could remove a lot of code, we were using Active Admin's built in behaviour,
and we were handling both `new` and `create` actions. This solution was easily implemented across all our controllers.

<div style="width:100%;height:0;padding-bottom:56%;position:relative;"><iframe src="https://giphy.com/embed/BpRyocAi6VDBFol4bj" width="100%" height="100%" style="position:absolute" frameBorder="0" class="giphy-embed" allowFullScreen></iframe></div><p><a href="https://giphy.com/gifs/foxtv-BpRyocAi6VDBFol4bj">via GIPHY</a></p>

### What we learned

In the process of figuring this out, we got super familiar with `permit_params`. When you add it to the top of your Active Admin controller, this defines for you a `permitted_params` method which returns your params to you as an `ActionController::Parameters` object. Interestingly, `permitted_params` comes from Inherited Resources. [According to the docs](https://github.com/activeadmin/inherited_resources#strong-parameters):

> If your controller defines a method named `permitted_params`, InheritedResources
will call it where it would normally call params.

Sometimes we weren't using `permit_params`, but using this helper was a big step in allowing us to refactor everything nicely and make our controllers super clear. This is yet another place where Active Admin and Inherited Resources are heavily intertwined.

We also had to keep in mind that `build_new_resource` is used both for the `new` and the `create` action, so we need to be able handle a case where params are present, and where they are not.

We also spent some time looking at Inherited Resource's `resource_params` method, which returns the permitted parameters in an array. For example:

```ruby
[ActionController::Parameters{"name" => "Amy Santiago", "email" => "brooklyn_99@example.com}]`)
```

 Without our gained knowledge of `permitted_params`, we were sometimes trying to access our params by calling `resource_params.first` which doesn't look or feel very nice. We're glad that we can get rid of that. [The docs also suggest overriding this](https://github.com/activeadmin/inherited_resources#strong-parameters), but this seems unnecessary when using Active Admin's `permit_params` method.

### Conclusion

After making a plan and discussing refactoring our form objects, we were surprised to see that we hadn't touched our form objects at all! We'd just touched our controllers and how Active Admin integrates form objects. This means that our form objects are seriously decoupled from Active Admin, which is great for testing, and also if we someday decide to move parts of our code away from Active Admin.

