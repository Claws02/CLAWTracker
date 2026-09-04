---
title: Drone Stack Reference — PX4, QGroundControl, and the 2026 Component Market
created: 2026-09-04
for: Re:Build Manufacturing deep-dive + CLAWSEngineering channel pivot
tags: [claw, drones, px4, qgroundcontrol, ndaa, spec-check, career]
---

# Drone Stack Reference

**Scope.** The four areas Re:Build asked for, in the order they asked: PX4 and
QGroundControl; camera and radio options and what they cost; latest developments
in flight controllers; payload integration. Compliance status is carried as an
explicit column throughout, because you don't yet know whether Re:Build's context
is defense-adjacent or purely commercial — and as §2 shows, that axis now
dominates the market more than price or specs do.

---

## 0. Read this first: provenance and the one fact that reframes everything

### Provenance rules used here

Primary sources are PX4's own documentation and release notes, and vendor release
feeds. Legal and market claims come from law-firm client alerts and trade press,
and are labelled as such. Anything I could not confirm is marked
**[unverified]** rather than smoothed over. §9 is the full verified/unverified
split — read it before you quote any number in a meeting.

**A real limitation, stated up front:** this session's network policy blocked
`px4.io`, `docs.px4.io`, `diu.mil`, `dcma.mil`, `getfpv.com`, `holybro.com`,
`arkelectron.com`, `auterion.com`, `mavlink.io` and `ardupilot.org`. I sourced
the PX4 half from the documentation's own markdown in the GitHub repo, which is
the same text those doc sites render, so that half is solid. **The pricing half
is not.** I could not open a single vendor storefront. Treat every dollar figure
below as an order-of-magnitude anchor to be confirmed, not a quote. §7 makes
closing that gap your first task, and it is a genuinely short one with a browser.

### The fact that reframes everything

On **22 December 2025** the FCC added to its Covered List **all uncrewed aircraft
systems and UAS "critical components" produced in a foreign country** — not just
DJI and Autel, which is what the FY25 NDAA had actually required. Being on the
Covered List blocks *new* FCC equipment authorisations; it does not retroactively
ban the import, sale or use of previously authorised models. Announced exemptions
run until **1 January 2027**.

Why this matters more than any spec sheet: the drone component market you are
being asked to survey is, as of 2026, **segmented by country of origin and
authorisation status before it is segmented by price or performance.** A camera
that is best-in-class and $200 may be unbuyable for a given program, while a
worse camera at $4,000 is the only option. If you walk into Re:Build talking
about sensor specs and latency without this axis, you will look like a hobbyist.
If you lead with it, you look like someone who understands their procurement
problem.

*Sources: law-firm client alerts (Wiley, Akin Gump) and trade press (DroneLife,
AUVSI). I could not reach the FCC primary text — see §9.*

---

## 1. PX4 and QGroundControl

### 1.1 Version picture as of 4 September 2026

| Component | Current | Date | Note |
|---|---|---|---|
| PX4 Autopilot | **v1.17.0** stable | 2026-05-14 | The one to learn and build against |
| PX4 Autopilot | v1.18.0-beta2 | 2026-08-09 | In flight test; likely stable during your fall block |
| QGroundControl | **v5.1.4** stable | 2026-08-30 | Five days old as of writing |
| QGroundControl | v5.0 line | 2025-07-11 | Superseded |
| ExpressLRS | **v4.1.0** | 2026-07-17 | v4 TX will not talk to a v3 RX |

Two things follow. First, **anything you read from before mid-2026 describes a
different PX4** — v1.17 is four months old and carries real breaking changes.
Second, **v1.18 will probably go stable inside your fall block.** Build your notes
so a version bump is a diff, not a rewrite.

### 1.2 What PX4 v1.17 actually changed

**Multicopter.** A new **Altitude Cruise** mode that "holds tilt and heading on
stick release so the vehicle keeps cruising at a steady velocity instead of
stopping like Altitude mode does." Orbit mode's max speed became configurable
instead of hardcoded.

