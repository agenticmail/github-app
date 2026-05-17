# GitHub Marketplace Listing — AgenticMail for GitHub

This file is the ready-to-paste copy for the GitHub Marketplace listing form.
Each section below maps to a field in **Marketplace → New listing**.

---

## App name

```
AgenticMail for GitHub
```

## Tagline

> Field: "A short description" — max 80 characters. GitHub shows it under the
> app name in search results and on the listing header.

```
Mention @agenticmail in any issue or PR — an AI agent reads it and replies.
```

(75 characters — within GitHub's 80-char limit.)

**Backup tagline** (if a shorter line is wanted):

```
Your AI teammate, one @agenticmail mention away.
```

## Categories

- Primary: **Project management**
- Secondary: **Chat** (or **Code review** — pick whichever the form allows)

## Supported languages

Language-agnostic — works on any repository.

---

## Logo

> Field: app logo. GitHub requires a square image, **min 200×200px**, PNG, on a
> non-transparent background. Marketplace also uses a **background color**.

- **File:** `docs/marketplace/logo.png` — 512×512 PNG.
- **Mark:** the AgenticMail envelope glyph with a small `@` cut into the flap,
  rendered in white.
- **Background color:** `#1F6FEB` (GitHub-blue family — reads well against both
  GitHub light and dark themes).
- **Feature card / hero image:** `docs/marketplace/feature.png` — 1280×640 PNG,
  same envelope mark beside the wordmark "AgenticMail for GitHub" and the
  tagline, on the `#1F6FEB` background.

<!-- PLACEHOLDER — logo and feature artwork to be produced by design.
     Specs above are final; drop the files at the listed paths. -->

---

## Introductory description

> Field: "Introductory description" — the paragraph at the top of the listing.

```
AgenticMail for GitHub turns a comment into a conversation with an AI agent.
Mention @agenticmail in any issue or pull request and the app pulls in the
thread, runs an AgenticMail agent against it, and posts the result back as a
comment — typically within seconds. New issues get triaged and new PRs get
summarized automatically, so your backlog gets a first pass before anyone
opens it. It installs in two clicks, needs no new infrastructure, and is
completely free.
```

---

## Detailed description / Features

> Field: "Detailed description" — supports Markdown. Lead with the three
> features below.

### ⚡ Mention-driven, in-thread

No new tab, no dashboard. Type `@agenticmail summarize`, `triage`, `reply`,
`email`, `handoff`, or `link` in any issue or PR comment and the agent acts on
that exact thread. It drops a 👀 reaction within a second so you know it's on
it, then posts a clean Markdown reply.

### 🤖 Automatic triage & PR summaries

Every new issue is triaged the moment it's opened — suggested labels, a
priority, and similar issues, posted as a comment (advisory only, nothing is
auto-applied). Every new pull request gets a summary of its description and
diff. Your team starts each thread already oriented.

### 🔒 Secure by design, zero ops overhead

Webhooks are HMAC-verified with timing-safe comparison and de-duplicated on
delivery ID. Installation tokens are short-lived and minted from a vault-held
key. The app mounts onto your existing AgenticMail deployment — no extra
service to run, monitor, or pay for.

---

## Pricing

> Field: "Set a price". v1 ships a single **free** plan.

- **Plan name:** Free
- **Price:** $0 / free for everyone
- **Plan description:**

```
Free for all repositories — personal and organization accounts. All six
mention commands, automatic issue triage, and automatic PR summaries are
included. No seat limits, no usage caps.
```

> Note for the listing operator: choosing a free plan means GitHub does **not**
> require Marketplace payment/billing setup, which keeps the publish flow short.
> Paid tiers are explicitly out of scope for v1 (see `design.md` §9).

---

## Webhook events used

(Shown to installers on the permissions screen — informational, copy into the
"How it works" part of the detailed description if useful.)

- `issue_comment` — the primary trigger for mentions
- `pull_request_review_comment` — code-anchored mentions
- `issues` — automatic triage on open
- `pull_request` — automatic summary on open
- `installation` — onboarding and cleanup

## Permissions

- **Issues:** Read & write
- **Pull requests:** Read & write
- **Metadata:** Read-only

## Support & links

- **Homepage / setup URL:** `https://agenticmail.io/github`
- **Post-install landing:** `https://agenticmail.io/github/installed`
- **Support email:** `support@agenticmail.io`
- **Privacy policy:** `https://agenticmail.io/privacy`
- **Source:** `https://github.com/agenticmail/github-app`

---

## Pre-publish checklist

- [ ] Logo (`docs/marketplace/logo.png`) and feature image
      (`docs/marketplace/feature.png`) uploaded.
- [ ] Tagline pasted (≤80 chars — verified above).
- [ ] Free plan created; billing setup skipped (free plan → not required).
- [ ] README screenshots produced and committed (`docs/screenshots/`).
- [ ] Webhook URL + callback URL point at the production enterprise host.
- [ ] Listing submitted for GitHub review (Developer Program entry).
