# Nimbus CRM: Enterprise SaaS Sales Representative Job Simulation

**A proposal for WorkLearn's Job Simulations module**
Prepared by: Rishi Raj · Status: Built, working, ready for review

---

## Executive Summary

We've built a complete, playable **job simulation for sales roles** — the same format as WorkLearn's existing Data Analyst and Frontend Developer simulations, but for Sales. A candidate runs one full enterprise deal from cold lead to closed-won: they qualify a lead, research the account, write and get AI-graded cold outreach, run  a live conversational discovery call against an AI prospect, work the deal inside a real, fully interactive CRM, handle real objections from that same AI prospect, write a proposal, and close.

At the end, they get a **scored report** (9 weighted categories, strengths/weaknesses, a hiring recommendation), a **replayable audit trail** of everything they did, and a **downloadable PDF certificate of completion**.

This is not a mockup or a slide deck — it is a working feature in the product today, built entirely on infrastructure we already have (auth, enrollment, XP, Skill GPS, the AI backend), so there was no new backend investment required to ship it. It runs on the same $/user economics as our existing AI Mentor feature — full cost breakdown below.

---

## The Problem This Solves

WorkLearn's Job Simulations prove hands-on ability for technical roles (data, engineering) that can be graded by a compiler or a script. **Sales has no equivalent.** You cannot grade a cold email or a discovery call with a unit test — it requires judgment, conversation, and realistic pushback. That's exactly what generative AI is good at, and exactly the gap this simulation fills: a sales candidate now has a portfolio-grade, verifiable demonstration of how they actually sell, not just a resume claim.

It also opens WorkLearn to a large new audience — sales, BDR, and customer-success candidates — using the same platform, the same gamification, and the same recruiter-facing signal we already offer.

---

## What the Candidate Experiences

One continuous deal, at a fictional company ("Nimbus CRM," selling to "Atlas Forge Manufacturing"), across 8 stages:

| # | Stage | What happens |
|---|-------|--------------|
| 1 | **Lead Qualification** | Reviews a real inbound lead file (firmographics, pain points, buying signals) and scores it with written reasoning. |
| 2 | **Research** | Explores account intel (competitors, decision-makers, budget/timeline signals) and records pain points, opportunities, and risks. |
| 3 | **Cold Outreach** | Writes a real email in a rich-text editor — subject, body, CTA — and gets it **graded live by AI** on grammar, professionalism, personalization, value proposition, and CTA strength. |
| 4 | **Discovery Call** | A live, real-time text conversation with an AI prospect that has a persona and a **mood that genuinely shifts** based on how well the candidate is doing — not a scripted tree. |
| 5 | **CRM — Work the Deal** | A full, working mini-CRM: Dashboard, Leads, Accounts, Contacts, Opportunities, drag-and-drop **Pipeline Kanban**, Activities, Tasks, Calendar, and Reports. The candidate creates real records tied to the deal. |
| 6 | **Objection Handling** | The AI prospect raises real objections (price, a competitor, security, budget) that the candidate has to address with substance — the AI notices the difference between a real answer and a deflection. |
| 7 | **Proposal** | Writes a structured business case: problem, solution, ROI, implementation plan, timeline, pricing. |
| 8 | **Close** | Takes the actual closing actions — schedules a demo, requests a signature, books a follow-up, creates the onboarding handoff task, and moves the opportunity to Closed Won/Lost in the CRM. |

At the end: an AI-scored report, a full replay of the attempt, and a certificate they can download and put on LinkedIn or in a portfolio.

---

## Why This Is Different From "Just Another AI Chatbot Demo"

- **The AI prospect has state and memory.** It reacts to what the candidate actually said earlier in the conversation, and its mood is a genuine model output each turn (`[[MOOD: ...]]`), not a hardcoded UI toggle.
- **The CRM is real, not decorative.** Drag-and-drop pipeline, real forms with validation, real tables with search/sort — the candidate has to actually use CRM software correctly, which is itself a sales-job skill we're implicitly testing.
- **Scoring blends AI judgment with hard rules.** CRM Accuracy and Closing are graded by checking the actual data the candidate created (did they set a stage, probability, and close date?) — not just trusting the model's read of a summary. That makes the score defensible to a skeptical hiring manager.
- **It's fully auditable.** Every action — every CRM edit, every chat message, every email revision — is logged and replayable, so a recruiter can see exactly how a candidate got their score, not just the final number.
- **It reuses the platform, it doesn't fork it.** XP, skill points, badges, the enrollment flow, the offer-letter onboarding — all the same systems the DA and Frontend simulations already use. This is additive, not a parallel system to maintain.

---

## Reusing What We Already Have

No new backend service was needed. This shipped on:
- The existing FastAPI backend and its enrollment/XP/skill-award system (three new AI endpoints added to the existing router pattern)
- The existing multi-provider LLM client — swapping AI providers is a one-line config change, not a code change (see cost section)
- The existing auth, offer-letter/onboarding, and Dashboard "your manager" widgets

