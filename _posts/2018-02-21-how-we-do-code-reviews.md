---
layout: post
title: "How we do code reviews"
date: 2018-02-21
author: Adam Niedzielski
tags: quality review process codereview
---

Code review is an essential software development practice that we use at
Liefery. It's so central to how we work that I cannot even imagine my day
at work without it. In this blog post I'd like to describe why we do it,
how we designed our process, and what to look for when you are the reviewer.

## The why

Why do we make sure that every line of code is reviewed by at least one
other team member? Besides the standard reason--i.e. code quality--the
most important reason is that it helps us build a shared ownership of the
application. It's not an "Adam's feature" that "has
bugs" and "Adam has to fix it now". When I reviewed and accepted a pull
request I'm now equally responsible for the code. This reduces the fear of
making changes by replacing "programmer mistakes" with "team mistakes". And
I make mistakes every single day. This approach is a shift from "blame"
culture to "we have to fix it" culture.

Our application gets bigger and bigger, and it's no longer possible that
everybody works on every feature. Thanks to code reviews I am still aware
of what other people are working on. You can think of it as a way of
sharing the domain knowledge across the team.

We also share the technical knowledge during code reviews. The reviewer can
suggest an alternative way to solve the problem, a useful method from Ruby
standard library that simplifies the code, or ask questions about new
technologies that they encounter for the first time.

## Process - DIY

It's important to design a code review process that suits your company, not
just blindly copy what other companies are doing. They probably have a
different team size, different structure, different constraints and work on
different problems. I can give you some perspective by comparing the code
review process at Liefery with the one at GitLab where I worked before.

#### My experience at GitLab

GitLab is a large open source project that ships a new minor version on a
fixed date every month. This means that anything that lands in `master` has
to be "fully correct", because your follow-up pull request may or may not
land in time for the next release. A code review in most cases involves
getting the approval of two team members - a Reviewer and a Maintainer. The
Reviewer is a role at the company which is handed after acquiring some
experience with the codebase to people that are particularly interested in
performing code reviews. The Maintainer role means push access to `master`
and acts as a "gatekeeper of the application" - code changes cannot get
through without the approval of one of the Maintainers.

It's the responsibility of the person submitting the pull request to find
and assign the appropriate Reviewer. The criteria is the experience with
the particular area of the code. The application is huge and Reviewers may
have a hard time looking at the code they never saw before.

All the feedback coming from the Reviewer and the Maintainer has to be
fully addressed - either by changing the code or by convincing the person
that the code is correct.

This creates a hierarchical structure where the room for disagreement with
people reviewing your pull request is quite limited. It works well for a
company where roughly 70 people commit to one codebase (and this number
excludes numerous contributors from the open source community).

#### How we do it at Liefery

We have a very different situation at Liefery. Our team consists of 10
programmers right now. We value the speed of delivering new features,
incremental improvements and want to empower the whole team to review code.

When you submit a pull request you don't assign anybody to review it,
instead you just leave it open. Everybody is encouraged to grab and review
it, although in many cases it's one of the people that you work together
on the current feature group, because they have the necessary context
already in
their head. If the pull request introduces a non-trivial change we ask
other people to take a look at it. We don't want the knowledge about
certain areas of the application to be clustered.

Addressing feedback on the pull request is not so much "making Adam
happy", but rather "making sure that you're not the only person that holds
this opinion". You don't have to adjust your pull request to match exactly
the programming habits of the reviewer, it's enough when another team
member agrees with your opinion. This requires a lot of trust in the team
as a whole, but saves us from having long discussions on things that don't
really matter. For example, making a method shorter by extracting a private
method is often a matter of style and should not block a pull request if
other people agree that it's optional.

As you can see our review process doesn't depend that much on individuals
and we don't get blocked on waiting for a response from a particular
person. This allows us to merge code quickly, without going back and forth
for multiple days.

