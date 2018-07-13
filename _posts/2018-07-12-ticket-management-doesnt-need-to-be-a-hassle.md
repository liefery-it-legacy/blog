---
layout: post
title: "Ticket management doesn't need to be a hassle"
date: 2018-07-12
author: Jonas Hübotter
tags: process tools
---

Teams grow, businesses grow. In great companies, individuals grow - and along with them the work they're pursuing. While everything in a team changes and improves, there is something that is not so likely to change, not so likely to adapt to new challenges. More often than not, the workflow of a team remains the same. And while it probably was useful in the beginning, by now it became a hassle.

When teams grow, proven systems quickly become a hurdle. The bigger a team gets, the harder it becomes to keep everything in check. But it's not only your requirements that change. The tools you use are changing too. Some of them quicker than others. Don't stick with one, because you used it for a long time and it worked well. Chances are high that either your requirements or the tool itself have changed - or even both.

The larger a team gets, the more tools it usually requires. This begs the question of how these tools can best work together. If you decide - and I bet you did at one point - to build a custom integration for all the services you use, the cost of adding a new tool to the stack is high. It always is a tradeoff: the more tools you use, the more advanced and complex your systems have to be to accommodate for them and integrate them into your processes. The more complex your custom integration becomes, the harder it is to change. Always evaluate before you add a new tool to your workflow whether its costs are lower than the value it brings to your team.

There are some more principles to consider when creating or changing workflows. I don't intend to discourage, but the decisions you have to make won't get any simpler.

## Limit yourself to one best tool for each task

To find a workflow that fits your specific requirements, it is best not to look too much at others, but to start by defining the specific tasks that you face day in and day out. Making the work on tasks efficient and enjoyable should be the goal of any workflow - so starting with the tasks themselves is not too bad of an idea. Now that you have defined your tasks, you have also defined the requirements for your workflow. Your workflow should handle them and them only - nothing more, and nothing less.

So we want our workflow to exactly match our requirements, we want it to be efficient and enjoyable. To be all of that, you should not include a lot of clutter. Limit yourself to one best tool for each task. No seriously, don't go overboard with finding and including services. As discussed earlier, the costs of your custom workflow add up when you do not keep it simple.

By now you have a map of a number of specific tasks and the best tools to tackle them. It is now time to take a closer look at this map. If you defined very specific tasks, it is likely that a number of them can be tackled using the same tool. You want to create these overlaps of responsibility, because naturally integrating more services that don't know about each other makes your custom solution more complex and thus adds cost. That's why it is important to think about alternative tools, to narrow your list of services down to as few as possible. In general you shouldn't use a tool for a task because you already use it. But if there are two equally good options for a task, go for the option that costs less when integrating it into your systems.

## Provide the right context to make everyone more productive

Now you have all of these fantastic tools to simplify working on your tasks, but using each one of them individually quickly becomes a hassle. You see, even with just a few defined tasks, it is likely that you ended up with at least two separate services on your list. The more complex and specific your requirements are, the quicker you ramp up this number of tools.

To make the workflow adhere to his goals - making your and your teams work more efficient and enjoyable -, you have to make it disappear. At the very moment you've acquired a large bag of tools for to help you with your tasks. But while your tasks are intertwined, your tools are not. They have to become one thing. This does not mean that you have to build custom software to make these tools look like they're one. It is way simpler: for one specific task, you should only ever need to use the one exact tool, you found to be the best for this purpose.

When the tools you use are great, and you don't have to switch between them every two minutes - work is enjoyable. Enjoyable workflows lead to great work. Bad workflows - not so much. Think about how dependent every business is on the systems it uses to assign and track work. Each and every little improvement to these systems can have a big impact.

To transform your big bag of tools and services into an enjoyable and efficient workflow, you have to make each and every tool which is being used for a task feel like a continuation of the tool used for the previous task. Then seamlessly hand over to the tool used for the next task.

It's all about providing the required context to work on a task with a tool in such a way that one does not need to switch to a different tool in between. I mean, you defined this tool to work best for the task at hand, why leave it? :smiley:. Forcing people into switching services just to work on one specific task is neither efficient nor enjoyable.

## Our workflow @ Liefery

We at Liefery have also made up our mind about the most efficient and enjoyable way of integrating external services into our custom workflow based on our specific requirements.

At the core of a team developing software is the code itself. We host it on [GitHub](https://github.com/). Therefore we also review code there.

Tickets help us to organize our work. We use [Jira](https://www.atlassian.com/software/jira) to assign people to and track the progress of bugfixes and features from idea to deployment.

There are also a number of other services we use every day: Jenkins, Slack (who doesn't?) and Bugsnag just to name a few.

## Bridge the gap

When you are using all of these external services and want to do so to your benefit - you got to make sure they work well with each other. This is especially true for GitHub and Jira. Because in reality code changes and the tickets they belong to are connected tightly, they should be equally connected within their tools.

For that we use [Tickety-tick](https://github.com/bitcrowd/tickety-tick). Tickety-tick is a browser extension made by our friends at [Bitcrowd](https://bitcrowd.net/) which manages the naming of branches, commits and pull request titles in code depending on the ticket they belong to. Tickety-tick does not only recognize tickets from Jira. It also supports GitHub, [Trello](https://trello.com/), [GitLab](https://about.gitlab.com/) and [Pivotal Tracker](https://www.pivotaltracker.com/).

While using Tickety-tick is a great way to reference Jira tickets from GitHub, it did not solve our problem of having to use both for just one task. GitHub depended on Jira and Jira depended on GitHub. If you used one, you had to use the other. When reviewing a pull request for example, you had to go look for the original ticket in Jira to read the ticket description. When doing QA in Jira, one had to look at the pull request on GitHub to see if any requirements changed. Having two services be so tightly coupled can be a mess. But it does not have to be.

That's why we created the [GitHub-Jira-Bot](https://github.com/liefery/github-jira-bot). The bot helps us in two ways: It moves relevant information from a Jira ticket into the pull request an GitHub. And it moves relevant information from GitHub back to Jira. The goal being, to provide the right context in every tool to help solve the task at hand and to remove the need of switching to a different service.


_How did your team solve the issue of creating a workflow that scales? Write us in the comments!_