**Fixed-wing.** Takeoff mode "keeps climbing with level wings on navigation loss
and can use the takeoff waypoint latitude and longitude to define the loiter
position" — i.e. a GPS dropout during the most dangerous phase of flight no longer
ends the aircraft. High-level control interfaces were reworked for cleaner
external integration.

**Rover.** New setpoint types via the PX4 ROS 2 Control Interface; actuator
control separated from position-control logic. Rovers are now a first-class
citizen rather than an afterthought.

**VTOL.** Fixes for stuck states during back-transition.

**Middleware — the part worth your attention.** The in-tree **Zenoh** middleware
matured to `rmw_zenoh` compatibility (CDRv1 serialisation, ROS 2 graph liveliness,
auto-generated config from `dds_topics.yaml`, Domain ID parameter, Zenoh CLI). It
ships built into FMUv6X-RT default firmware and is opt-in elsewhere. **uXRCE-DDS**
remains the mainline ROS 2 bridge and gained index-based namespace configuration.

**Neural network control.** PX4 now integrates **TensorFlow Lite Micro on-device**,
so an externally trained network can be loaded as a `.tflite` model and
substituted for the multicopter controller — explicitly framed for research and
bench testing, not production.

**New flight controllers supported:** Radiolink PIX6, CUAV X25-Evo, Accton Godwit
GA1, Kakute H7 dual-IMU variant, NarinFC-H7, and generic ESP32 target support.

**New sensors:** MicroStrain, sbgECom and EULER-NAV baro-inertial INS driver
families; QMC5883P compass; ARK X20/F9P GPS; ARK DIST rangefinder. **Septentrio
GNSS resilience reporting** now exposes jamming, spoofing and authentication
states — which is a defense-relevant capability and a strong talking point.

### 1.3 Breaking changes in v1.17 — the highest-value page in this document

These are the things that will make a previously-working airframe behave badly
after an update. Knowing them cold is exactly the kind of detail that reads as
real experience.

| Change | What breaks | What to do |
|---|---|---|
| RC deadzone | The hardcoded 1% deadzone on RC channels 1–8 was **removed** | Any centre-stick jitter now reaches the controller. Set `RC<N>_DZ` per channel explicitly |
| Servo trim | `PWM_*_TRIM` replaced by `PWM_*_CENTER`, asymmetric deflection | Manual reconfiguration required; trims do not migrate |
| MAVLink version | `MAV_PROTO_VER` now defaults to **2** | v1 is opt-in only. Legacy GCS or peripherals may drop off |
| Manual control params | `MPC_XY_MAN_EXPO`, `MPC_Z_MAN_EXPO`, `MPC_YAW_MAN_EXPO` removed; `MPC_HOLD_DZ` → `MAN_DEADZONE` | Re-tune stick feel from scratch |
| Battery status | Serial number moved from `battery_status` to a new `battery_info` uORB message | Any log parser or ground tool reading serials must be updated |
| Commander | `commander lockdown on` → `commander termination`; `FORCE_FAILSAFE` action → `TERMINATION` | Update scripts and failsafe docs |

**The one that will actually bite someone:** the RC deadzone removal. A worn
gimbal that was silently masked by the 1% deadzone now produces continuous drift
after a routine firmware update, and it will present as "the drone won't hold
position" rather than "your sticks are worn."

### 1.4 The mental model

Keep these four separate in your head — conflating them is the most common
beginner tell:

- **PX4** is the flight-control firmware running on the autopilot hardware.
- **MAVLink** is the wire protocol. It is what PX4 speaks, not part of PX4.
- **QGroundControl** is *a* MAVLink ground station. It is a client, and
  interchangeable with others (Auterion Mission Control, MAVSDK apps, custom).
- **ROS 2** is the companion-computer world, bridged to PX4 over uXRCE-DDS (or now
  Zenoh). It is where autonomy that is too heavy for the flight controller lives.

