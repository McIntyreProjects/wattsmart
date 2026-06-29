# WattSmart Installer Engagement & Retention Strategy

_Produced by Installer Growth & Engagement Team · June 2026_

---

## 1. Retention & Engagement Framework

### The Core Problem

Installers churn from platforms when they stop seeing value. On WattSmart, value = quality briefs that convert to won jobs. The entire retention strategy flows from that truth: if lead quality and win rate are good, installers stay. If either deteriorates, no amount of nudging will save the account.

The strategy below assumes lead quality is the foundation. All other tactics operate on top of it.

### Engagement Funnel

There are four stages of installer engagement:

1. **Registered (pending)** — Has applied, not yet approved. Risk: they forget about WattSmart before they even start.
2. **Approved (inactive)** — Has access to the portal but has not quoted on a brief yet. Risk: cold feet, competitor signed them up first.
3. **Active quoter** — Regularly submits quotes. Core segment. Risk: win rate drops and they quietly disengage.
4. **Champion** — High win rate, positive reviews, possibly referrers. Goal: identify and cultivate.

Each stage needs different interventions.

---

## 2. Nudges & Notifications by Stage

### Stage 1 — Pending (post-registration, pre-approval)

**Goal:** Keep them warm while the cert check happens. Use this time to help them get the portal ready so that day 1 of approval is productive, not another waiting game.

| Trigger | Message | Channel |
|---|---|---|
| Immediately on submit | "Application received. We'll verify your certs and email you — usually within 1 working day." | Email |
| 4 hours after submit | "While you wait: upload your logo and prepare your T&Cs so your profile is ready to go live." | Email |
| 24 hours (if not yet approved) | "Our team is checking your certifications. Nothing needed from you — we'll email the moment you're live." | Email |
| Approval event | "You're live. [X] job briefs are waiting in your area. Log in now →" | Email + SMS |

Do not send more than 2 emails during the pending window. Respect that this is a b2b professional context.

### Stage 2 — Approved but Not Yet Quoted

**Goal:** Get to first quote within 48 hours of approval. First quote is the most important engagement milestone.

| Trigger | Message | Channel |
|---|---|---|
| Approval | "You have [N] briefs in your area — here's a preview of the most recent one." | Email (include anonymised brief excerpt) |
| 24h post-approval, no quote submitted | "Your first brief is still waiting. Here's what quoting looks like: [2-line explainer + link]." | Email |
| 72h post-approval, no quote submitted | "Quick check-in — is everything set up OK? If you're having trouble submitting a quote, reply here and we'll help." | Email (personal tone, from a named person) |
| 7 days post-approval, still no quote | Reach out by phone or WhatsApp. Move to personal outreach. | Phone / WhatsApp |

The 72h email should feel like it's from a human, not automated. A plain-text email with a real name attached converts better at this stage.

### Stage 3 — Active Quoter

**Goal:** Maintain quoting cadence, prevent disengagement on low-win-rate spells, and surface enough data that the installer feels in control.

**Brief notification (trigger: new brief matched to installer)**

- Email: "[Ref] New brief — 3-bed semi, NE3, solar + battery. Deadline: [date]. View brief →"
- Push notification (if mobile app exists in future): same.
- SMS (optional, high open rate for time-sensitive): "WattSmart: new brief in NE3. Solar + battery. Deadline Thu. Log in: [link]"

**Weekly summary (every Monday if no new brief in the last 7 days)**

- "This week in your area: [N] briefs matched, [N] quotes live, [N] awards. Your quote pipeline: [X] pending decisions."

**Win notification (trigger: installer selected)**

- "You've been chosen for job [Ref]. Log in to see customer details and confirm your availability. →"
- This should feel like a celebration, not a transaction.

**Not chosen notification (trigger: another installer selected)**

- "Job [Ref] was awarded to another installer. You were one of [N] quotes reviewed. [Link to performance page]"
- Keep this neutral and redirect to data. Never say "you lost" — say "the customer chose another quote."

**Deadline reminder (trigger: 24 hours before quote deadline)**

- "You haven't quoted on [Ref] yet — deadline is tomorrow at 5pm. [Submit quote →]"
- Only send if they haven't submitted. Do not nag if they have.

### Stage 4 — Champions

**Goal:** Surface them as proof points, reward loyalty, generate referrals.

- Proactively ask for a Trustpilot or Google review once a job reaches "complete" status.
- Offer a "WattSmart Verified" badge (PDF/SVG) they can use on their website and vans.
- Invite them to give feedback on a new feature or brief format — makes them feel ownership.
- Referral mechanic: "Refer another installer and we'll waive your fee on the next job." Track via a referral code on the registration URL.

---

## 3. Dashboard & Data Features Installers Would Value Most

These are listed in priority order based on the persona research above.

### Must-Have (V1)

**Brief-to-quote pipeline view**
A simple list of all briefs they've received, their quote status (submitted, not submitted, expired), and the outcome (pending decision, selected, not selected). This is the minimum. Without it, installers don't know what's live.

Currently the dashboard has this but only shows `brief_sent` and basic status labels. It should also show the quote amount they submitted (for their own reference) and the outcome when known.

**Win rate at a glance**
A single number: "You've been selected on X of your last Y quotes" prominently on the dashboard. Installers are competitive and respond well to this framing. The performance page has detailed metrics but it's behind a nav link and restricted to managers — the win rate headline should be on the dashboard for everyone.

**Revenue earned (this month / this year / lifetime)**
Already partially on the performance page. Should be on the dashboard for all users (not just managers). Every installer wants to see "WattSmart has earned me £X this year."