When there are things that are nice to have, but not strictly necessary
for the code to land in `master`, we tend to merge the pull request
without them and then create follow-up tickets that will be addressed in
the future. Thanks to this we keep our pull requests smaller, and smaller
pull requests are much easier to review. This again requires a lot of
trust that your colleagues will remember to go back to the follow-up
tickets.

## The Reviewer's Manual

So you decided to review a pull request, you have the code diff right in
front of you, what do you do now? I have an informal list of steps in my
mind that I follow every time I perform a code review. I'll write
it down for you now.

1. **Read the associated issue / ticket first**. You need to have a good
understanding of what had to be done before you see how it was done. This
forces you to think about how you would solve the problem without being
biased by the solution in the pull request.
2. Go through all the changes and try to understand the proposed solution
on the **high level**. Do you understand how it solves the problem? Do you
think that it's better, worse or equivalent to what you would do? Does it
leave the codebase in a better shape than it was before?
3. **Don't leave any comments yet during the first pass**. Chances are that
your questions will be answered by the code that follows. Instead create
draft comments for these remarks.
4. Go back to the first file and **start over**. This time read every single
line and focus on individual methods and classes.
5. **Do not leave comments related to the code formatting**. The code
formatting should be enforced by automatic tools (like Rubocop) and having
a discussion about it in every pull request is a waste of time.
6. Think about the **readability of the code**. Is this method / class easy to
read? Is it immediately clear what it does? Will it benefit from being
split into multiple methods / classes? Does it have a good name?
7. Think about **edge cases**. Is it possible that the argument is `nil`? Will
the code still work when there are no users with the provided email? What
if the sum of the elements is zero?
8. Think about your **business domain**. Does the language used in the code
match the terms that your business specialists use? Does the code feel
like a natural solution in the context of your business?
9. Think about the **duplication**. Do you already have code that tries to do
the same thing? Is it the right moment to introduce an abstraction that
reduces the duplication?
10. Think about the **security**. Do we filter the allowed parameters
properly? Do we scope the available records to the ones associated with
the current user? Do we sanitize the input?
11. Think about the **performance**. Does this action happen in the request
life-cycle or in the background job? Does it take a long time? Can it be
moved to the background? Does the code produce an efficient SQL query?
12. Look at the **tests**. Are there tests for the newly introduced classes
and public methods? Are changes of behaviour documented by corresponding
test cases? Does this pull request require higher level integration tests?
13. Pick at least one thing that you particularly like in the pull request
(for example perfect method name, simple solution or improved test) and
point it out. **Positive feedback** is also important!
14. **Ask questions instead of pointing out mistakes**. It happens to me often
that when I confidently say that something is wrong, I missed some
important piece of information and it's in fact me who is wrong. That's
why it is much better to ask questions instead: "why did you decide to
implement it like that?" or "don't we have to consider that case when
customer is missing here?".
15. **Be nice**. Always assume the best intentions of the person submitting
the pull request. When describing things to improve, talk about the code
("This code is a bit unclear. What do you think about renaming the method?")
not about the person ("You failed to communicate your intent here. Can you
learn how to use better naming conventions?").
16. **Ask questions when you have no experience with certain technologies** or
techniques. When I review a pull request that introduces static typing
with Flow, and I've never used Flow before, I have two options: do my own
research or ask my colleague to point me to the resources that they know.
Now the chances are that whatever they suggest will be a much better
source of knowledge that the thing I can find after 5 minutes of googling.
That's because they already have this knowledge so they can judge the
quality of resources more easily. Asking for help doesn't make you a "less
credible reviewer".
17. When you go back and forth in a text discussion without reaching an
agreement, **switch to one-on-one, synchronous communication**. It's much
more efficient when resolving conflicts. Write down the outcome of the
pairing review as a comment in the pull request for other people reviewing it.

This is how we do code reviews. And how about your company? What is your
process? What are the things that you pay attention to? I encourage you
to think about it :)
