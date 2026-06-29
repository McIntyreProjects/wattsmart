# WattSmart R&D Report
**Date:** 2026-06-29 | **Team:** R&D (Market Research · Competitive Intelligence · Product Innovation · Monetisation)

---

## 1. Market Research

### UK Green Tech Installation Market — State of Play (2026)

**Solar PV**
- UK passed **2 million residential solar installations** in March 2026 — strongest monthly growth since 2012 (27,607 installs in March alone)
- Battery storage is now the default add-on: **130% growth in home battery installs in 2025**
- Battery prices fell 20–30% in the past year — accelerating demand
- Typical system: 8–12 panels + 10 kWh battery. Full system: £8,000–£15,000; battery alone: £3,000–£10,000
- 80% of customers expect their system to generate what was promised — but 40% received no performance info from their installer (GreenFox 2025 survey)

**Air Source Heat Pumps (ASHP)**
- BUS (Boiler Upgrade Scheme): **£7,500 grant per household** for ASHP/GSHP
- BUS budget 2025/26: **£295 million** (nearly double prior year); funded to Dec 2027
- ECO4 runs until December 2026 — for fuel-poor households
- Installer-led scheme: MCS installer applies for voucher on customer's behalf — creates strong dependency on finding a trusted installer
- Average ASHP job value: ~£13,431 pre-grant (BUS gov data, Q4 2025)
- **Complaints up 24x in 3 years** — dominant causes: oversized units short-cycling and undersized units failing in cold weather, both from skipped heat loss calculations

**EV Chargers**
- 0% VAT on all home EV charger installations until March 2027
- Typical install: £800–£1,200 for a 7kW home charger
- EVHS grant: £350 for flats/rented properties

**Battery Storage (standalone)**
- Fastest-growing category in 2026
- Often bundled with solar retrofits; increasingly standalone for grid arbitrage (Octopus Agile, etc.)

### Key Government Schemes

| Scheme | Technology | Value | Status |
|--------|-----------|-------|--------|
| BUS | ASHP, GSHP, Biomass | £7,500 | Active to Dec 2027 |
| ECO4 | Insulation, heating (low income) | Variable | Active to Dec 2026 |
| Warm Homes Local Grant | Insulation + heat pumps | Up to £15,000 | Active |
| EVHS | EV chargers (rented/flats) | £350 | Active |
| SEG | Solar export tariff | Variable | Ongoing obligation |
| 0% VAT | All renewables + EV chargers | Tax saving | Until March 2027 |

**MCS certification** remains the gatekeeper for BUS, SEG eligibility, and consumer trust. WattSmart requiring MCS is correct and essential.

### Customer Pain Points
1. **Don't know who to trust** — no way to distinguish good from bad installers online
2. **Quote fatigue** — sharing contact details with multiple companies → sales calls
3. **Price opacity** — quotes vary wildly with no explanation
4. **Grant confusion** — eligibility rules changed in April 2026; customers frequently discover mid-quote they don't qualify
5. **Long pushy sales cycles** — in-home surveys before a price is even discussed
6. **Installer insolvency risk** — UK Solar Experts entered administration Feb 2026, leaving hundreds without warranty support

### Installer Pain Points
1. **Bad leads** — same lead sold to 3–5 installers simultaneously; most don't convert
2. **Tyre-kickers** — time wasted quoting for unserious customers
3. **High cost per lead** — GreenMatch, TheEcoExperts charge regardless of outcome
4. **Unsolicited contact complaints** — cold-calling leads can trigger ICO/TPS complaints
5. **Cash flow** — no deposit protection; customers pull out after work starts
6. **MCS documentation burden** — heat loss calcs, MIS 3005 compliance often skipped on lead-gen quotes

---

## 2. Competitive Intelligence

### Competitor Map

