---
layout: post
title: "Flutter for newbies: why you should care about the BuildContext"
date: 15-02-2019
author: Ali Churcher
tags: flutter snackbar scaffold of buildcontext dart
excerpt: "In this post I want to talk about a situation that required me step back and learn one of Flutter's core concepts - the BuildContext of Widgets."
---

For the last few months I've been working on Liefery's Flutter team to help rewrite our Android app with a more modern framework. Coming from a background of zero mobile development I've found Flutter surprisingly beginner friendly. Its amazing documentation and tutorials allow you to start building screens fast - sometimes so fast that you don't stop to properly learn the fundamentals.
In this post I want to talk about a situation that required me step back and learn one of Flutters core concepts - the `BuildContext` of widgets.

 The first thing you learn in flutter is that everything is a widget. Not just small components of the page like a form or a menu, but _everything_. A single button is a widget. A line of text is a widget. Padding and margins are also achieved with widgets. After a long day at the office you start to question if you too are widget.

 <figure>
 <img  alt="monkey looking at self in mirror" src="/images/posts/flutter/existential_crisis_monkey.jpg" />   <figcaption>Photo by Andre Mouton on Unsplash.</figcaption>
 </figure>

Every widget in Flutter is created from a `build` method, and every build method takes a `BuildContext` as an argument.
```dart
 build(BuildContext context) {
   // return widget
 }
```
This build context describes where you are in the tree of widgets of your application.  I learnt that it's easy to ignore the build context completely. Just slap in a parameter when you write a build function and forget about it. This lazy approach served me well until the day I needed to create a [snackbar](https://material.io/design/components/snackbars.html); the small pieces of information that pop up at the bottom of your screen.

![snackbar popup dialog on a phone](/images/posts/flutter/snackbar_bottom_only.png)


Let's delve into what it takes to display a snackbar, and why it is relevant to understand the build context.


## Creating and Displaying a snackbar
A snackbar is simple to create:

```dart
mySnackBar = SnackBar(content: "Saving all changes...")
```
(Note that you can omit the `new` keyword when calling constructors such as `SnackBar()` in the Dart language).


`mySnackBar` is now created but not visible. To display it on the screen we must use `Scaffold`.  A scaffold is the way to display [Material](https://flutter.io/docs/development/ui/widgets/material) elements such as the [app bar](https://docs.flutter.io/flutter/material/AppBar-class.html) (the top bar on the screen), body, or snackbars.
Different screens each have their own scaffold where they display different information into the body or app bar.

To display the snackbar on the screen you must get a reference to the scaffold with the method `Scaffold.of` then display the snackbar with the method `showSnackBar`

```dart
Scaffold.of(context).showSnackBar(myCoolSnackBar)
```

Let's try it out.

In the code below we are creating a `Scaffold`.
Inside the scaffold we create an `AppBar` with a `Title`, and a `Body`. In the Body we create a `RaisedButton` that, when pressed, will display the `SnackBar`.

```dart
class MyDocumentsScreen extends StatelessWidget {
   build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('My documents'),
      ),
      body: RaisedButton(
        child: Text("Save all"),
        onPressed: () => Scaffold.of(context)
            .showSnackBar(mySnackBar),
      ),
    );
  }
}
```
<img class="userDefined centered" src="/images/posts/flutter/sad.png" width="260"  />

When we click the button no snackbar is displayed, and the following error is printed to the console:

```error
Scaffold.of() called with a context that does not contain a Scaffold.
```

A quick search on [StackOverflow](https://stackoverflow.com/search?q=called+with+a+context+that+does+not+contain+a+Scaffold) reveals a bunch of questions with the exact error and indicates this is a common first error for people like myself who hadn't yet delved into the build context.


To find out what went wrong we need to know what this `of()` function really does.

## Of

  `Scaffold.of(context)`  says "From the given build context, return the nearest scaffold".
The `of` method can be used in many places in Flutter for example `Theme.of(context)` takes the supplied context and returns the nearest theme.

The line of code that caused the failure:
```dart
Scaffold.of(context).showSnackBar(myCoolSnackBar)
```
says “Go and find me the nearest scaffold to the given build context and then display myCoolSnackBar inside it."
So why did the error say that there was no scaffold in the given build context, even though we created a scaffold in the code block above?

## BuildContext


>Each widget has its own BuildContext, which becomes the parent of the widget returned by the StatelessWidget.build.  

<img class="userDefined" src="/images/posts/flutter/login_screen.png" width="245"  /><img class="userDefined" src="/images/posts/flutter/arrow.png" width="70"  /><img class="userDefined" src="/images/posts/flutter/full_screen_no_snackbar.png" width="250"  />

That means that if we are building the MyDocuments screen then the `BuildContext` in the `MyDocumentsScreen#build` method is the parent widget - in this case the Login Screen on the left side.

```dart
class MyDocumentsScreen extends StatelessWidget {
  build(BuildContext context) {
    //context is login screen
 }
```
If you think about it this makes sense. If we haven’t built the My Documents Screen widget yet, how could the build context possibly be a reference to this unbuilt widget?

## So what caused the error
We know that `Scaffold.of` takes the given context and finds the nearest visible scaffold. And even though we create a scaffold, we also know that the `BuildContext` provided to the build function is not the widget itself, but rather its parent - a parent who has no visible scaffold.
As a result `Scaffold.of(context)` finds no scaffold and throws an error.

## A solution
What we need is to call `Scaffold.of(context)`  providing a context that is a _child_ of our new scaffold.
Luckily Flutter has just the tool for creating a new build context. A class call `Builder`

>A platonic widget that calls a closure to obtain its child widget.

let's enclose the body code in a builder to create a new context:
```dart
class MyDocumentsScreen extends StatelessWidget {
   build(BuildContext context) {
    return Scaffold(
        appBar: AppBar(
          title: Text('My documents'),
        ),
        body: Builder(
          builder: (context) => //this new BuildContext has a reference to the scaffold
           RaisedButton(
                child: Text('Save all'),
                onPressed: () => Scaffold.of(context).showSnackBar(
                    SnackBar(content: Text('Saving all changes...'))),
              ),
        ));
  }
}
```
Success! We now have rendered a snackbar into our scaffold.

<img class="userDefined centered" display="block" src="/images/posts/flutter/snackbar.png" width="250"  />

Putting aside our disappointment that snackbars are unrelated to food, we can see the importance of the build context for the everyday task of rendering something into a scaffold after build time. As a Flutter beginner you will find the build context useful for much more, such as getting your current location for navigation, adding colour themes, and translating your text.


##### Enjoy Flutter!


<figure>
<img  alt="monkey looking at self in mirror" src="/images/posts/flutter/snacks.jpg" />   <figcaption>An improved snackbar.   Photo by rawpixel on Unsplash.</figcaption>
</figure>
