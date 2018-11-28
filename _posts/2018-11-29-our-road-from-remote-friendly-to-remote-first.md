---
layout: post
title: "Our road from remote-friendly to remote-first"
date: 2018-11-29
author: Adam Niedzielski
tags: remote remote-first remote-friendly fully-remote
excerpt: "When I joined Liefery the IT team was remote-friendly. Today it's
remote-first. Read on to learn the difference and how all this happened."
---

When I joined Liefery the IT team was remote-friendly. What do I mean here by
"remote-friendly"? Let me explain. People were allowed to work remotely every now
and then and it was not uncommon that somebody travels and works remotely during
that time.

### Remote work as something special

At the same time, remote work was perceived as a "special mode". All our meetings
were happening in the office, so quite often people would say 

> "Ali is not in the office today and I'd like to hear her input, so let's
postpone the meeting to tomorrow".

This worked well in a smaller team, but as the team started to grow it became
impossible to find time when everyone was in the office.

### Inefficient remote communication

Another thing that bothered me was that people were disappearing in a
**communication black hole** when working remotely.

We were using the remote time as the time when you can focus completely on the
task in front of you by cutting off all communication channels. But an efficient
team can't work like this!

First of all, the task in front of you may not be the current priority. The
chances are that your current priority is talking with your colleague who is
"blocked" and cannot proceed without your answer. If you "unblock" them you
will maximise your impact.

What's more, if you cut off all communication channels you put more strain on your
colleagues physically present in the office, because they will have to take the
workload from you. This in turn pushes more and more people to retreat into the
communication black hole.

> If your reason for working remotely is that you can't focus in the office then
your office setup is wrong and your communication patterns in the team are broken.
(**me**)

### Learning from others

Having worked at a remote-only company before, I knew how effective remote work
could be. I decided to use this experience to improve how we work remotely at
Liefery.

