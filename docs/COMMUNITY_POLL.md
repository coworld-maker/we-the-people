# Community Feature Poll

This document contains the questionnaire content + setup instructions
for a community-facing survey gauging which features people want next.

The poll runs **outside the app** (so non-users can take it too) — pick
a platform below, copy the questions in, then set `NEXT_PUBLIC_FEEDBACK_URL`
in Vercel to the resulting URL and the "Share feedback" link in the app
will route there.

---

## Platform recommendations

| Platform | Best for | Cost | Setup time |
|---|---|---|---|
| **Tally** (tally.so) | One-time survey, no account required to take it. Clean UX. | Free up to 200 responses/mo | 15 min |
| **Canny** (canny.io) | Ongoing roadmap with user-upvoted feature requests. Becomes a permanent feedback board. | Free starter (50 users) → $79/mo | 30 min |
| **Featurebase** (featurebase.app) | Same model as Canny, often cheaper. | Free starter → $49/mo | 30 min |
| **Typeform** (typeform.com) | Most polished form UX. | Free up to 10 questions / 100 mo | 20 min |
| **Google Forms** | Free, simple, ugly. Fine for a first pass. | Free | 10 min |

**Recommendation**: Start with **Tally** for the one-time survey. If
engagement is strong and you want ongoing prioritization, migrate to
**Canny** or **Featurebase** for the permanent roadmap board.

---

## Questionnaire

Below is the full content to paste in. Sections marked `(optional)` can
be skipped or made optional in the platform settings.

### Intro page

> # Help shape Democracy Unlocked
>
> We're a small team building tools to make Congress more transparent
> and citizens more empowered. We want to know what to build next.
>
> This takes about **3 minutes**. Most questions are optional.

---

### Section 1 — About you (optional)

Use these to segment responses later. Mark all as optional.

**Q1.** What best describes you?

- [ ] Citizen following politics casually
- [ ] Citizen actively engaged in advocacy
- [ ] Journalist / researcher
- [ ] Student
- [ ] Educator
- [ ] Policy / nonprofit professional
- [ ] Elected official or staff
- [ ] Other (free text)

**Q2.** Which state? *(dropdown of 50 + DC + territories)*

**Q3.** How did you find us? *(optional, single-select)*

- Search engine
- Social media
- Word of mouth
- News article
- Other (free text)

---

### Section 2 — Current usage

**Q4.** Which parts of the site do you use most? *(multi-select)*

- [ ] Browsing bills
- [ ] Voting on bills
- [ ] Looking up my representatives
- [ ] Reading AI bill summaries
- [ ] Discussions / comments
- [ ] State-level activity pages
- [ ] Representative scorecards
- [ ] Action center
- [ ] Civic learning materials
- [ ] News
- [ ] None of these — I'm new

**Q5.** What's the **one thing** about the site that's most useful to you today? *(free text, optional)*

**Q6.** What's the **most frustrating** thing about the site today? *(free text, optional)*

---

### Section 3 — Feature wishlist *(the main event)*

For each feature below, choose how important it is to you:

> Scale:  **Must have** · **Nice to have** · **Don't care** · **Don't want**

#### Notifications & alerts

**Q7.** Email or SMS alerts when a bill I'm tracking moves
**Q8.** Email digest summarizing what my reps voted on this week
**Q9.** "Town hall near me" notifications
**Q10.** Alerts when a new bill matches a topic I care about

#### Engagement

**Q11.** Contact-my-rep templates I can send with one click
**Q12.** Group-discussion threads moderated by topic
**Q13.** "Petition / open letter" feature where users can co-sign positions
**Q14.** Verified citizen badges for users who confirm their identity / address

#### Personalization & local context

**Q15.** Personalized bill feed based on my interests + voting history
**Q16.** "How does this bill affect my city / county?"  (zip-code-level impact)
**Q17.** Compare my rep's votes against a state or national average

#### Visualization

**Q18.** Searchable national map by topic (e.g. "show me states leading on housing")
**Q19.** District-level maps with the rep's voting record
**Q20.** Interactive timeline showing a bill's path through Congress

#### Mobile & accessibility

**Q21.** Native mobile app (iOS / Android)
**Q22.** Read-aloud / audio summaries of bills
**Q23.** Spanish-language UI
**Q24.** Plain-English glossary for legislative terms (filibuster, cloture, reconciliation…)

#### Power-user / pro

**Q25.** API access to bill / vote data
**Q26.** Embeddable widgets I can put on my own site
**Q27.** Bulk export of my voting history
**Q28.** Slack / Discord bot that posts bill updates to my server

#### State legislation

**Q29.** Track state legislatures (not just federal Congress)
**Q30.** Compare my state-level reps to federal ones
**Q31.** State ballot measures + voter-guide content

---

### Section 4 — Funding & sustainability

**Q32.** If Democracy Unlocked offered a paid tier ($5–10/mo) with
premium features (advanced alerts, exports, ad-free, priority support),
would you consider it?

- Yes, I'd subscribe
- Maybe — depends on features
- I'd contribute monthly as a donation instead
- No — keep it free
- I prefer one-time donation
- Not sure

**Q33.** Would you support this work if we set up a donation
(GitHub Sponsors / Ko-fi / Patreon)?

- Yes — definitely
- Maybe — small amount
- Not at this time

**Q34.** Anything off-limits for monetization? *(multi-select, optional)*

- [ ] Display ads
- [ ] Sponsored bill summaries
- [ ] Selling aggregated data
- [ ] Partnerships with advocacy groups
- [ ] None of these worry me

---

### Section 5 — Trust & accuracy

**Q35.** How confident are you in the AI-generated bill summaries / pros & cons? *(1–5)*

**Q36.** What would make you trust them more? *(free text, optional)*

**Q37.** Have you ever spotted a factual error in the site? *(yes/no + free text if yes)*

---

### Section 6 — Open

**Q38.** What's the one feature you'd build first, if you ran this project? *(free text)*

**Q39.** Anything else you want us to know? *(free text)*

**Q40.** *(optional)* Email if you want to be contacted about beta features

---

## After the poll closes

Suggested analysis (rough framework):

1. **Sort features by "must have" %** — that's your raw demand signal.
2. **Cross-tab against persona** (Q1) — features that journalists care about will look different than features citizens care about.
3. **Weight by Q32 / Q33** — features paying users want differ from features free users want.
4. **Look at the open-text Q38** — themes here often reveal blind spots the multiple-choice questions miss.
5. **Publish results back to the community** — closes the loop, builds trust. "Here's what 487 of you said, here's what we're building."

---

## Wiring the link into the app

Once you've set up the poll, set the env var in Vercel:

```
NEXT_PUBLIC_FEEDBACK_URL=https://tally.so/r/abc123
```

The "Share feedback" link in the app footer will pick it up on next deploy.
If the env var is unset, the link is hidden (so we don't ship a broken button).