PX4 and ArduPilot are the two open autopilot stacks and are *not* the same
project; both speak MAVLink and both work with QGC. Re:Build asked for PX4, so
lead there, but know that ArduPilot exists and that the choice between them is a
real engineering decision, not a religious one. **[Partly unverified — I could not
reach ardupilot.org this session; the comparison above is from general knowledge,
not checked against current ArduPilot docs.]**

---

## 2. Cameras and radios: what's on the market and what it costs

### 2.1 First, three compliance regimes that are not the same thing

This is the single most useful table in the document. People use these terms
interchangeably and they are distinct legal instruments.

| Regime | Who runs it | What it does | Practical effect |
|---|---|---|---|
| **NDAA §848** (FY20) | Statute, DoD | Bars DoD operating or procuring UAS made in, or containing critical components from, the PRC | "NDAA-compliant" is a *self/vendor claim* about supply chain |
| **Blue UAS Cleared List** | DIU originally; **transitioned to DCMA in late 2025** | Vetted catalogue of platforms and components cleared for federal use | A higher bar than NDAA-compliant. 50+ platforms as of early 2026 |
| **FCC Covered List** | FCC | Blocks *new* equipment authorisations for listed gear | Since 22 Dec 2025 covers **all foreign-made UAS and critical components** |

**A drone can be NDAA-compliant without being Blue UAS cleared.** Blue UAS is the
stricter, curated list. And the FCC action is a third, orthogonal constraint that
bites on radio authorisation rather than procurement eligibility.

The statute names the critical components explicitly: **flight controllers,
radios, data transmission devices, cameras, gimbals, ground control systems and
operating software, and data-storage units.** That list is essentially the entire
bill of materials — which is why this is not a niche concern.

### 2.2 Radio links

Two genuinely separate markets that share almost no vendors.

| Tier | Examples | Typical cost | Compliance posture |
|---|---|---|---|
| Hobby / FPV control link | **ExpressLRS v4.1** (open source), TBS Crossfire, FrSky | RX ~$19; TX module ~$50–100 **[unverified]** | ELRS is an open *protocol*; hardware is mostly Chinese-made. Treat as non-compliant unless a specific US-built RX is identified |
| Integrated control + video + telemetry | Herelink | Low hundreds to ~$1k **[unverified]** | CubePilot; verify origin per SKU |
| Industrial IP mesh | **Doodle Labs**, Silvus StreamCaster | Thousands to tens of thousands **[unverified]** | Doodle Labs and Silvus are the names that appear on compliant builds. Silvus carries export restrictions |

**The engineering point worth understanding:** ELRS and Crossfire are *control*
links — low bandwidth, long range, built so the aircraft never loses command.
Doodle Labs and Silvus are *IP mesh* radios — they carry a network, so video,
telemetry and command share one pipe, and multiple aircraft can form a
self-healing mesh. These are not competing products; they solve different
problems. A cheap ELRS link plus a separate video transmitter is architecturally
different from a single mesh radio carrying everything.

ELRS v4 note: **a v4 transmitter will not talk to a v3 receiver**, and upgrading
v3→v4 wipes the config filesystem. If Re:Build has a fleet on v3, that migration
is a real project, not a firmware click.

### 2.3 Video and cameras

**Consumer/FPV digital video is a three-way ecosystem war, and all three are
incompatible with each other** — goggles and air units do not interoperate, so
the choice locks you in for years.

| System | Resolution / latency | Position |
|---|---|---|
| **DJI O4** | 1080p100 feed, ~28 ms glass-to-glass; O4 Pro records 4K120 onboard | Best image quality; largest ecosystem |
| **Walksnail Avatar** | 1080p60, ~22–28 ms | Middle ground; more open to third-party goggles |
| **HDZero** | 720p60, ~14–18 ms (uncompressed path quoted as low as 3–5 ms) | Racing; lowest latency |

*All figures from FPV trade blogs, not vendor datasheets — **[unverified]**.*

**And here is where §0 comes back.** DJI is the centre of gravity of that entire
market and is precisely what the December 2025 FCC action targets. For any
federal, defense-adjacent, or increasingly even utility/public-safety customer,
**the best consumer FPV video system is not procurable.** The compliant payload
market is a different industry with different vendors and no published prices.