I started by gathering my thoughts and writing them down. This resulted in a [blog
post on my personal blog - "Make your meetings more async"](https://blog.sundaycoding.com/blog/2017/08/27/make-your-meetings-more-async/).
I encourage you to read it, but the key points are:

1. Create a live editable agenda and share the document as early as possible
2. Invite many people, but make the participation optional
3. Find time that works for most people, but don't strive to find time that works
   for everybody. It's really hard when the team is bigger.
4. Record the meeting
5. Start the meeting on time.
6. Follow the order in the agenda.
7. At the end of the meeting create action items.

### First round of changes

I brought up this subject during one of our weekly retrospectives. We discussed it
in the team and decided to include the above points in our team handbook (which
we call "Don't panic"). We also added some important points aiming to improve the
communication in general:

1. If you have a question and you are 95% sure that person A can answer it, don't
reach out to this person directly. Instead formulate your question on Slack, in
the shared channel and mention person A. It is possible that some other people
will be able to answer the question as well. It is also likely that some other
people will be interested in knowing the answer.
2. If you have a question that should not be posted in a shared channel, please
consider sending a Slack direct message first, instead of going to the desk of
your coworker and asking. This allows them to respond at a time convenient to
them, without interrupting their flow. When deciding whether to send a Slack
message or ask directly, take into account how urgent your question is.
3. If you want to propose changes in the existing company processes or general
code techniques, open a pull request that documents the changed situation. Other
team members can then leave comments at a time convenient to them. If there is a
general agreement, the PR can be merged. If not, it is time for a meeting. Do not
default to scheduling a meeting, start with an asynchronous discussion in a PR
first.
4. If you go back and forth with somebody in a chat conversation or during the
code review, talk with them offline (when both of you are in the office) or start
a video call (when one of you is not in the office). Rule of thumb: if you have
gone back and forth 3 times, it's time for synchronous communication.
5. When working remotely make it clear to your co-workers that you're starting
your work day - for example say "Hi" on Slack. It's fine to turn off notifications
for some time to focus on a task, but be sure to check them a few times during the
day. Let other team members know that you are available for help by posting it
explicitly on Slack from time to time.

### ...and first results

Of course, just documenting the principles won't change the behaviour of the team.
Every change is a process and this process requires time and reminders. But at
least we had a shared understanding how we want to work and a goal to strive
towards.

The communication patterns in the team started to change slowly and we also
changed our office space to a bigger one, which reduced the distractions. We were
still fighting with people "disappearing" when working remotely, but the situation
was improving.

### Including remote people in meetings

Some time had passed and I set a new personal goal for myself - include remote
people in our meetings.

When I was calling for a meeting I started to prepare a video call 10 minutes
before. My laptop was the host of the meeting and we were putting a microphone in
the middle of the table in the meeting room. At that time we were using Youtube
Live Streaming, because it allows people to join the call as participants or
viewers and automatically records a video.

It was an improvement over completely offline meetings, but it had a couple of
drawbacks:
1. it required manual setup (about 5 minutes)
2. it required the person calling the meeting to always remember to do the setup
3. the audio quality was bad for remote people. They could barely hear what was
   happening in the meeting room.
4. there was no way for remote people to signal that they want to say something

The remote people were now included in the meeting, but they were **second-class
citizens.**

### Remote-first vision

We continued like that for a while until I decided to bring up the topic during
our weekly retrospective again. I expressed my wish to improve the remote
communication further. As an action item from that meeting I volunteered to
prepare a presentation. I called this presentation "Remote-first vision", because
I was thinking about it as a big change to do and I expected some push back in
the team. I wanted to present the complete idea without immediately jumping to
implementation details.

So how do I **define remote-first**?

> Remote-first means that remote work is our default approach. We are a team of
people that all work from different locations.​ Sometimes people come to the office
to hang out with each other, but our processes don’t depend on it​.

During my professional work I noticed that the communication in fully co-located
teams works well and that the communication in fully remote teams also works well.
**What doesn't work are the solutions in the middle** - like our remote-friendly
approach. In this model remote people are being left out. By switching to
remote-first we make everybody a first-class team member.

### The proposal

The most important change that I proposed was "**Every meeting is a remote
meeting**":
1. Every meeting is a recorded video call​
2. Everybody participates individually from their own laptop​
3. Do not use computer speakers, they cause an echo.​
4. Do not use your computer microphone, it accentuates background noise. ​
5. In video calls everyone should own a camera and a headset, even when they are
in the same room. This helps seeing and hearing the person that is talking. It
also allows people to easily talk and mute themselves.​
6. You wouldn't share an office seat together, so don't share your virtual seat at
the table.​
7. Everybody should take care of their setup and internet connection so it allows
video calls.​

I wrote it down based on my experience at GitLab and [GitLab Handbook](https://about.gitlab.com/handbook/).

### Team response

After I finished the presentation the responses were mostly positive. In fact, the
reaction was way better than I expected. People were excited and wanted to try the
new approach!

There were some controversial points to clarify so I followed up with a next
meeting - this time to discuss the specifics how we want to try the remote-first
approach.

### "Everything is an experiment"

**At Liefery we treat our processes in the same way as we treat our code - the
agile way**. At the time of the first presentation we didn't know if the
remote-first approach would work for our team. That's why we started discussing
how we could experiment with the new approach without committing to it fully.

The ideas ranged from "the whole IT team performs all meetings in the remote-first
way for two weeks" to "one squad (feature-oriented temporary subteam) tests it
out". In the end we decided to test it in the whole IT team for two weeks, but do
it only for meetings where at least one participant is remote or somebody could
benefit from the recording.

### Tools

We discussed possible video conference tools and decided to go with with Zoom,
that I knew from GitLab. Zoom is able to handle a call with 100 participants
maintaining excellent quality (I'm impressed to this day) and has automatic effortless recording.

We agreed that a stable internet connection is a requirement for working remotely,
so that a video call is possible at any time. We also decided to order dedicated
headsets for everyone who needed one.

### Awkward at the beginning

At the beginning we struggled with awkwardness when most people in the call were
also in the office. It didn't seem natural to talk using the headset when the
conversation partner was sitting next to you. We also had problems with echo when
people didn't mute themselves after finishing to speak.

### Positive feedback

After this initial period people got used to the new method and a lot of positive
feedback about remote-first meetings started to come in our weekly retrospectives.
My colleagues were reporting that participating in meetings when working from home
is way better than it was before. Because of this positive feedback we forgot
about our two weeks timebox and continued with the remote-first approach.

In the meantime we had a meeting where we explored together more advanced
capabilities of Zoom - for example how to use the whiteboard when presenting. Most
importantly, we learned how to use the "Raise hand" feature for signaling that you
want to speak. Apparently only the meeting host can see the raised hands which is
a bit annoying and requires getting used to.

### Reviewing the experiment

After some time we reviewed the transition to remote-first again. As nobody
expressed concerns that the new approach was worse than the old one - we decided
to stay remote-first. The transition was finished by updating our team handbook.

It took us about a year to move from remote-friendly to remote-first. The last two
and a half months were the most intensive - that's the time between the
"Remote-first vision" presentation and committing to the new approach.

### The future

Now we are looking forward to see how the remote-first way influences our team
culture in the long term. It also opens a lot of future opportunities for our team.

I'm typing this blog post from Melbourne in Australia. Thanks to the remote-first
approach the communication with the rest of the team works as smoothly as if I was
sitting in our office in Berlin. The biggest difference is the temperature.
