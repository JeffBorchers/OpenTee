# Reddit Post Draft for r/golf

## Recommended Title Options

**Option A (Direct):**
> I built an open-source tool to catch practice bay drops at PGA Superstores

**Option B (Problem-Focused):**
> Tired of waking up at 3 AM to book a practice bay? I built something.

**Option C (Story-First):**
> I couldn't get a practice bay at my local PGA Superstore for months. So I built this.

---

## Post Body

The Saturday morning routine was getting old.

Wake up at 2:45 AM. Stumble to the couch. Open the USchedule app. Wait. At exactly 3:00 AM — refresh like crazy. Pray that the 10 AM bay slot hasn't already been snatched by someone faster (or worse, by a bot).

For three weeks straight, I missed out. Either the slots were already gone by 3:01, or I fell back asleep and woke up to nothing but 7 PM on a Tuesday.

I'm a manufacturing engineer by day. I build things for a living. So I did what I do — I built something.

**[OpenTee](https://github.com/opentee/opentee)** is an open-source tool that monitors tee time and practice bay availability 24/7. You tell it what you want (Saturday mornings, 9-11 AM, any PGA Superstore in Grand Rapids), and it watches for you. When a slot opens — whether from a scheduled drop or a last-minute cancellation — you get an SMS or email instantly.

No more 3 AM alarms. No more refreshing the app every 5 minutes during lunch hoping someone cancelled. The software does the watching; you do the booking.

**Why open-source?**

A few reasons:

1. **Privacy.** I don't want my PGA Superstore login sitting on someone else's server. When you self-host OpenTee, your credentials stay on your machine.

2. **Free forever.** No subscription, no per-booking fees. Clone the repo, run it locally or on a cheap VPS, done.

3. **Community.** I'm one guy in Michigan. If this is useful to others, I'd love feedback, feature requests, pull requests. Golfers helping golfers.

**What it does right now:**

- Monitors USchedule (PGA Tour Superstore) for availability
- Sends instant SMS/email alerts when slots open
- Tracks multiple locations and time preferences simultaneously
- Catches cancellations, not just scheduled drops

**What's coming:**

- Support for GolfNow, TeeOff, and other booking platforms
- Voice booking (AI that calls the course for you)
- Auto-booking if you want it fully hands-off

**The honest truth:**

This isn't a finished product. It's a working prototype that I built to solve my own problem. I'm sharing it because I suspect I'm not the only one tired of competing with bots at 3 AM.

If you're comfortable running Node.js and following a README, give it a shot: **[github.com/opentee/opentee](https://github.com/opentee/opentee)**

If you try it, I'd love feedback. What works, what doesn't, what booking platform your local course uses, what feature would make this actually useful for you.

Happy to answer questions in the comments.

---

## TL;DR

Built an open-source tool that monitors practice bay and tee time availability so you don't have to wake up at 3 AM to book. Free, self-hosted, your credentials stay local. Early stage but working. Looking for beta testers and feedback: **github.com/opentee/opentee**

---

## Notes for Posting

1. **Timing:** Post on a weekday morning (Tuesday-Thursday, 8-10 AM EST) when r/golf is active but not overwhelmed with weekend content.

2. **Engagement plan:** Check comments every few hours for the first 24 hours. Answer questions honestly, even critical ones. The authenticity is the selling point.

3. **Don't cross-post immediately:** Let this gain traction in r/golf first. If it does well, consider r/golfreddit or r/programming after a week.

4. **Respond to criticism gracefully:** Expect "just set an alarm" comments. Acknowledge that works for some people, but not everyone wants to restructure their sleep schedule around booking software.

5. **Follow Reddit rules:** No vote manipulation, no asking friends to upvote. Let it stand or fall on its own merit.

6. **Be prepared for "why not just call the pro shop?":** Legitimate point. Some courses work great that way. PGA Superstores are almost entirely online booking now.

---

## Alternative Shorter Version (if above feels too long)

Title: Built an open-source tool to catch practice bay drops at PGA Superstores

Body:
```
If you've ever tried to book a Saturday practice bay at PGA Superstore, you know the drill: 3 AM drops, gone in 60 seconds.

I got tired of setting alarms and missing out anyway. So I built OpenTee — open-source monitoring that watches for availability 24/7 and texts you when a slot opens.

Free, self-hosted (your login stays on your machine), works with USchedule now (GolfNow/other platforms coming).

github.com/opentee/opentee

Looking for beta testers and feedback. Happy to answer questions.
```
