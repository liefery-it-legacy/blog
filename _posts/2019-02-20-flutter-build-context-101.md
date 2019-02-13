---
layout: post
title: "todo "
date: todo
author: Ali Churcher
tags: todo
excerpt: "todo"
---

I've been working with Flutter for a few months from a background involving zero app development. Flutter has amazing docs and is beginner friendly and as a result it is easy to get stuck in fast. Sometimes so fast that you don't stop to learn the fundamentals.
In this post I want to talk about a situation that required me step back and learn on of Flutters core concepts - the BuildContext of Widget.

 The first thing you learnt in flutter is that everything is a widget. Not just small components of the page like a form or a menu, but _everything_. A single button is a widget. A line of text is a widget; padding and margins are also widgets. After a long day at the office you start to question if you too are widget.


Each widget is created from a ‘build’ method, and every Build method takes a `BuildContext` as an argument.  One of the second things you learn in Flutter is that it’s pretty easy to ignore this BuildContext. That is until you need to create a SnackBar. A small piece of information like a dialog that disappears on it’s own.

A snack bar is easy to create
`myCoolSnackBar = new SnackBar(content: ‘Message successfully sent’)`
but there is only one way to display it so that it is visible and that is by using the `ScaffoldState`. A Scaffold is the way to display Material elements such as AppBar, body, and snackbars, and the Scaffold’s state is the part that does the heavy lifting.
Different screens will each have their own scaffold and display different content in the appBar and the body for example.
To show a Snackbar you simply get the ScaffoldState with a method called Scaffold.of then call showSnackBar.

`Scaffold.of(context).showSnackBar(myCoolSnackBar)``

Let's try it out:
Let’s make an attempt at creating a SnackBar:

```dart
class SendEmailScreen extends StatelessWidget {
   build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('My documents'),
      ),
      body: RaisedButton(
        child: Text('Save all'),
        onPressed: () => Scaffold.of(context)
            .showSnackBar(SnackBar(content: Text('Saving all changes...'))),
      ),
    );
  }
}
```

```error
Scaffold.of() called with a context that does not contain a Scaffold.
```
To find out what went wrong we need to know what this Of() function really does.

## Of

  `Scaffold.of(context)`  says: From the given context, return the nearest Scaffold.
This ‘of’ method can be used elsewhere for example ‘Theme.of(context) to get the nearest Theme.

The line that caused the failure:
`Scaffold.of(context)
    .showSnackBar(getSnackBar())` says
 “Go and find me the nearest Scaffold and render myCoolSnackBar inside it."
The error shows that it didn't find a Scaffold near that context, even though we created one in the code above.

 ## Context

_Each widget has its own BuildContext, which becomes the parent of the widget returned by the StatelessWidget.build_

Lets say we are inside the Build method for the red widget; a method that returns a red widget. The context that this build method receives is not the red widget, but rather a reference to the parent/Blue widget. If you think about it this makes sense, if we haven’t built the red widget yet, how could the context possibly be a reference to this unbuild widget?

## So what caused the error
We know that Scaffold.of takes the given context and finds the nearest scaffold. We are creating the Scaffold in the build method, but the context we have in the build method is a reference to the parent and has no idea about this newly created Scaffold. So although we are creating a Scaffold, and the snack bar seems to be created after the scaffold our context knows nothing about it. And as a result Scaffold.of(context) will not find it.

## A solution
We need to call Scaffold.of(context) and provide a context that is a child of our new scaffold.
Luckily Flutter has just the tool for creating a new buildContext.

```dart
class SendEmailScreen extends StatelessWidget {
   build(BuildContext context) {
    return Scaffold(
        appBar: AppBar(
          title: Text('My documents'),
        ),
        body: Builder(
          builder: (context) => //new context has a reference to the scaffold
           RaisedButton(
                child: Text('Save all'),
                onPressed: () => Scaffold.of(context).showSnackBar(
                    SnackBar(content: Text('Saving all changes...'))),
              ),
        ));
  }
}
```

BuildContext is an important part of Flutter environment, but from looking at stackoverflow, I'm not the first person who ignored it until it came time to render a snackBar.
So be warned, always learn the fundamentals!