**The compliant payload market is moving right now.** In the last two weeks —
Gremsy USA announced a Blue UAS-cleared EO/IR payload line (VIO F1, ORUS L NDAA,
LYNX NDAA) built on Teledyne FLIR OEM thermal cores, covered by trade press on
26 August and 2 September 2026. The VIO F1 pairs a Sony 4K block zoom EO sensor
with a 640×512 radiometric **Boson** thermal core described as NDAA-compliant and
**ITAR-free**, plus a 2,400 m laser rangefinder.

**Pricing:** none published, for any of it. That is not a gap in my research —
it is the answer. This tier is quote-only. When Re:Build asks "what does it
cost," the correct answer is "EO/IR gimbal payloads are quoted, not listed;
here's the spec envelope and here's who to RFQ." The consumer tier publishes
prices; the compliant tier does not. **That contrast is itself a finding.**

---

## 3. Flight controllers: latest developments

### 3.1 The Pixhawk open standards

Pixhawk is a set of **open hardware standards**, not a company. Multiple vendors
build to the same FMU standard, which is why a Holybro, a CUAV and an ARK board
can run the same PX4 firmware.

| Standard | Core | Notes |
|---|---|---|
| **FMUv6C** | STM32H7 | Cost/size-reduced tier |
| **FMUv6X** | STM32H753 @ 480 MHz | High end: triple-redundant IMU, double-redundant baro, on separate buses, with automatic failover |
| **FMUv6X-RT** | ~1 GHz core, 2 MB RAM, 64 MB flash | Faster variant; the board PX4 ships Zenoh on by default |

The redundancy story is the thing to understand: **triple IMUs on separate buses
with detection-and-switchover** is why these boards cost what they do, and it is
the concrete answer to "why not just use a $30 flight controller."

### 3.2 The vendor landscape, with the compliance column

| Vendor | Products | Origin / compliance |
|---|---|---|
| **Holybro** | Pixhawk 6C, 6C Mini, 6X, 6X-RT | Widely used; Chinese-manufactured. Pixhawk 6C listed from **$165.99** **[unverified]** |
| **CUAV** | Pixhawk FMUv6X, X25-Evo (new in PX4 v1.17) | Chinese-manufactured |
| **ARK Electronics** | ARKV6X, **ARKV6S**, ARK FPV | **Designed and built in the USA; NDAA and FCC compliant.** ARKV6S is 5 g, 3.6 × 2.9 × 0.5 cm, built on the Pixhawk Autopilot Bus (PAB) standard |
| **Auterion** | Skynode GX, Skynode S, Skynode X | Integrated flight controller **+ mission computer**. Skynode GX described as fully NDAA-compliant, built on FMUv6X, MAVLink and PX4 |

**The development that matters:** the interesting movement in flight controllers
is not raw MCU performance — it is (a) **US-built boards on open Pixhawk
standards** (ARK) filling the compliance gap left by the Chinese incumbents, and
(b) **the merge of flight controller and mission computer into one unit**
(Auterion Skynode). The second is the architectural trend: autonomy that used to
need a separate companion computer is collapsing into the autopilot module.

---

## 4. Payload integration

### 4.1 PX4's payload model

PX4 defines a payload as equipment carried to accomplish the mission — "cameras
of various types, cargo, instrumentation, and so on." Payloads connect to flight
controller outputs and are actuated three ways:

1. **Automated triggering during missions**
2. **Manual control** via RC controller or joystick
3. **Remote commands from the ground station** over MAVLink/MAVSDK

The documented subtopics are: Payload Use Cases, Package Delivery Mission,
Generic Actuator Control, Camera, Gimbal (Mount) Configuration, and Grippers.

### 4.2 Camera integration — three tiers

PX4 supports exactly three approaches, and choosing between them is the core
payload-integration decision:

