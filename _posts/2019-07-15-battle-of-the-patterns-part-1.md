---
layout: post
title: "Battle of the patterns: part 1"
date: 4-07-2019
author: Ali Churcher
tags: flutter flutter_redux redux optiontypes
excerpt: "Discovering an incompatibility between Redux Selector pattern and Option types"
---

## Introduction

The members of Liefery's Flutter development team come from a wide range of backgrounds - from React and Elm to Java and Scala. While rewriting our mobile application in Flutter we were able to pick and chose different design patterns that we knew from experience were good for a particular problem. Two of the patterns we chose were well established and solved clear problems that we had. After some time however, we found ourselves battling with these patterns, or rather, these patterns battling each other. When we needed to write code that bypassed the best practices of one pattern to satisfy the other we realized we needed to rethink our design. In this blog post I want to describe 2 patterns that we are using in our codebase, how they are currently conflicting in our state management code, and some ideas that the wider team has discussed for improvements. I hope that part 2 of this blog post will describe the approach we end up taking to solve this problem and create a slick new state management design.  

## The two patterns in question: Redux Selectors and Option Types
Background information: we use [flutter_redux](https://pub.dev/packages/flutter_redux) for our state management. It allows us to centralize our application state in a single place and control how it is updated. It behaves mostly like the original Redux from JavaScript, and a very nice explanation of the main concepts can be found [here.](https://redux.js.org/introduction/three-principles)

### Redux Selectors
_A pattern of writing helper functions that take the full state object and return a specific part of the state._

When using flutter_redux, all application state is stored in a single place - the state object. Rather than access this information by being aware of its structure, we encapsulate away this information and access the data with selectors. This provides the benefit of allowing the underlying state structure to change without having to change all our code.

Without selectors:
```dart
const int count = state.session.user.orders.unpaid.length  // directly access the state field
```

With Selectors:
```dart
const int count = getNumberOfUnpaidBills(state) // call a selector 
```
```dart
int getNumberOfUnpaidBills(state) {
  return state.session.user.orders.unpaid.length  // selector implementation
}  
```

### Option Types
_A way to remove nulls by providing a type to represent an optional/unknown value_

Option types are a language feature implemented in many function languages such as Haskell (called `maybe`), Rust, Swift and Scala. Our project uses a Dart implementation of Scala Option Types. Option types provide a safe way to handle the absence
of a value. The concept of null/nil/undefined is completely avoided and replaced with a type that is optional - i.e. a value that maybe present or not.

For example, if we have a variable `comment` that might be present or not, we can model it like this:

```dart
const Option<String> comment;
```

If the value is present, then the `Option<String>` holds an instance of `Some<String>`.
```dart
comment = Some('My comment: thanks for the shipment');
``` 

If the value is absent then `comment` holds an instance of `None`. 
```dart
comment = None();
``` 
Implemented correctly, OptionTypes prevent the errors and surprises caused by unhandled nulls. The type forces you to handle both the presence and absence of the value at compile time. 

## Where the pattern battle begins
We encountered some situations where OptionTypes and Selectors do not play nicely together. Let’s look at an example involving one important part of our application state – the session. 
Let's simplify the session code to have three fields: an apiKey, the name of the logged in user, and some orders:

```dart
class SessionState {
  final String ApiKey;
  final String username;
  final List<Order> userOrders;
}
```
The session is present in the application state, the centralized state object that we access and update with Redux. Since a session only exists when a user is logged in, this variable was the perfect candidate to use an OptionType.

```dart
Class State  {
    final Option<SessionState> session; // Option Type
    String languageCode;
    final Route currentRoute;
    . . .
}
```
When the user is logged out the `session` variable will hold `None()`. When the user is logged in, `session` becomes `Some(SessionState)` where SessionState is our session object defined above containing the ApiKey and other information.

When we go to use this session, we handle it with a Fold function
that takes two callbacks - one for if the Option variable holds `None()` and one for if there is a value. 

```dart
Route currentRoute = session.fold(
        () => loginScreen(), // when session is None
        (session) => userHomepage(session) // when session is Some
      ); 
```
You can see that these 2 callbacks allow us to direct the user to the LoginScreen if there is no session, and proceed straight to the userHomepage if a session is present.


### Adding selectors into the mix
Selectors take the full state and return the requested value. A selector to get the userName might look like this:
```dart
String getLoggedInUserName(state) {
   return state.session.userName;
}  
```
however, this code wouldn't compile yet. As session is an Option<Session>
we must handle the case where the value is None:

```dart
String getLoggedInUserName (FlutteryState state) =>
    state.session.fold(
      () => '', // if session is None return an empty string
      (session) => session.userName // if it exists return the userName
      );
```
You can see that if the session doesn’t exist we return an empty string.

_This is where our two patterns first clash_

By returning an empty string we have thrown away the Option pattern – we now have something that appears to be a value, but is effectively not present (empty string).
This is especially dangerous in an application that uses Option types because the need for vigilant null checking is usually avoided.


## First fix idea 
_Selectors should not return empty values such as `''` and `[]`_

Where previously our selector returned `''` when the value was not present, what if we returned an option type?
```dart
Option<String> getLoggedInUserName (FlutteryState state) =>
    state.session.fold(() => None(), (session) => Some(session.userName));
```
The problem here is that this selector is not reflecting the true value in the state. If we look at the original state again:

```dart
Class state  {
    final Option<SessionState> session;
    String langugeCode;
    final Route currentRoute;
    . . .
}
```
we can see that if session is not there, then the concept of ‘session.username’ does not even exist. It’s not None() it’s just not there at all!
This design also means added hassle of dealing with the None() scenario of an OptionType in situations when we know for sure that the value is present - in this case when the user is logged in. 


## Second fix idea 
_Favour selector pattern over option when the patterns clashed_

To better fit with the fact that our selectors returned empty strings etc, we remodelled our state to match. Rather than the session being an option type, we remodelled it as an object that was always present. When the user is logged out the session object has empty values. When the user is logged in the values are present. 

```dart
Class state  {
    final SessionState session; // previously was Option<SessionState> session
    String langugeCode;
    final Route currentRoute;
    . . .
}
```
```dart
class SessionState {
  final String ApiKey;
  final String username;
  final List<Order> userOrders;
  . . .

SessionState({
  apiKey = '',
  username = '',
  userOrders = [],
 }) 
 // this constructor provides default values for when no value is present 
 // i.e before any user has logged in,
```

With this change, our selector can be rewritten:
```dart
String getLoggedInUserName(state) {
   return state.session.userName;
}  
```
and the selector return value will always match exactly what is in the state. 

The problem with this? We now have to handle our own nulls. We need to check if things are empty or present when we use them – exactly what OptionTypes were added to avoid. We are dealing with the baggage of option types without the benefits of safety. We can improve on this.

## A compromise?
_Follow the Option pattern strictly and be more lenient with selectors_

A lot of the difficulty for a selector such as getLoggedInUserName arises from the fact that Session is an option. The selector has to handle either the absence or the presence of the session. We can avoid this problem by passing a subset of the state into the selector.

before
```dart
String getLoggedInUserName(State state) => 
 state.session.userName;

```
after
```dart
String getLoggedInUserName(SessionState session) => 
 session.userName;

```
This restricts us to only ever calling this selector when the session exists, but it means we are guaranteed a non-null return value. By passing something other than state however, we are no longer hiding away the state structure. For example if the state was refactored and session was renamed to `userDetails` and restructured, we would have to refactor every selector. We will have lost the main benefit of redux selectors – to encapsulate away the inner structure of the state object.

#### Bonus idea:

There is one more idea to try to get OptionTypes and selectors to play nicely

If session is `None()` then asking for the session's username could be modelled as an error rather than a `None()`.
`Either` is another Scala device, very similar to OptionTypes, but rather than a type, or null, it's 
any two types. In this case, a `String` or an `error`.

```dart
Either<String, error> getLoggedInUserName (FlutteryState state) =>
    state.session.fold(
      () => Right('error no session'),
      (session) => Left(session.userName)
    );

```
This pattern fits well with our option types pattern, but means we must
have selectors that return values that are not actually in the state object - namely errors.


## What next?

So we've seen two very different patterns. The selector pattern - which values access to all application state at any time in the lifecycle of the application, and the Option pattern - which encourages using application knowledge to only ask for information when it makes sense, for example only asking for the session's userName if we have a session.

We must decide to either have full easy access to the state and accept full responsibility for nulls and other 'empty' values such as `''` (selector pattern)
or limited access to the state and have no responsibility for nulls (Option pattern).

 We know that patterns come with trade-offs. Sometimes it’s an added level of indirection, high learning curve, or boilerplating code. We have now learnt that sometimes the trade off is having to give up an existing pattern.

So are we seconds away from Redux/OptionType utopia or will we need to accept defeat and cut one from our application?
Join us after our tech design meeting to find out what we choose in part 2 - a shiny new solution!