| Platform | Model | Installer Cost | Key Weakness |
|----------|-------|---------------|--------------|
| **Checkatrade** | Monthly subscription directory | £50–£180/month | No anonymity; saturated; quality varies widely |
| **MyBuilder** | Post-a-job, pay-per-lead | £10–£50/lead | Same lead to multiple installers; race to bottom |
| **Rated People** | Same as MyBuilder | ~£30/month + per-lead | Same structural problems |
| **GreenMatch** | Renewables-specific lead gen | Per-lead (undisclosed; ~£15–£40) | Leads shared with up to 4 installers simultaneously |
| **TheEcoExperts** | Content/media site + affiliate lead gen | Affiliate model | Not a true marketplace; essentially sells leads to partners |
| **Octopus Energy** | Vertical integration — own engineers + "Works with Octopus" vetted network | N/A | Only in Octopus service areas; high fixed prices; no choice |
| **HeatGeek** | Training platform + directory; Octopus partnership | N/A | Not a quoting platform; no price comparison |
| **Sunsave** | Solar-specific marketplace + finance | Per-job referral | Solar only; no ASHP/EV/battery |

### Where WattSmart Has a Genuine Gap

1. **True double-blind model** — no other platform protects both parties' identities until commitment. This is unique.
2. **3 exclusive quotes, not 5 shared** — dramatically reduces installer fatigue and customer choice paralysis
3. **Multi-technology in one enquiry** — solar + battery + ASHP + EV; competitors are siloed
4. **Deposit protection** — trusted intermediary for the deposit; no competitor offers this
5. **MCS-only installer quality gate** — vs. open directories that take anyone
6. **Installer pays on win only** — no risk on lost quotes vs. pay-per-lead competitors

---

## 3. Product Innovation — 10 Prioritised Ideas

### Tier 1: Do Now (High impact, Low–Medium effort)

**1. Grant eligibility checker**
90-second pre-quote questionnaire → personalised "funding stack" showing which grants apply (BUS, ECO4, Warm Homes, EVHS), whether combinable, and true out-of-pocket cost. Rules changed April 2026 — customers routinely discover mid-quote they don't qualify.
- **Impact: High | Effort: Low | Dev work only**
- No competitor does this. Converts hesitant browsers and stops installers wasting time on ineligible jobs.

**2. Installer financial health score**
Derived from Companies House data (filed accounts, company age, director history, CCJs). Displayed as 1–5 rating with plain-English note ("Trading 7 years, accounts filed on time, no charges on record"). No other marketplace offers this. Directly addresses the UK Solar Experts insolvency issue.
- **Impact: High | Effort: Low | Companies House API is free**

**3. AI savings estimator with live tariff data**
Postcode + energy spend + roof orientation → 10-year savings projection with current Ofgem tariff data and SEG export rates. Independent estimate before any installer sees the job. Removes reliance on installer marketing claims.
- **Impact: High | Effort: Medium | Dev work**

**10. "Plain English" quote explainer**
AI-generated breakdown translating technical specs into simple comparisons ("This quote includes a 10-year workmanship warranty — the other two offer 5 years"). Displayed alongside each anonymous quote. Reduces the information asymmetry that makes high-pressure sales effective.
- **Impact: Medium | Effort: Low | Content + small dev layer**

### Tier 2: Plan for Q3/Q4 (Require partnerships or compliance work)

**4. WattSmart aftercare network**
Vetted third-party maintenance providers (panel cleans, heat pump servicing, inverter checks) bookable from customer account post-install. 90% of solar owners would pay for post-install support (GreenFox 2025). Creates recurring revenue and extends customer lifetime.
- **Impact: High | Effort: Medium | Partnership**

**5. Green finance at checkout**
Native financing embedded at quote acceptance (integrate with Kandoo, Kanda, or Nationwide 0% green loan). ~50% of customers would buy if money weren't an issue (Sunsave survey). GreenMatch and comparable platforms do not offer this.
- **Impact: High | Effort: Medium | Partnership + FCA AR status**

**6. Heat loss / ASHP sizing audit badge**
Require installers to upload an MCS-compliant heat loss calculation (MIS 3005) before their ASHP quote is visible. Quotes with verified calcs get a "Properly Sized" badge. Directly addresses the fastest-growing complaint category (oversizing/undersizing).
- **Impact: High | Effort: Medium | Dev + MCS/HIES credibility partnership**

### Tier 3: Evaluate once live

**7. Satellite roof assessment** — SOLR AI / Google Solar API integration to auto-assess roof suitability before quotes. Creates comparable baseline for all 3 quotes.

**8. Street referral loop ("Street Turn")** — Post-job referral card with anonymised local data ("12 homes on your street have gone solar"). £50 bill credit for neighbour, credit for referrer. Strong peer social proof driver.