| Approach | Protocol | When to use |
|---|---|---|
| **MAVLink camera (v2)** | Camera Protocol v2 | **The recommended option.** "The broadest access to camera features using a simple and consistent command/message set" |
| **Simple MAVLink camera (v1)** | Camera Protocol v1 | Older, more limited functionality |
| **Flight-controller-connected camera** | Camera Protocol v1, via FC outputs | Camera wired directly to autopilot outputs — trigger via PWM/GPIO rather than over a network |

**The pattern that answers most real integration questions:** for a camera that
does not speak MAVLink v2 natively — which is most interesting sensors — you run
**a camera manager on a companion computer** that translates between MAVLink and
the camera's native protocol. That is the standard architecture for integrating a
third-party EO/IR payload, and it is why the companion computer exists on serious
airframes.

So the decision tree is: *Does the payload speak MAVLink v2? → integrate
directly. Does it speak something proprietary? → companion computer running a
camera manager. Is it a dumb trigger (mapping camera, release mechanism)? →
flight-controller-connected, PWM/GPIO.*

**[Unverified]** I could not retrieve PX4's gimbal configuration page or the
MAVLink camera protocol message definitions this session — the gimbal doc is not
in the `payloads/` or `camera/` directories I could list, and `mavlink.io` was
blocked. Gimbal specifics are a known gap; see §7 day 3.

---

## 5. Honest assessment

### 5.1 Tiered: what this pivot realistically gets you

**Strongest fit — do this.** The *compliance-and-supply-chain* lane. Almost
nobody making drone content explains NDAA §848 vs. Blue UAS vs. the FCC Covered
List correctly, the distinctions are genuinely confusing, the stakes are real
money, and the situation is changing monthly. It plays directly to the Spec Check
premise: read the primary document, not the forum post. It is also the single
most useful thing you can be fluent in for Re:Build.

**Workable.** PX4 firmware depth — breaking changes, parameter archaeology,
version migration. Real value, smaller audience, and it ages fast. Good as
supporting episodes, weak as the channel's identity.

**Stretch.** Competing on FPV build/review content. That market is saturated with
people who fly better than you and have been at it for years. Your edge is not
piloting.

**Not realistic in this block.** Flying, filming and publishing six episodes that
each require a fully built and tuned airframe. Airframe work will eat the schedule
that was budgeted for component teardowns. If the slate goes drone-*flight*
rather than drone-*component*, the December goal is at risk — and note that the
existing plan already tiers "6 published" as Target and "5 published, 6th
scripted" as Realistic, with only ~66 hours of real capacity.

### 5.2 Why this pivot is genuinely good for you

The existing slate is more salvageable than it looks. Episodes 4, 5 and 6 —
motor drivers, IMUs, current sensing — are *already* the drone stack. The IMU
episode in particular (MPU6050 / ICM-42688-P / BNO055) is literally flight
controller sensor selection: the ICM-42688-P is the class of part that sits in
the redundant IMU stack of an FMUv6X. And the LQR motor-node tie-in survives
intact, because quadcopter attitude control is the canonical LQR application. The
pivot tightens the story rather than discarding it.

Your Part 107 is a real asset here and most component reviewers don't have one.

### 5.3 Standing flags

**IP — unchanged and still live.** The ESP32-C3 is in Sidestream, and PX4 v1.17
added generic ESP32 target support, so ESP32 will come up naturally in drone
content. The existing rule holds and actually gets *easier*: the part is fair
game, the application is not. Discussing an ESP32 in a flight-controller or
telemetry context is not a filtration-device disclosure. Keep the two domains
verbally separate on camera, and run anything uncertain past your patent attorney
before publishing. I'm not a lawyer and the non-provisional deadline is real.

**Export control — new, and it comes with the drone territory.** If you work on
compliant/defense payloads at Re:Build and simultaneously publish drone content,
you need a bright line: **public content is built only from public datasheets and
public policy documents, never from anything you see at work.** Note that the
FLIR Boson core was specifically marketed as *ITAR-free* — the fact that vendors
advertise this tells you the surrounding category is not. Ask Re:Build early what
their rules are for employee public technical content; asking makes you look
careful, not difficult.

