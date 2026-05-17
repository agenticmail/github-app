# Launch drafts — AgenticMail for GitHub

These are ready-to-fire posts for the moment GitHub approves the Marketplace
listing. Each one stands alone — pick whichever channels you want.

---

## Tweet / X (single post, 280-char budget)

> 🎀 New: tag **@agenticmail** in any GitHub issue or PR and an AI agent reads the
> thread and replies inline.
>
> Auto-triages new issues. Auto-summarizes new PRs. Free on the GitHub
> Marketplace.
>
> 👉 github.com/marketplace/agenticmail

Pinned tweet variant with screenshot — attach `product-screenshot.png`.

---

## Tweet thread (4 posts)

**1/4**

> 🎀 Just shipped **AgenticMail for GitHub** — a Marketplace app that turns
> `@agenticmail` into an AI teammate that lives in your issues and PRs.
>
> 👉 github.com/marketplace/agenticmail

**2/4**

> What it does:
>
> • Tag `@agenticmail` to summarize a thread, triage an issue, or draft a reply.
> • Auto-summary on every new PR.
> • Auto-triage on every new issue.
>
> Reply lands in ~8 seconds.

**3/4**

> What I cared about while building it:
>
> • HMAC-verified webhooks, delivery-UUID dedup, ack in <100ms.
> • Per-installation rate limit (60/hr) so a runaway loop can't drain quota.
> • Short-lived installation tokens, never persisted.
> • Bot self-mentions are ignored — no comment loops.

**4/4**

> The same agent stack powers AgenticMail's broader platform — email,
> phone, browser, memory, 145 SaaS integrations.
>
> The GitHub App is the simplest entry point. Free forever.
>
> github.com/marketplace/agenticmail

---

## Show HN

**Title (80-char budget):**

> Show HN: AgenticMail for GitHub – tag @agenticmail in any issue and an AI replies

**Body:**

> Hi HN — I shipped a GitHub Marketplace app today and wanted to share what's
> under the hood.
>
> The pitch: install the app, then `@agenticmail` in any issue or PR comment
> gets you an inline AI reply within a few seconds. New issues are
> auto-triaged (suggested labels, priority, possible duplicates). New PRs
> are auto-summarized. There's no separate dashboard, no separate inbox —
> the entire UX is inside GitHub.
>
> The architecture is deliberately small:
>
> * A single Netlify Function receives every webhook delivery.
> * HMAC-SHA256 verify against the raw body, constant-time compare.
> * Dedup on `X-GitHub-Delivery` UUID (5-min TTL in Netlify Blobs) so retries
>   never double-post.
> * Ack `202` in under 100ms; the agent call runs in `context.waitUntil`.
> * Installation tokens are minted on demand from an RS256 JWT — never
>   persisted, never cached across cold starts.
> * Per-installation token-bucket rate limit (60 invocations / rolling hour)
>   so a workflow loop can't drain the Anthropic quota.
> * Every delivery writes one JSON entry to an audit blob store — keyed by
>   `<day>/<uuid>` — so post-hoc "did the reviewer's event arrive?" is
>   answerable in one HTTP call.
>
> The actual reply is a single Anthropic message call against the thread
> context. I'm using the OAuth surface (`anthropic-beta: oauth-2025-04-20`)
> with `claude-haiku-4-5` — cheap, fast, and good enough for the v1 commands
> (summarize, triage, email, reply, handoff, link).
>
> What I'm uncertain about and would love feedback on:
>
> 1. The rate limit. 60/hr is what feels right; I have no data on what
>    real installations need. Open to suggestions.
> 2. Auto-triage on every new issue. It's the magic moment for some teams
>    and noise for others. v2 will let you opt out per repo.
> 3. Whether to mint installation tokens once per cold start vs. per call.
>    Currently per-call; the overhead is real but the security story is
>    cleaner.
>
> Source for the App is at github.com/agenticmail/github-app (the
> webhook function itself lives in our frontend repo). Install at
> github.com/marketplace/agenticmail. Free forever.
>
> Happy to answer anything.

---

## Marketplace listing description (one-liner for SEO)

> Tag @agenticmail in any GitHub issue or PR and an AI agent reads the thread
> and replies inline. Auto-summarize PRs, auto-triage issues. Free.

---

## LinkedIn

> 🚀 New release: **AgenticMail for GitHub** is live on the Marketplace.
>
> What it is: a free GitHub App that lets your team tag `@agenticmail` in
> any issue or pull request to get an inline AI reply within seconds. New
> PRs get auto-summarized. New issues get auto-triaged with suggested
> labels and priority.
>
> What it isn't: another dashboard you have to keep open. The whole UX is
> inside GitHub, where your work already happens.
>
> Built with Anthropic Claude. HMAC-verified webhooks, per-installation
> rate limiting, short-lived installation tokens — the boring security
> bits are in place.
>
> Install free → github.com/marketplace/agenticmail

---

## Internal Slack / Discord announcement (terse)

> 🎀 AgenticMail for GitHub is live on the Marketplace —
> https://github.com/marketplace/agenticmail
>
> Install it on a repo, tag `@agenticmail` in an issue or PR, and you'll
> get an inline AI reply. Auto-summarize on PR open. Auto-triage on issue
> open. Free.
>
> Hammer it. File issues against `agenticmail/github-app`.

---

## Pre-launch checklist (before posting anywhere)

- [ ] Listing approved by GitHub and showing publicly at
      `github.com/marketplace/agenticmail`
- [ ] Install at `github.com/apps/agenticmail` returns 200 (not 404)
- [ ] `@agenticmail summarize` smoke test passes on at least 2 distinct repos
- [ ] `/api/github/health` returns `configured: true` for all four secrets
- [ ] `/api/github/audit?day=YYYY-MM-DD` returns recent entries
- [ ] Pinned tweet has `product-screenshot.png` attached
- [ ] Show HN draft has the actual URLs (not placeholders)
