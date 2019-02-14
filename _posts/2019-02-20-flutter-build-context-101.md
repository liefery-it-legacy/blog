---
layout: post
title: "todo "
date: todo
author: Ali Churcher
tags: todo
excerpt: "todo"
---

For the last few months I've been working on Liefery's Flutter team to help rewrite our android app with a more modern Framework. Coming from a background of zero app development I've found Flutter surprisingly beginner friendly. Its amazing documentation and tutorials allow you to start building screens fast - sometimes so fast that you don't stop to properly learn the fundamentals.
In this post I want to talk about a situation that required me step back and learn one of Flutters core concepts - the BuildContext of Widgets.

 The first thing you learn in flutter is that everything is a widget. Not just small components of the page like a form or a menu, but _everything_. A single button is a widget. A line of text is a widget. Padding and margins are also achieved with widgets. After a long day at the office you start to question if you too are widget.

 ![monkey looking at self in mirror](/images/posts/flutter/existential_crisis_monkey.jpg)


Each widget is created from a `build` method, and every build method takes a `BuildContext` as an argument.
```Dart
 build(BuildContext context) {
   // return widget
 }
```
This BuildContext describes where you are in the tree of widgets of your application.  I learnt that it's easy to ignore BuildContext completely. Just slap in a parameter when you write a build function and forget about it. This lazy approach served me well until the day I needed to create a SnackBar.

![snackbar popup dialog on a phone](/images/posts/flutter/snackbar_bottom_only.png)


Let's delve into what it takes to display a SnackBar, and why it is relevant to understand the BuildContext.

## Creating and Displaying a SnackBar
A SnackBar is easy to create:


```dart
mySnackBar = SnackBar(content: "Saving all changes...")
```
(Note that you can ommit the `new` keyword when calling constructors such as `SnackBar()`)

This `mySnackBar` is now created but not visible. To display it on the screen we must use `Scaffold`. A Scaffold is the way to display Material elements such as AppBar, Body, and SnackBars.
Different screens will each have their own Scaffold and display different content in the appBar and the body.

(image of app with heading (appbar)  content (body) and a dialog(snackbar) with labels)

To display the SnackBar on the screen you simply get the Scaffold with a method called Scaffold.of then call `showSnackBar`.

```dart
Scaffold.of(context).showSnackBar(myCoolSnackBar)
```

Let's try it out.

In the code below we are creating a Scaffold.
Inside the scaffold we create an app bar with a title, and a body. In the body we create a button that, when pressed, will display the snackbar.

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
Sadly when we try to run this we get the following error.

Show error screen on phone?
```error
Scaffold.of() called with a context that does not contain a Scaffold.
```

From the looks of StackOverflow this is a very common first error for people like myself who hadn't bothered to understand the BuildContext.


To find out what went wrong we need to know what this Of() function really does.

## Of

  `Scaffold.of(context)`  says: From the given `BuildContext`, return the nearest Scaffold widget.
This `of` method can be used elsewhere for example `Theme.of(context)` takes the supplied context and returns the nearest Theme.

So putting that all together, the line that caused the failure:
```dart
Scaffold.of(context).showSnackBar(myCoolSnackBar)
```
says “Go and find me the nearest Scaffold to the given BuildContext and then display myCoolSnackBar inside it."
It could not find a Scaffold in the given BuildContext, even though we created a Scaffold in the code block above.

 ## So what is the BuildContext?

_Each widget has its own BuildContext, which becomes the parent of the widget returned by the StatelessWidget.build_ _-Flutter docs_

(image of a blue widget with a red widget Inside)

Lets say we are inside the Build method for the red widget; a method that returns a red widget. The context that this build method receives is not the red widget, but rather a reference to the parent/Blue widget. If you think about it this makes sense, if we haven’t built the red widget yet, how could the context possibly be a reference to this unbuild widget?

## So what caused the error
We know that Scaffold.of takes the given context and finds the nearest scaffold. And even though we create a Scaffold, we also know that the `context` provided to the build Function is not the widget itself, but rather it's parent - a parent who has no scaffold.
As a result Scaffold.of(context) finds no Scaffold and throws an error.

## A solution
We need to call `Scaffold.of(context)`  providing a context that is a child of our new scaffold.
Luckily Flutter has just the tool for creating a new buildContext.

```dart
class SendEmailScreen extends StatelessWidget {
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
Image of working snackbar.

BuildContext is an important part of Flutter environment, but from looking at stackoverflow, I'm not the first person who ignored it until it came time to render a snackBar.
So be warned, always learn the fundamentals!
