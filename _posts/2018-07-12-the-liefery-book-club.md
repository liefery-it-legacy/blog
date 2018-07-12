---
layout: post
title: "The Liefery Book Club"
date: 2018-07-12
author: Tam Eastley
tags: book, club, reading, 99 bottles, oop
---

A few months ago, I mentioned in one of our Slack channels that I wanted to read [99 Bottles of OOP by Sandi Metz and Katrina Owen](https://www.sandimetz.com/99bottles). One of my colleagues said that he wanted to read it as well. "We should start a book club!" I typed eagerly. He reacted with a :+1:.

And so, the Liefery Book Club was born.

### The rules of book club are simple:

1. We meet Wednesdays at lunch. Everyone is busy after work an no one wants to stay longer than they have to. This way we avoid scheduling conflicts.
2. Book Club is entirely optional.
3. Everyone should come armed with a few talking points. If someone hasn't read the agreed upon section and justs want to hang out, that's fine too.
4. Someone takes notes and pushes them to our Github repo.
5. Decide at the end of the meeting how much to read for next week.
6. Despite our main application being predominantly Ruby on Rails, we can read anything (it should be work-ish related).

We were going to start on May 2nd (a Wednesday), but May 1st is a big holiday here and there's lots of street parties and impromptu concerts throughout the day. Because some people expressed that "it might be hard" to start that day, we instead started a week later. On May 9th, a handful of us devs met, lunch in hand, to discuss 99 Bottles of OOP.

### The book

99 Bottles of OOP is a great introduction to object oriented programming. Metz & Owen present a simple problem: printing out all the verses of the "99 Bottles of Beer on the Wall" song, and walk the reader through a refactoring. In the first chapter the reader is asked to write their own solution to the problem by making a series pre-written tests pass. From there, they look at a number of different solutions, ranging from pretty standard and straight forward (called "Shameless Green") to total overkill (such as "Incomprehensibly Concise" and "Concretely Abstract"), and run them through a series of code metrics.

This was a great starting off point for the book club. We all came to the first meeting with our solutions, and it was fun to see what everyone came up with, their [flog score](https://github.com/seattlerb/flog), and how they differed from the ones in the book.

It took us about two months to read the whole book. In the end we were very happy with the nice introduction to OOP, but were let down in some places. Maybe it would have been better for a group of beginners, or maybe the example just didn't work for us. After asking around, the consensus was that the book was a 6 out of 10.

Our overall thoughts on the book are:

1. 99 Bottles is not a real world problem, and that's what tripped us up. In fact, here in Germany, quite a few people didn't know the song at all, so it was kind of weird for them. The introduction of the "six pack" requirement half way through felt contrived, and it was hard to apply some of the learnings to our large code base. We much prefer the example of the bike shop used in Metz's other book, [Practical Object-Oriented Design in Ruby](http://www.poodr.com/).

2. The authors really take the reader by the hand and lead them through every step of the code. This is quite nice on the one hand, but some of the refactorings that they do are so small, it's not very realistic that one would ever do this. This made the book feel quite slow at times. However, we do acknowledge that this step-by-step way of doing things is meant to be a tool that one can fall back on if they need it.

3. Some of the concepts are incredibly well explained and demonstrated. For example: immutability, the perils of metaprogramming, and what it means to make your code "open to change". There are some great tricks in there about how to decide if your code should be split into multiple objects, among them, the "squint test".

4. The book sparked some interesting conversations about our own code base, such as: Do we have any examples in our codebase where we abstracted too early? Did we use metaprogramming somewhere we shouldn't have?

5. Despite the separation of the original code into multiple classes and making it "open", many of us still believe that the original solution, "Shameless Green" is the best, and the easiest to read.

### Going Forward

The week before we finished 99 Bottles we started thinking about the next book we wanted to read. We created an issue in our Book Club repo where people could add ideas, and then upvoted them. After giving everyone a week to vote, we settled on [The Coaching Habit by Michael Bungay Stanier](https://boxofcrayons.com/the-coaching-habit-book/).

We didn't love 99 Bottles, but so far, book club is going well, and we're eager to get started on the next one. As Metz and Owen say in their book: "Have faith, and iterate."