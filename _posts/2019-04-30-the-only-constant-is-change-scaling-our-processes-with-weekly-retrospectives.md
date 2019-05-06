---
layout: post
title: "The only constant is change - scaling our processes with weekly retrospectives"
date: 30-04-2019
author: Adam Niedzielski
excerpt: "How much process do we need for our current team size? How do we change that as the team grows? That's how we approached these questions."
---

I noticed that a lot of software developers have an allergic reaction to the
word "process". Just say "we need a process for that" during a meeting and
observe people's reactions.

And don't get me wrong, there's a good reason for that. A lot of teams adopt
unnecessary cumbersome rituals just because someone has recently attended an
"Agile Enterprise" training.

This doesn't mean though that you don't need any processes. The right
questions to ask instead are: "how much process do we need for our current
team size?" and "how do we change that as the team grows?".

In this blog post I'm going to tell you how we approached this topic at the
Liefery engineering team.

### Two core rules

Our core two rules are extremely simple:
1. start with no process
2. run weekly retrospectives

The first rule makes sure that we only create solutions for the problems we
actually have. If things are starting to get a bit messy and disorganized,
people quickly notice the issue. Something is hampering their productivity
right now, so they have both a good understanding of the problem and the
motivation to solve it. We're not creating processes for an abstract future,
we're only doing as much as needed in the concrete present.

The second rule provides space to give feedback. It's important for us to do it
on a regular basis. This reduces the barrier to share your thoughts as there's
now a dedicated time to do so. We take every bit of feedback very seriously and
actively look for improvements with the whole team. The purpose is to make
anyone welcome to give feedback and not feel like "the one who complains".
That's especially vital for new team members and juniors who could otherwise
feel that they're speaking out of turn.

Establishing the habit of acting reliably on given feedback creates a positive
feedback loop that results in more feedback given, which in turn results in
more improvements, even more motivation to give feedback, and so on.

### Retrospective format

Our retrospectives have a lightweight format. We start by picking a note taker,
and asking everybody two questions: "what did you like in the last iteration?"
and "what do you wish for?".

The first question allows the person to express appreciation for particular
improvements done by others, brings positive atmosphere to the meeting, and
reminds us about these parts of our team culture that we shouldn't lose.

The second question suggests problematic areas, and potentially surfaces pain
points that have to be addressed. After everybody has spoken, we go back to the
"wishes", review them, and discuss. The goal now is to generate "decisions"
("action items") from the meeting. For every action item we try to assign a
person responsible for it.

Some of the "wishes" can immediately generate a "decision" - for example "I
wish we had a dedicated Slack channel for company news announcements". Some of
them are not really actionable - for example "I wish that I wasn't sick last
week". And some of them require a longer discussion - for example "I wish that
we were updating our JavaScript dependencies more often".

When we realize that we can't quickly reach an agreement and an issue requires
a longer discussion, we schedule a dedicated meeting for it. In such a case the
decision may be "Schedule a meeting to talk about updating JavaScript
dependencies". This allows us to keep our retrospectives focused and with
predictable duration. An additional advantage of scheduling separate meetings
is that a lot of discussions can [happen asynchronously](/2018/11/29/our-road-from-remote-friendly-to-remote-first.html).

We store store meeting notes and make them available to everyone on the team.
Thanks to this it's easy to review the action items from the previous
iteration. We do it at the end of our retrospective - go through the points one
by one and check if we made some progress there. If we didn't follow up on an
action item, we carry it over to the next retrospective. This keeps us
accountable and makes sure that the changes really happen.

### Discuss and experiment

I may be a bit late to the game, but I learned about the
["Disagree and commit"](https://en.wikipedia.org/wiki/Disagree_and_commit)
principle only a few months ago. When I read the definition and motivation of
the rule I immediately thought "that's exactly the philosophy that we follow in
our team!".

When we want to introduce any kind of process change we give everyone a chance
to express their opinion. Some people will be more interested in the topic,
some people less - that's fine. It's not obligatory to express your opinion.
It's the possibility of expressing an opinion that matters.

I prefer to refer to this phase as "discuss". We don't always "disagree",
sometimes we mostly agree and only discuss the details. "Discuss" sounds like
a more constructive term here.

After the discussion we have to take some action. At this stage there's still
likely to be some uncertainty and doubts. It's very hard to predict effects of
process changes. Instead of saying "that's our new process", we say "let's try
with the new approach as an experiment, use it for a few weeks and re-evaluate
later". Phrasing the change as an "experiment" makes it easier for everybody to
forget about their doubts and give it a shot. It's easier to commit to an
experiment than to commit to a permanent change.

After a few weeks / months we reflect on the results of the experiment. In most
of the cases everybody is so happy with the improvement that the only thing
left to do is documenting the new process in our Employee Handbook "Don't
Panic".

### Success stories

Following this approach we have made major changes in our team over the course
of the last two years.

When I joined the team we worked in a weekly pace. Every week we were selecting
tasks for the whole next week and during the iteration everybody would just
pick the next unassigned task. This worked well for a team of 4-5 people. 

When we grew to 8-10 people, people started to wish during the retrospective to
"be able to focus more on one larger topic" and "have a dedicated time for
knowledge sharing presentations, refactorings and other improvements". We
scheduled a separate meeting to discuss it and used
[this blog post by Basecamp](https://m.signalvnoise.com/how-we-structure-our-work-and-teams-at-basecamp/)
as a starting point.

During the discussion we came up with a process where we divide the whole team
into sub-teams (squads), assign a topic to every squad, work 4 weeks, take one
week break for developer-driven tasks and repeat.

It started as an experiment, but now it's a foundation of our development
process.

Other things that we improved through retrospectives:
- [transitioning from remote-friendly to remote-first](/2018/11/29/our-road-from-remote-friendly-to-remote-first.html)
- deprecating Cucumber and switching to RSpec feature specs
- organizing the responsibility of internal customer support and exception
monitoring across the team
- introducing the team lead position

...and many, many more.

Embracing constant change is the foundation of our culture. The constant
element that we have is the retrospective. We use the retrospective to generate
topics for discussions. Then we discuss and experiment.