**Brief deadline urgency**
The current dashboard shows a deadline date. It should also show time remaining ("2 days left", "Expires today") with colour coding — red when under 24 hours.

### High-Value Additions (V2)

**Quote comparison (post-decision)**
After a job is awarded, show the winning price range anonymously. "Your quote: £8,400. Winning quote: £7,900–£8,200." This tells them whether they're priced right without revealing who won. This is the single feature most likely to improve win rates and reduce churn — installers will feel the data is fair and useful.

**Response rate metric**
"You respond to 82% of briefs within 24 hours" — visible only to them, not to customers. This incentivises engagement and can be used as a ranking signal in brief allocation.

**Certification expiry dashboard**
Show all certs on file with expiry dates and a warning 60 and 30 days before expiry. An expired MCS means the account locks — giving advance warning prevents this being a surprise. This would be particularly valued by Persona B (multi-tech companies) who track multiple cert lines.

**Coverage heat map**
A simple postcode-district-level map showing where their briefs have come from vs. their coverage area. Helps them decide whether to expand coverage or whether a particular district isn't generating enquiries.

**Customer contact book (post-reveal)**
Once a job is won and the customer is revealed, the installer needs their contact details and the agreed job scope in one place. Currently this is a `revealed` status on the job — it should be a proper customer card with name, address, phone, and a clear thread of all communications.

### Future / Differentiator Features

**Benchmarking (opt-in, anonymised)**
"Installers in the NE with your profile win at 34% on solar briefs. Your current rate: 28%." Opt-in only. This helps underperforming installers self-identify and create a reason to call them.

**Quote template builder**
A tool inside the portal to build and save quote templates so that quoting a new brief takes 5 minutes, not 30. This reduces friction and improves quote submission rate.

**BUS grant tracking (for ASHP installers)**
A simple tracker showing which jobs have an active BUS grant application, at what stage, and when payment is expected. This would be a market-differentiating feature for ASHP-focused installers (Persona C).

---

## 4. Churn Risks and Prevention

### Churn Risk 1 — Low brief frequency in their coverage area

**Signal:** An installer receives fewer than 1 brief per month for 2 consecutive months.

**Prevention:**
- Email: "You've received [N] briefs this month. Expanding your coverage area could increase this — here's what's available in the adjacent district [YO]."
- Offer to temporarily expand their coverage radius at no config cost.
- In extreme cases (genuinely low demand area): be honest. Don't over-promise.

### Churn Risk 2 — Low win rate / consistent losses

**Signal:** Win rate below 15% over 10 or more quotes.

**Prevention:**
- Don't ignore this in silence. Reach out personally: "We've noticed you've quoted on 12 briefs without a win. Can we take a quick look at your quote approach with you?"
- Share the anonymous post-decision price comparison (see above) — this is often enough to help an installer recalibrate pricing.
- Check if their cert verification is complete — a half-visible profile won't appear as credible to reviewers.

### Churn Risk 3 — Slow cert verification

**Signal:** An installer has been in `pending` status for more than 2 working days.

**Prevention:**
- Internal alert to the ops team: flag accounts over 48 hours in pending.
- Email to installer: "We're still working through your cert check — we'll update you by [specific date]."
- If certs can't be verified (bad number, lapsed), contact them to explain exactly what's needed. Don't just send a rejection.

### Churn Risk 4 — Payment friction

**Signal:** An installer raises a query about payment or fees, or a fee invoice goes past 30 days unpaid.

**Prevention:**
- Make the fee calculation transparent before they quote, not after they win. Show an estimated fee in the brief view: "If you win this at £8,000, the WattSmart fee would be £400 (5% of £4,000 deposit + 5% of £4,000 balance)."
- A clear fee schedule page (already exists at `/installer/fees`) should be linked from the quote submission flow, not just from the nav.

### Churn Risk 5 — Poor customer experience reflected back on installer

**Signal:** A customer leaves a negative note about the installer in the platform.

**Prevention:**
- Do not immediately suspend an account on a single complaint. Investigate. Reach out to the installer with specifics.
- Build a clear appeals process. Installers will churn immediately if they feel suspended without recourse.
- Use reviews constructively: "A customer mentioned the survey took longer than expected — is there anything we can adjust in how survey bookings are communicated?"

### Churn Risk 6 — Platform feels impersonal / no human contact

**Signal:** Installer has never had a human interaction with WattSmart staff. All their experience is automated emails.

**Prevention:**
- A "Welcome" call or WhatsApp message from a named WattSmart team member within 7 days of first brief.
- A named account contact for accounts that generate >£5,000 in fees/year.
- A public phone number or live chat during business hours. The current site likely has only a contact form — this creates distance with trade professionals who are used to calling.

---

## 5. Engagement Calendar (First 90 Days)

| Day | Action |
|---|---|
| 0 | Application submitted → confirmation email |
| 0–1 | Cert verification completed → approval email + "you have [N] briefs" |
| 1 | Profile completion prompt: logo, T&Cs, bank details |
| 1–2 | First quote submitted (target activation milestone) |
| 7 | If no quote submitted: personal outreach by phone/WhatsApp |
| 14 | First win OR "here's how your quotes are performing" update |
| 30 | Monthly performance email: briefs received, quotes submitted, win rate, revenue |
| 60 | Benchmarking prompt (if win rate below median): "Want to see how your pricing compares?" |
| 90 | "Champion" identification: if 3+ wins, invite to provide testimonial and receive WattSmart Verified badge |
