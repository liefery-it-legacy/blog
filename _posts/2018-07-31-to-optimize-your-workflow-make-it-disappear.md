---
layout: post
title: "To optimize your workflow, make it disappear"
date: 2018-07-31
author: Jonas Hübotter
tags: workflow process tools
excerpt: "Workflows are an essential part of every software engineering team.
They have a profound impact on how we work, how much we enjoy our work and
ultimately on the outcome of our work ..."
---

[ticket-jira]: /images/posts/to-optimize-your-workflow-make-it-disappear/ticket-jira.png
[ticket-github]: /images/posts/to-optimize-your-workflow-make-it-disappear/ticket-github.png
[qa-comment-github]: /images/posts/to-optimize-your-workflow-make-it-disappear/qa-comment-github.png
[qa-comment-jira]: /images/posts/to-optimize-your-workflow-make-it-disappear/qa-comment-jira.png

Workflows are an essential part of every software engineering team. They have a
profound impact on how we work, how much we enjoy our work and ultimately on the
outcome of our work.

We at Liefery have made up our mind about the most efficient and enjoyable
way of integrating external services into our custom workflow based on our
specific requirements.

First some background on our tools.

At the core of a team developing software is the code itself. We host it on
[GitHub](https://github.com/). Therefore we also
[review code](https://engineering.liefery.com/2018/02/21/how-we-do-code-reviews)
there.

Tickets help us to organize our work. We use
[Jira](https://www.atlassian.com/software/jira) to pick tasks to and track
the progress of bugfixes and features from idea to deployment.

There are also a number of other services we use every day: Jenkins, Slack
(who doesn't?) and Bugsnag just to name a few.

## Bridge the tool-gap

When you are using all of these external services and want to do so to your
benefit - you've got to make sure they work well with each other. This is
especially true for GitHub and Jira. Because in reality pull requests and the
tickets they belong to are connected tightly, they should be equally connected
within their tools.

It is the workflow's responsibility to provide the required context to
the tool which is used for a task so that you do not need to switch to a
different tool in between. I mean, you defined this tool to work best for the
task at hand, why leave it? :smile:. Forcing people into switching services just
to work on one specific task is neither efficient nor enjoyable.

We use [Tickety-Tick](https://github.com/bitcrowd/tickety-tick) to solve this
problem. Tickety-Tick is a browser extension made by our friends at
[Bitcrowd](https://bitcrowd.net/). It manages the naming of branches, commits
and pull request titles in code depending on the ticket they belong to. We use
Tickety-Tick in such a way that every commit on our `master` branch is linked to
a specific Jira ticket. We squash and rebase every pull request because then the
name of a commit provides the necessary business context to explain written
code.

While for us using Tickety-Tick was a great way to reference Jira tickets from
GitHub, it did not solve our problem of having to use both for just one task.
GitHub depended on Jira and Jira depended on GitHub. If we used one, we had to
use the other. When reviewing a pull request for example, we had to go look for
the original ticket in Jira to read the ticket description. When doing QA in
Jira, we had to look at the pull request on GitHub to see if any requirements
changed. It did not make our workflow "disappear". Instead it resulted in
everyone playing the maniac game of
who-can-have-more-browser-tabs-opened-at-once. Trust me, the game is more
frightening than the name I gave it.

Having two services be so tightly coupled can be a mess. But it does not have
to be. That's why we created the
[GitHub-Jira-Bot](https://github.com/liefery/github-jira-bot). The bot helps us
in two ways: It moves relevant information from a Jira ticket into the pull
request an GitHub. And it moves relevant information from GitHub back to Jira.
The goal being, to provide the right context in every tool to help solve the
task at hand and to remove the need of switching to a different service.

We also use a couple of Jira's other GitHub integrations to improve our
workflow. Tickets move around our agile board from `In progress`, to
`Ready for review` and from thereon to `On master`.

## Our workflow

So how does our workflow exactly help us in being more effective tackling our tasks?
Let's say someone on our team has created a new ticket to Jira. `Add more kitten
pictures` it says. When I see this, I cannot resist to implement it - so I start
my progress.

![Jira ticket][ticket-jira]

I use Tickety-Tick to copy a Git command for creating a new branch and a first
commit to my clipboard. I then paste it into the command line. Now let's get to
the real work I mumble.

When that is done, I just amend my changes to the pre-made commit.

```
$ git commit --amend --no-edit
```

Then I push to GitHub:

```
$ git push origin HEAD
```

In GitHub's UI I now create the pull request. I don't have to describe the
ticket requirements though as the bot handles this. After I created the pull
request, it immediately adds all the required information with a comment.

![Jira ticket description in the pull request on GitHub][ticket-github]

Usually what follows immediately is a lengthy discussion about the
implementation. But after a pull request has been merged, quality assurance just
begins. To assist QA, you can add a comment to GitHub saying something like:

![QA comment][qa-comment-github]

The bot transfers the comment to Jira so that QA never has to look at the actual
code on GitHub.

![QA comment in the Jira ticket][qa-comment-jira]

So that is it. While our code has not been deployed yet, it has been written,
discussed and battle-tested. And our workflow assisted with all of these tasks.


_How did your team solve the issue of creating a workflow that scales? Write us
in the comments!_
