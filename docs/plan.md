---
title: CLAW Fall 2026 Build Block
created: 2026-09-01
window: 2026-09-02 → 2026-12-02
tags: [claw, schedule, spec-check, career]
---

# CLAW Fall 2026 Build Block

**The block:** Wednesdays 17:00–20:00, 14 sessions, Sept 2 → Dec 2 2026.
**Spillover:** one weekend session, 2–4 hrs, Saturday morning.
**Realistic weekly budget:** 6 hrs. Total across the window: **~78 hrs**, minus Thanksgiving week and two interview weeks → **~66 hrs of real capacity.**

---

## 1. The December goal

> **By Wednesday, December 2, 2026: The Spec Check is a live channel with six published episodes, running on a repeatable pipeline, hosted from a portfolio site live on your own domain — and episodes 4–6 have specified the bill of materials for the Q1 LQR motor node.**

Four clauses, each independently testable. You either have six videos up or you don't.

### Why this goal and not another one

You delegated the call, so here is the reasoning, including the part that argues against it.

**Spec Check is the only track that pays three debts at once.**

| Debt | How Spec Check pays it |
|---|---|
| Content / CLAW revenue (priority #2) | The channel *is* the top of the CLAW funnel |
| Robotics role (priority #1) | Datasheet-level component judgment is exactly what an applications engineer does all day — and it is demonstrable, unlike "I'm interested in robotics" |
| LQR → ROS 2 series (Q1 2027) | Same faceless pipeline, same deck template. Building it now means Q1 starts at episode production instead of at tooling |

And the episode slate below is deliberately front-loaded toward the **motor node BOM** — motor drivers, IMUs, current sensing. The content research *is* the hardware research. You do not pay for those hours twice.

**The argument against it, which is real.** You are waiting on Re:Build. If your #1 priority is a role and that offer doesn't land, six YouTube videos is a slower path to a job than sixty targeted applications. I'm still recommending Spec Check because the portfolio deploy in Week 2 covers the application path's actual bottleneck (you have no live site), and because interview weeks are explicitly budgeted below. But if you get to mid-October with no offer and no traction, the correct move is to reallocate — see §6.

### Tiered honesty on the target

| Tier | Outcome | Assessment |
|---|---|---|
| **Realistic** | 5 episodes published, 6th scripted | This happens if nothing goes wrong and one thing does |
| **Target** | 6 published | Achievable at 6 hrs/week with disciplined scope per episode |
| **Stretch** | 6 published + 1k subs | Subscriber count is not under your control. Do not set it as a goal |
| **Not viable** | 8+ episodes, or any LQR episode published, or a pill-sorter prototype built | Not in 66 hours. Don't plan for it |

---

## 2. The episode slate

Six comparison episodes, ordered by **pipeline cost**, not by topic appeal.

| Ep | Topic | Parts compared | Why it's here |
|---|---|---|---|
| 1 | Li-ion charge ICs | BQ21040 / TP4056 / MCP73831 | You've shipped a BQ21040 design. Lowest research cost while the pipeline is still being built |
| 2 | Buck regulators | LM2596 / MP1584 / TPS5430 | The "$2 module vs. a real design" story. Ties straight to your MEP power instincts |
| 3 | MCU pick | ESP32-C3 / ESP32-S3 / RP2040 | **The traffic episode.** Highest search volume of the six |
| 4 | Motor drivers | DRV8833 / TB6612FNG / L298N | Motor node BOM |
| 5 | IMUs | MPU6050 / ICM-42688-P / BNO055 | Motor node BOM + direct setup for LQR state estimation |
| 6 | Current sensing | INA219 shunt / ACS712 / hall-effect | Motor node BOM — this is the closed-loop feedback path |

**On launch order.** The instinct is to open with Ep 3, the big one. Don't. Episode 1 will be your worst-produced video no matter what topic it covers, and YouTube keeps recommending it forever. Spend the pipeline-learning cost on the narrow topic where you already know the answer, and drop the high-traffic episode in mid-October when the format is stable and there are two videos in the back catalog for a new viewer to click into.

---

## 3. Week-by-week

| # | Date | Wednesday block (3 hrs) | Weekend (2–4 hrs) |
|---|---|---|---|
| 1 | **Sep 2** | Channel spec: name/handle, episode format spec (length, section structure, outro), thumbnail template. Build the Spec Check deck template as a single-file HTML | Record a 5-min throwaway to test audio chain |
| 2 | **Sep 9** | **Portfolio deploy.** Cloudflare Pages + custom domain. Kill the Imgur hotlinks and the Dropbox résumé link | Buy domain, DNS propagation, OG card check |
| 3 | **Sep 16** | Ep 1 research + script (charge ICs) | Record + rough cut |
| 4 | **Sep 23** | Ep 1 finish + **publish**. Write the upload checklist while it's fresh | — |
| 5 | **Sep 30** | Ep 2 research + script (buck regulators) | Record + cut |
| 6 | **Oct 7** | Ep 2 **publish** + first retro: what did an episode actually cost in hours? | — |
| 7 | **Oct 14** | Ep 3 research + script (MCU pick) — give this one the full block | Record + cut |
| 8 | **Oct 21** | Ep 3 **publish** + **checkpoint** (see §6) | — |
| 9 | **Oct 28** | Ep 4 research + script (motor drivers) | Record + cut |
| 10 | **Nov 4** | Ep 4 **publish** | — |
| 11 | **Nov 11** | Ep 5 research + script (IMUs) | Record + cut |
| 12 | **Nov 18** | Ep 5 **publish** + Ep 6 research started | Ep 6 record + cut |
| 13 | **Nov 25** | **SKIP — Thanksgiving eve. This is your buffer week, not a work week** | — |
| 14 | **Dec 2** | Ep 6 **publish** + 90-day review + Q1 handoff doc to the LQR series | — |

Week 13 is deliberately empty. If you're on schedule you take it off; if you're one episode behind, it's the recovery slot. Do not spend it in advance.

### Session template (use this every Wednesday)

| Time | What |
|---|---|
| 5:00–5:15 | Read last week's log. Write down **the one deliverable** for tonight |
| 5:15–6:45 | Deep block 1 — the hardest task, no exceptions |
| 6:45–7:00 | Break, away from the desk |
| 7:00–7:50 | Deep block 2 |
| 7:50–8:00 | Log: what shipped, what's blocked, what's first next Wednesday |

The split between Wednesday and the weekend is not arbitrary: **Wednesday is for thinking work** (research, scripting, decisions), **Saturday is for mechanical work** (recording, rendering, thumbnails, upload). Recording needs a quiet house and rendering is dead time — neither deserves your best 3 hours of the week.

---

## 4. What this schedule deliberately excludes

Naming these matters more than listing what's in, because each one will try to get back in.

- **LQR → ROS 2 episodes** — that's a 6–9 month arc. Q1 2027. This block builds its pipeline, nothing more.
- **Pill sorter build work** — client-driven timing, and see the displacement rule in §6.
- **Sidestream V2** — the provisional clock runs to June 2027; non-provisional prep starts ~February. Outside this window. See the IP flag below.
- **PE licensure track** — the bottleneck there is a conversation with IMEG about supervision and exam support, not Wednesday-night hours. That's a 30-minute ask at work, not a project.
- **VoltIQ, CLAW Bench, Burger Bar, MLB pipeline** — parked through December.
- **Daily rapid-learning reps** — you didn't pick them, so they're not in the plan. If you want a warm-up, "The Hour" already has a 30-topic Spec bank; 10 minutes before scripting is free.

---

## 5. Standing flags

**IP disclosure — this one is live, not theoretical.** Episode 1 covers the **BQ21040**, which is in the Sidestream V2 power chain, and the MCU episode covers the **ESP32-C3**, also in Sidestream. Discussing those parts generically is fine. Discussing them *in the context of a handheld filtration device*, or showing anything that reads as the Sidestream schematic, is a public disclosure before your non-provisional filing. The rule: **the part is fair game, the application is not.** If an episode starts wanting a "real world example," pick a different one. Run anything you're unsure about past your patent attorney before it goes public — I'm not a lawyer and this is a real deadline.

**Datasheet provenance.** The whole premise of the channel is that you read the actual datasheet. Cite revision numbers on screen, and separate the manufacturer's spec from what a hobbyist blog claims about the part. That distinction is the channel's entire credibility moat, and it's cheap to maintain if you do it from Ep 1.

**Part currency.** Several parts in the slate have status changes worth checking at script time — MPU6050 in particular is long in the tooth and "should you still use this in 2026" is arguably the strongest angle in Ep 5. Verify NRND/EOL status against the manufacturer's page for every part before you script it, not after.

---

## 6. Contingency rules

Decide these now so you're not deciding them tired at 7pm.

**Interview weeks.** If a technical round gets scheduled, that Wednesday converts to prep and the episode slips one week. Two such weeks are already budgeted. A third means the target drops to five episodes — that's the correct trade, not a failure.

**If the pill sorter converts to a paid Phase 1.** Paid client work outranks unpaid content. It displaces episodes 5 and 6, and the December target becomes **four published episodes plus a delivered feasibility engagement**. Write that down now so the pivot doesn't feel like falling behind.

**The Oct 21 checkpoint.** Three episodes in, ask two questions: is an episode actually costing 6 hours or 10? And is anything landing at all? If episodes cost 10 hours, cut scope — three parts becomes two, ten minutes becomes six. Do not cut sessions.

**If there's no offer by mid-October.** Reallocate one Wednesday per fortnight from production to applications and outreach. The episodes slip to a monthly cadence and the December target becomes four. The job is priority #1 and the schedule should visibly bend to it.

---

## 7. Glossary

| Term | Meaning here |
|---|---|
| **Pipeline** | The repeatable path from topic → script → deck → recording → cut → upload. The Week 1 deliverable |
| **Motor node** | The STM32 closed-loop motor control artifact from the August roadmap; Ep 14 of the LQR series builds it |
| **NRND** | Not Recommended for New Designs — manufacturer status short of EOL |
| **Displacement rule** | A pre-agreed swap so paid or urgent work replaces planned work without renegotiation |
| **Buffer week** | Nov 25. Unallocated on purpose |

---

## 8. Framing language

For interviews, when asked what you've been doing since the M.S.:

> "I run a technical channel where I compare components at the datasheet level — charge controllers, buck regulators, motor drivers. It started as a way to force myself to actually read datasheets instead of trusting a hobbyist blog, and it turned into the selection process for a closed-loop motor controller I'm building. It's the same judgment call an applications engineer makes when a customer asks which sensor to hang on a platform."

For CLAW client outreach:

> "I publish component comparison work publicly — you can see how I evaluate parts before you hire me to pick them."

---

## 9. Verified vs. unverified

**Verified in this session:** the 14 Wednesday dates (Sep 2 through Dec 2 inclusive, confirmed as 14 occurrences); the hour math (14 × 3 = 42 hrs Wednesday-only, ~78 hrs with weekend spillover at 6 hrs/week); consistency with the prior 6–8 hrs-per-episode production estimate and the biweekly cadence finding from the LQR curriculum session; conflict check against the August roadmap priority ranking.

**Not verified, and you should check:** current NRND/EOL status and pricing for all 18 parts in the slate; whether the Spec Check channel handle and portfolio domain are available; current YouTube search volume for the six topics (the Ep 3 "highest traffic" claim is my judgment, not measured data); whether Re:Build's timeline changes the interview-week budget. The calendar block was created as a **draft event** — the direct calendar write was denied, so confirm it actually landed on your calendar.