**Datasheet provenance — the rule that still matters most.** The channel premise
is that you read the actual datasheet with a revision number. Drone components
make this *harder*, not easier: much of the compliant tier publishes marketing
PDFs rather than real datasheets, and EO/IR payload specs are quote-gated. Do not
let the pivot erode the `[[fill]]` discipline. If a spec can't be sourced to a
revision-numbered document, it stays `[[fill]]` or the claim doesn't ship.

---

## 6. Glossary

| Term | Meaning |
|---|---|
| **PX4** | Open-source flight control firmware for UAS and other vehicles |
| **ArduPilot** | The other major open autopilot stack; also speaks MAVLink |
| **MAVLink** | Lightweight messaging protocol between vehicle, GCS and companion computer |
| **QGroundControl (QGC)** | Cross-platform MAVLink ground control station |
| **GCS** | Ground Control Station |
| **uXRCE-DDS** | The micro-ROS/DDS bridge PX4 uses to talk to ROS 2 |
| **Zenoh** | Newer pub/sub middleware; matured to `rmw_zenoh` compatibility in PX4 v1.17 |
| **uORB** | PX4's internal publish/subscribe message bus |
| **FMUv6X / v6C / v6X-RT** | Pixhawk open hardware standards defining autopilot capability tiers |
| **PAB** | Pixhawk Autopilot Bus — the connector/carrier standard separating FMU module from carrier board |
| **Companion computer** | Linux SBC alongside the autopilot for vision, autonomy, payload management |
| **Camera manager** | Software translating between MAVLink and a camera's native protocol |
| **EO/IR** | Electro-Optical / Infrared — a dual visible + thermal sensor payload |
| **Radiometric** | Thermal imaging where each pixel carries an actual temperature value |
| **Gimbal** | Stabilised, usually steerable payload mount |
| **ELRS** | ExpressLRS — open-source long-range RC control link |
| **MANET / IP mesh** | Self-healing radio network; multiple nodes relay for each other |
| **Glass-to-glass latency** | Total delay from lens to pilot's display |
| **NDAA §848** | FY20 statute barring PRC-sourced UAS/components from DoD use |
| **Blue UAS Cleared List** | Vetted federal catalogue; stricter than NDAA-compliant. Now run by DCMA |
| **FCC Covered List** | FCC list blocking new equipment authorisations |
| **DIU / DCMA** | Defense Innovation Unit / Defense Contract Management Agency |
| **SWaP** | Size, Weight and Power |
| **ITAR / EAR** | US export control regimes for defense and dual-use technology |
| **Part 107** | FAA certification for commercial small-UAS operation |

---

## 7. Action sequence

Hands-on first. Reading about PX4 does not transfer; flashing it does.

**Day 1 (Fri 5 Sep) — close the pricing gap.** One hour with a browser and a
spreadsheet. Open GetFPV, Holybro and ARK Electronics. Price a complete airframe
BOM twice: once unconstrained, once NDAA-compliant-only. The delta between those
two numbers is the most valuable single artifact you can bring to Re:Build, and
it is the thing I could not produce for you this session.

**Day 2 (Sat 6 Sep) — install and simulate.** QGC v5.1.4 and the PX4 v1.17 SITL
toolchain. Fly the jMAVSim/Gazebo sim. Try the new Altitude Cruise mode. You will
have touched the actual software before you have any hardware.

**Day 3 (Sun 7 Sep) — close my documentation gaps.** Read PX4's gimbal
configuration page and the MAVLink camera protocol v2 message set — both of which
I could not reach. Write down how `MAV_CMD_DO_DIGICAM_CONTROL`-era v1 differs
from the v2 command set. **[This is the known hole in this document.]**

**Day 4 (Mon 8 Sep) — parameters.** In SITL, deliberately reproduce two v1.17
breaking changes: set `RC<N>_DZ` and observe deadzone behaviour, and flip
`MAV_PROTO_VER`. Breaking changes you have personally triggered are the ones you
can talk about credibly.