**9. Installer embedded portal (white-label B2B)** — WattSmart infrastructure white-labelled for small installers to use on their own websites. SaaS fee + reduced per-job referral. Supply-side lock-in.

---

## 4. Monetisation

### Core Model: Referral Fee (5–8% of confirmed job value)

| Product | Job value (mid) | 5% fee | 8% fee |
|---------|----------------|--------|--------|
| Solar PV | £7,750 | £388 | £620 |
| ASHP | £13,000 | £650 | £1,040 |
| Battery | £5,500 | £275 | £440 |
| EV charger | £1,200 | £60 (use flat £100 instead) | — |

**Why this is defensible:** Installers self-value a confirmed customer at £500–£1,000 (installer referral schemes pay this as flat fees). WattSmart's 5–8% on a confirmed exclusive win is below this ceiling on solar, comparable on ASHP. The risk-free (pay-on-win) model means installers should accept a higher % than for shared leads.

**Charge on customer payment element only for ASHP** — do not charge on the BUS grant portion (£7,500). Frames the fee more palatably.

### Additional Revenue Streams — Ranked

| Stream | Feasibility | Revenue Potential | Time | Priority |
|--------|-------------|-------------------|------|----------|
| **Referral fee (5–8%)** | High | High | Now | **Core** |
| **Green finance referral** (FCA AR, Kandoo/Kanda) | High | Medium | 6–18 months | **High** — pursue FCA AR status now; ~£100–200 per financed job at 40–60% uptake |
| **Installer subscription** (£49/month premium tier: analytics, profile, badges) | Medium | Medium | 6–18 months | **Medium** — add at 500+ active installers; don't gate marketplace access |
| **Manufacturer category sponsorship** (educational content only) | Medium | Medium | 18+ months | Low — year 2+ |
| **White-label platform** (energy supplier B2B) | Medium | High | 18+ months | Strategic — approach Octopus/E.ON Next at 12–18 months with proven GMV |
| **Data/analytics** (anonymised demand maps for local authorities, manufacturers) | Low | High at scale | 18+ months | Architect now, monetise year 3+ |
| **Warranty/insurance referral** (FCA insurance distribution registration) | Medium | Low | 6–18 months | Low — small per-unit revenue |
| **Post-install monitoring subscription** | Low | Low | 18+ months | Deprioritise — OEM apps are free and good |

### Comparable Benchmarks
- Checkatrade: implied 1–3% take rate via subscription + lead fees
- Commercial solar introductions: 5% of contract value (published norm)
- Angi/HomeAdvisor (US): 15%+ take rate on managed jobs
- Installer self-referral schemes: £250–£1,000 flat per successful referral

### Recommended Revenue Architecture

**Year 1:** 5–8% referral fee only. EV charger flat £100. No subscription — prioritise installer network density.

**Year 1–2:** Add FCA AR-backed green finance referral (Kandoo or Kanda). Optional installer subscription £49/month for analytics + enhanced profile (not required for marketplace access).

**Year 2–3:** Manufacturer category sponsorship (content layer only, never influences quotes). White-label conversations with mid-tier energy suppliers. Package anonymised market data for local authority/DESNZ pilots.

---

## Cross-Team Flags → Dev Team Backlog

- **P1: Grant eligibility checker** — new pre-quote page; top-of-funnel acquisition driver
- **P1: Installer financial health score** — Companies House API integration on registration
- **P1: MCS auto-verification** — check MCS register on application and cert renewal dates
- **P2: Finance integration** — FCA AR status first, then Kandoo/Kanda embed at checkout
- **P2: ASHP heat loss calculation enforcement** — require before ASHP quote is visible to customer
- **P2: Installer performance dashboard** — win rate, response time, quote value analytics
- **P2: Post-job review system** — triggered on job completion confirmation

---

*Sources: Ofgem BUS statistics, UKEM Group battery install data, GreenFox Energy Sentiment Survey 2025, E.ON homebuyer survey, Sunsave solar loan data, Installer Online heat pump complaint data, Checkatrade/MyBuilder/GreenMatch public documentation, Companies House API docs, Kandoo/Kanda finance platforms, Octopus Energy press, Solar UK Experts Trustpilot data.*