This matters for the pitch: **the marginal cost of this feature is almost entirely the AI API cost**, not new infrastructure.

---

## AI Cost Analysis

### How many AI calls does one attempt actually use?

Per full attempt: **1 email-grading call, ~8 conversational turns** across the discovery call and objection-handling stages, and **1 final-scoring call** — roughly **10 API calls total**, using **~13,000 input tokens and ~3,000 output tokens** in total (estimated from our actual prompt sizes and the per-endpoint output caps in the code: 500 tokens for grading, 350 per conversational turn, 1,200 for the final score). This is an estimate based on typical usage, not a measured average across real users yet — provided here as a transparent, reproducible methodology rather than a black-box number.

### Provider comparison — cheapest to premium

Pricing pulled directly from each provider's official pricing page (current as of this document):

| Tier | Provider / Model | Input $ / 1M tok | Output $ / 1M tok | Est. cost / attempt | Est. cost / 1,000 attempts |
|------|-------------------|:---:|:---:|:---:|:---:|
| **Cheapest** | Google Gemini 2.5 Flash-Lite | $0.10 | $0.40 | **$0.0025** | **$2.50** |
| **Cheapest** | Groq — Llama 3.3 70B *(currently configured)* | $0.59 | $0.79 | **$0.0100** | **$10.00** |
| Low-cost | OpenAI gpt-5.4-nano | $0.20 | $1.25 | $0.0064 | $6.40 |
| Low-cost / mid | Anthropic Claude Haiku 4.5 | $1.00 | $5.00 | $0.0280 | $28.00 |
| Mid | OpenAI gpt-5.4-mini | $0.75 | $4.50 | $0.0233 | $23.30 |
| Premium | Anthropic Claude Sonnet 4.6 | $3.00 | $15.00 | $0.0840 | $84.00 |

**The headline number: even the most expensive option on this list costs about 8 cents per full candidate attempt.** At any realistic volume, AI cost is not a meaningful line item — the decision between providers is really about *speed, reliability, and answer quality*, not budget.

### What each tier is actually good for

- **Groq (currently configured)** — not the cheapest per token, but the fastest inference available today by a wide margin (purpose-built inference hardware, not GPUs). For the live, real-time discovery-call and objection-handling chat, response latency is part of the candidate experience — a prospect that "thinks" for 4+ seconds before every reply feels unnatural. Groq also has a genuinely usable free tier for early testing (14,400 requests/day). This is why it's what we shipped with.
- **Gemini 2.5 Flash-Lite** — the cheapest on a pure $/token basis and a very credible alternative if we want to shave the already-tiny cost further or diversify providers. **Action item:** our code currently points at `gemini-2.0-flash-lite`, which Google retired on June 1, 2026 — this was a live bug I found while researching this document and have already fixed to `gemini-2.5-flash-lite`.
- **Claude Haiku 4.5 / OpenAI gpt-5.4-mini** — a reasonable middle ground if we ever want a "known big-lab brand" answer for enterprise buyers who ask "which model do you use," without paying premium-tier prices.
- **Claude Sonnet 4.6** — overkill for the conversational turns, but worth considering *only* for the one-per-attempt final scoring call, where the strongest available reasoning produces the most defensible, nuanced coaching feedback. Since that's a single call per attempt, upgrading just that one call to Sonnet would add roughly **$0.06 per attempt** ($60 per 1,000 attempts) on top of whatever cheap model handles the rest — a worthwhile trade if we want to sell the scoring quality as a differentiator.

### Recommendation

Keep Groq as the default for cost + latency. If we want to optimize further, a **hybrid setup** — cheap/fast model (Groq or Gemini Flash-Lite) for the live conversational turns, Claude Sonnet reserved for the single end-of-attempt scoring call — gets the best of both at well under $0.05/attempt. This would require a small code change (the LLM client currently reads one global provider setting; routing by call-type is a natural next step, not a rearchitecture).

---

## What's Next

- **Per-call provider routing** (cheap model for chat, strong model for scoring) — see above.
- **Voice for the discovery call** — text-only today by design (scoped out to ship faster); browser Speech API is a low-effort next step.
- **More sales-adjacent simulations** using the same 8-stage engine and CRM module: Inside Sales Executive, Account Executive, BDR, Customer Success, Sales Ops — already stubbed as "Coming Soon" cards on the simulations page.
- **Recruiter-facing multi-candidate dashboard** — today's replay view covers one attempt at a time; a full admin view across many candidates is the natural next step once we have real usage data.

---

## Try It

The simulation is live today at `/simulations/sales-crm-sim`. A full sample walkthrough with copy-pasteable answers for every stage (for demoing without writing content live) is in `nimbus.txt` at the project root.
