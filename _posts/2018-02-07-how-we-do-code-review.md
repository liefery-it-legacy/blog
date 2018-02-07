---
layout: post
title: "How we do code review"
date: 2017-02-07
author: Adam Niedzielski
tags: quality review process
---

Code review is an essential development practice that we use at Liefery. Today I'd like to present our guiding principles when it comes to reviewing pull requests, an instruction how you can do that and how we react to feedback.

Why do we review code of our people? It helps us build shared ownership of the application. It's not an "Adam's feature" that "has bugs" and "Adam has to fix it now". When I reviewed and accepted a pull request I'm now equally responsible for the code.

Our application gets bigger and bigger, and it's no longer possible that everybody works on every feature. Thanks to code reviews I am still aware what other people are working on. You can think of it as a way of sharing the domain knowledge across the team.

We also share the technical knowledge during code reviews. Reviewers can suggest an alternative way to solve the problem, useful method from Ruby standard library that simplifies the code, or ask questions about new technologies that they encounter for the first time.

It's important to design a code review processes that suits your company, not just blindly copy what other companies are doing. They probably have a different team size, work on different problems.

I can give you some perspective by comparing the code review processes at Liefery with the one at GitLab where I worked before. GitLab is a large open source project that ships new minor version on a fixed date every month. This means that anything that lands in `master` have to be "fully correct", because your follow-up pull request may or may not land in time for the next release. The code review in most cases involves getting the approval of two team members - Reviewer and Maintainer. Reviewer is a role at the company which is handed after aquiring some experience with the codebase to people that are especially interested in performing code reviews. Maintainer role means push access to `master` and acts as a "gatekeeper of the application" - code cannot get through without the approval of one of the Maintainers.

It's the responsibility of the person submitting the pull request to find the appropriate Reviewer. The criteria is the experience with the particular area of the code. The application is huge and Reviewers may have a hard time looking at the code they never saw before.

All feedback coming from the Reviewer and the Maintainer has to be fully addressed - either by changing the code or by convincing the person that the code is correct.

All the above creates a hierarchical structure where the room for disagreement with people reviewing your pull request is quite limited. It works well for the company where roughly 70 people commit to one codebase (and this number excludes numerous contributors from the open source community).

We have a very different situation at Liefery. We have 10 programmers in our team right now. We value the speed of delivering new features, incremental improvements and want to empower the whole team to review code.

When you submit a pull request you don't assign anybody to review it, instead you just leave it open. Everybody is encouraged to grab and review it, although in many cases it's one of the people that you work together on the current feature, because they have the necessary context already "loaded". If the pull request introduces a major change we ask other people to take a look at it. We don't want the knowledge about certain areas of the application to be limited to a small group of people.

Addressing feedback on the pull request is not so much "making Adam happy", but rather "making sure that you're not the only person that holds this opinion". When you 
