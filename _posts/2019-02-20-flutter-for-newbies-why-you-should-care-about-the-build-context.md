---
layout: post
title: "Flutter for newbies: why you should care about the BuildContext"
date: 20-01-2019
author: Ali Churcher
tags: todo
excerpt: "In this post I want to talk about a situation that required me step back and learn one of Flutters core concepts - the BuildContext of Widgets."
---

For the last few months I've been working on Liefery's Flutter team to help rewrite our android app with a more modern Framework. Coming from a background of zero app development I've found Flutter surprisingly beginner friendly. Its amazing documentation and tutorials allow you to start building screens fast - sometimes so fast that you don't stop to properly learn the fundamentals.
In this post I want to talk about a situation that required me step back and learn one of Flutters core concepts - the BuildContext of Widgets.

 The first thing you learn in flutter is that everything is a widget. Not just small components of the page like a form or a menu, but _everything_. A single button is a widget. A line of text is a widget. Padding and margins are also achieved with widgets. After a long day at the office you start to question if you too are widget.

 <figure>
 <img  alt="monkey looking at self in mirror" src="/images/posts/flutter/existential_crisis_monkey.jpg" />   <figcaption>Photo by Andre Mouton on Unsplash.</figcaption>
 </figure>

Every widget in Flutter is created from a `build` method, and every build method takes a `BuildContext` as an argument.
```Dart
 build(BuildContext context) {
   // return widget
 }
```
This BuildContext describes where you are in the tree of widgets of your application.  I learnt that it's easy to ignore BuildContext completely. Just slap in a parameter when you write a build function and forget about it. This lazy approach served me well until the day I needed to create a SnackBar; the small pieces of information that pop up at the bottom of your screen.

![snackbar popup dialog on a phone](/images/posts/flutter/snackbar_bottom_only.png)


Let's delve into what it takes to display a SnackBar, and why it is relevant to understand the BuildContext.


## Creating and Displaying a SnackBar
A SnackBar is simple to create:

```dart
mySnackBar = SnackBar(content: "Saving all changes...")
```
(Note that you can omit the `new` keyword when calling constructors such as `SnackBar()` in the Dart language).


`mySnackBar` is now created but not visible. To display it on the screen we must use `Scaffold`. A Scaffold is the way to display [Material](https://flutter.io/docs/development/ui/widgets/material) elements such as the AppBar (the top bar on the screen), Body, and SnackBars.
Different screens each have their own Scaffold where they display different information into the Body or AppBar.

To display the SnackBar on the screen you must get a reference to the Scaffold with the method `Scaffold.of` then display the SnackBar with `showSnackBar`.

```dart
Scaffold.of(context).showSnackBar(myCoolSnackBar)
```

Let's try it out.

In the code below we are creating a Scaffold.
Inside the scaffold we create an AppBar with a Title, and a Body. In the Body we create a button that, when pressed, will display the SnackBar.

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

When we click the button no SnackBar is displayed, and the following error is printed to the console:

```error
Scaffold.of() called with a context that does not contain a Scaffold.
```

A quick look at StackOverflow reveals that this is a very common first error for people like myself who hadn't yet delved into the BuildContext.


To find out what went wrong we need to know what this `of()` function really does.

## Of

  `Scaffold.of(context)`  says "From the given `BuildContext`, return the nearest Scaffold widget".
The `of` method can be used in many places in Flutter for example `Theme.of(context)` takes the supplied context and returns the nearest Theme.

The line of code that caused the failure:
```dart
Scaffold.of(context).showSnackBar(myCoolSnackBar)
```
says “Go and find me the nearest Scaffold to the given BuildContext and then display myCoolSnackBar inside it."
So why did the error say that there was no Scaffold in the given BuildContext, even though we created a Scaffold in the code block above?

## BuildContext


>Each widget has its own BuildContext, which becomes the parent of the widget returned by the StatelessWidget.build.  

<img class="userDefined" src="/images/posts/flutter/login_screen.png" width="245"  /><img class="userDefined" src="/images/posts/flutter/arrow.png" width="70"  /><img class="userDefined" src="/images/posts/flutter/full_screen_no_snackbar.png" width="250"  />

That means that if we are building the MyDocuments screen then the BuildContext in the Build method is the parent - in this case the Login Screen on the left side.

```dart
class MyDocumentsScreen extends StatelessWidget {
  build(BuildContext context) {
    //context is login screen
 }
```
If you think about it this makes sense, if we haven’t built the MyDocumentsScreen widget yet, how could the context possibly be a reference to this unbuild widget?

## So what caused the error
We know that Scaffold.of takes the given context and finds the nearest scaffold. And even though we create a Scaffold, we also know that the `context` provided to the build Function is not the widget itself, but rather it's parent - a parent who has no scaffold.
As a result `Scaffold.of(context)` finds no Scaffold and throws an error.

## A solution
What we need is to call `Scaffold.of(context)`  providing a context that is a _child_ of our new scaffold.
Luckily Flutter has just the tool for creating a new buildContext. A class call `Builder`

>A platonic widget that calls a closure to obtain its child widget.

let's enclose the body code in a Builder to create a new context:
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
Success! We now have rendered a SnackBar into our Scaffold.

<img class="userDefined centered" display="block" src="/images/posts/flutter/snackbar.png" width="250"  />

Putting aside our disappointment that SnackBars are unrelated to food, we can see the importance of the BuildContext for the everyday task of rendering something into a Scaffold after build time. As a Flutter beginner you will find the BuildContext useful for much more, such as getting your current location for navigation, adding colour themes, and translating your text.


#### Enjoy Flutter!


<figure>
<img  alt="monkey looking at self in mirror" src="/images/posts/flutter/snacks.jpg" />   <figcaption>Photo by rawpixel on Unsplash.</figcaption>
</figure>