**Day 5 (Tue 9 Sep) — the compliance memo.** Write one page, for yourself,
distinguishing NDAA §848 / Blue UAS / FCC Covered List, with dates and the
1 Jan 2027 exemption cliff. Source it to primary documents — the FCC public
notice and the DCMA list — which you can reach and I could not.

**Wed 10 Sep — first block session.** Bring the two BOMs and the compliance memo.
Decide the reframed episode slate against real numbers rather than vibes.

**Ongoing:** watch for PX4 v1.18 going stable. It is in beta2 now and will likely
land mid-block.

---

## 8. Framing language for Re:Build

Use these as starting points, not scripts.

**On the market survey:**
> "The component market split in December — the FCC put all foreign-made UAS and
> critical components on the Covered List, with exemptions running to January
> 2027. So I priced the BOM twice, unconstrained and compliant-only. The delta is
> the number that actually matters for procurement planning."

**On PX4 currency:**
> "We're on v1.17, out in May. The breaking change I'd watch is the RC deadzone
> removal — the hardcoded one percent on channels one through eight is gone, so
> any worn gimbal now shows up as position drift after a routine update. v1.18 is
> in beta and will probably land this quarter."

**On payload integration:**
> "The question I'd ask first is whether the payload speaks MAVLink v2. If it
> does, it integrates directly. If it's proprietary, you're running a camera
> manager on a companion computer to translate. That decision drives whether you
> need a companion computer at all."

**On what you don't know yet:**
> "I haven't flown a compliant EO/IR payload — that tier is quote-only and I've
> been working from spec envelopes. What I'd want is an afternoon with whatever
> you're actually flying."

That last one matters. The credibility move in a new domain is precision about
the boundary of your knowledge, not pretending the boundary isn't there.

---

## 9. Verified vs. unverified

**Verified against primary sources (PX4's own documentation markdown in the
PX4-Autopilot repository, and vendor release feeds):**

- PX4 v1.17.0 stable, 2026-05-14; v1.18.0-beta2, 2026-08-09
- QGroundControl v5.1.4 stable, 2026-08-30
- ExpressLRS v4.1.0, 2026-07-17
- All PX4 v1.17 features, new hardware support, and all six breaking changes in §1.3
- PX4 payload model, the three camera integration tiers, and the camera-manager pattern (§4)

**Verified against reputable secondary sources (law-firm client alerts, trade
press) — not primary government text:**

- FCC Covered List action of 22 Dec 2025 and its scope
- Exemptions running to 1 Jan 2027
- Blue UAS transition from DIU to DCMA in late 2025
- The §848 critical-components list
- Gremsy USA / Teledyne FLIR Blue UAS payload launch (Aug–Sep 2026) and VIO F1 specs
- ARK ARKV6S and Auterion Skynode compliance claims

**Explicitly unverified — do not quote these as fact:**

- **Every price in this document.** Pixhawk 6C at $165.99 and an ELRS RX at ~$19
  came from search snippets, not vendor pages. All radio tier costs are
  order-of-magnitude estimates
- All FPV video latency and resolution figures (§2.3) — from trade blogs, not
  vendor datasheets
- The PX4-vs-ArduPilot characterisation in §1.4
- Whether Herelink, ELRS hardware, or any specific SKU is NDAA-compliant — SKU-level
  compliance must be checked per part, never assumed from a brand

**Could not be retrieved at all this session (network policy blocked the host):**

- `px4.io`, `docs.px4.io` — worked around via the docs markdown in the GitHub repo
- `diu.mil`, `dcma.mil` — the actual Blue UAS Cleared List
- `getfpv.com`, `holybro.com`, `arkelectron.com`, `auterion.com` — all pricing
- `mavlink.io` — camera protocol v2 message definitions
- `ardupilot.org`
- PX4's gimbal configuration documentation

**Not attempted:** FAA Part 107 / Remote ID currency, airframe and motor
selection, battery and power-system sizing, ROS 2 tutorial depth. Say the word
and any of these becomes the next brief.
