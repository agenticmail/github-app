# AgenticMail for GitHub

> Mention `@agenticmail` in any issue or pull request and an AgenticMail agent
> reads the thread, does the work, and replies — right inside GitHub.

<!-- screenshot:hero -->
<!-- PLACEHOLDER — 1280×640 hero GIF: a user types "@agenticmail summarize"
     in an issue comment, the bot reacts 👀, then posts a 2-paragraph summary.
     File: docs/screenshots/hero.gif -->
<p align="center"><em>[ hero GIF — see docs/screenshots/hero.gif ]</em></p>

[![Marketplace](https://img.shields.io/badge/GitHub%20Marketplace-AgenticMail-2da44e)](https://github.com/marketplace/agenticmail)
[![Price](https://img.shields.io/badge/price-free-2da44e)](https://github.com/marketplace/agenticmail)
[![Install](https://img.shields.io/badge/install-1%20click-2da44e)](https://github.com/apps/agenticmail)

---

## What it does

AgenticMail for GitHub is a mention bot. Drop `@agenticmail` into a comment on
any issue or PR and the App invokes an AgenticMail agent against that thread.
The agent posts its result back as a comment — usually within a couple of
seconds, after dropping a 👀 reaction so you know it's working.

It also runs **automatically** on new issues (triage) and new PRs (summary), so
your backlog gets a first pass without anyone lifting a finger.

No new infrastructure: the App mounts as a route on your existing AgenticMail
deployment and reuses the agent runtime you already run.

---

## Install

### From GitHub Marketplace (recommended)

1. Open **[AgenticMail on the Marketplace](https://github.com/marketplace/agenticmail)**
   (or jump straight to the install page at **[github.com/apps/agenticmail](https://github.com/apps/agenticmail)**).
2. Click **Install it for free**.
3. Choose the account/org, then pick **All repositories** or a specific set.
4. Approve the requested permissions (see below) and confirm.

That's it — the bot is live on the repos you selected. The bot proves itself
the first time you `@agenticmail` it (or open a new issue / PR, which it
will auto-triage and auto-summarize respectively).

<!-- screenshot:install -->
<!-- PLACEHOLDER — 1280×800 PNG of the Marketplace install screen.
     File: docs/screenshots/install.png -->
<p align="center"><em>[ install screen — see docs/screenshots/install.png ]</em></p>

### Permissions requested

| Scope          | Access     | Why                                          |
| -------------- | ---------- | -------------------------------------------- |
| Issues         | Read/Write | Read thread context, post comments & reactions |
| Pull requests  | Read/Write | Summarize PRs, post review-comment replies   |
| Metadata       | Read       | Required by GitHub for any App               |

The bot **suggests** issue labels in a comment — it does **not** apply or remove
labels, close issues, or push code. Triage is advisory in v1.

---

## Use

In any issue or PR comment, type `@agenticmail` followed by a verb.

**Free plan** — read + AI-reply commands:

| Command                          | What happens                                              |
| --------------------------------- | --------------------------------------------------------- |
| `@agenticmail summarize`          | Posts a 2-paragraph summary of the thread.                |
| `@agenticmail triage`             | Suggests labels, a priority, and similar issues.          |
| `@agenticmail email <addr>`       | Sends the thread context to a real inbox via AgenticMail. |
| `@agenticmail reply <prompt>`     | Drafts a follow-up comment from your prompt.               |
| `@agenticmail handoff to <agent>` | Re-routes the request to another agent in your org.       |
| `@agenticmail link related`       | Finds and links related open issues by similarity.        |

**Paid plan** — state-changing actions (require an active paid subscription):

| Command                          | What happens                                              |
| --------------------------------- | --------------------------------------------------------- |
| `@agenticmail close [not planned]`| Closes the issue or PR. Use `not planned` for non-completed reasons. |
| `@agenticmail merge [squash\|rebase\|merge]` | Merges the pull request. Default: `squash`. |
| `@agenticmail review`             | Posts a formal Pull Request Review (`event: COMMENT`) with AI-generated feedback. Never auto-approves. |

If a paid command is invoked from a free-plan account, the bot replies with an
upgrade prompt linking to the Marketplace listing. No state changes occur.

Notes:
- A bare `@agenticmail` with no verb defaults to **summarize**.
- An unknown verb posts a short help comment — no agent call is made.
- Only the **first** `@agenticmail` mention in a comment is acted on.
- Comments from bots are ignored (loop guard).

### Runs automatically

- **New issue opened** → `triage` runs and posts suggested labels + priority.
- **New PR opened** → `summarize` runs against the description and diff stat.

<!-- screenshot:comment -->
<!-- PLACEHOLDER — 1280×720 PNG of a posted summarize comment with the
     "— AgenticMail · summarize" footer.
     File: docs/screenshots/comment.png -->
<p align="center"><em>[ example reply — see docs/screenshots/comment.png ]</em></p>

---

## For operators — deploying the App

The hosted App at [github.com/apps/agenticmail](https://github.com/apps/agenticmail)
runs on Netlify Functions. The same code can be re-deployed under any other
GitHub App by setting the four env vars below — the function itself is
infrastructure-agnostic (works on any platform that delivers `Request`/
`Response` and supports `context.waitUntil`).

### Production endpoints

| Route                          | Purpose                                          |
| ------------------------------- | ------------------------------------------------ |
| `POST /api/github/webhook`     | Receives all GitHub webhook deliveries.          |
| `GET  /api/github/health`      | Liveness + which secrets are configured.         |
| `GET  /api/github/audit`       | Operator-only audit log reader (admin-token gated). |

### GitHub App settings

When you register the App at **Settings → Developer settings → GitHub Apps**:

- **Webhook URL:** `https://<your-host>/api/github/webhook`
- **Webhook secret:** a strong random string (set it on the App and in env as `GITHUB_WEBHOOK_SECRET`).
- **Permissions:** Issues R/W, Pull requests R/W, Metadata R.
- **Subscribe to events:** `issue_comment`, `pull_request_review_comment`,
  `issues`, `pull_request`, `installation`, `marketplace_purchase`.

### Environment variables

| Var                          | Required | Purpose                                          |
| ----------------------------- | -------- | ------------------------------------------------ |
| `GITHUB_APP_ID`              | yes      | Numeric App ID from the App settings page.       |
| `GITHUB_APP_PRIVATE_KEY`     | yes      | PEM-encoded RSA private key (escaped `\n` ok).   |
| `GITHUB_WEBHOOK_SECRET`      | yes      | HMAC secret matching the App's webhook config.   |
| `ANTHROPIC_AUTH_TOKEN`       | one of   | Claude OAuth token (`sk-ant-oat01-…`).           |
| `ANTHROPIC_API_KEY`          | one of   | Classic API key (`sk-ant-api03-…`).              |
| `ADMIN_AUDIT_TOKEN`          | no       | Enables the `/api/github/audit` endpoint.        |
| `AGENTICMAIL_API_KEY`        | no       | Enables install/uninstall email notifications.   |
| `AGENTICMAIL_OPS_EMAIL`      | no       | Recipient address for those notifications.       |

The function reads `ANTHROPIC_AUTH_TOKEN` first; if absent it falls back
to `ANTHROPIC_API_KEY`. OAuth tokens require model `claude-haiku-4-5`
or higher — earlier-generation aliases like `claude-3-5-haiku-latest`
are not visible on the OAuth surface.

### Rate limiting + audit

Every accepted delivery writes one entry to the `github-webhook-audit`
Netlify Blob store, keyed by `<YYYY-MM-DD>/<delivery-uuid>`. User-triggered
mentions are bucketed at **60 per installation per rolling hour** — the bot
posts a polite cooldown comment once a bucket is exhausted.

### Build & run

```sh
npm install
npm run typecheck      # tsc --noEmit
npm run build          # compiles to dist/
```

A sample webhook payload for local testing lives at
`scripts/fixture-issue-comment.json`.

---

## How it works

```
GitHub comment  →  POST /webhooks/github
                   ├─ verify HMAC (timing-safe)
                   ├─ dedup on X-GitHub-Delivery UUID
                   └─ enqueue + 202 in <100ms
                          │
                   async worker
                   ├─ 👀 reaction on the trigger comment (~1s)
                   ├─ parse mention → verb + args
                   ├─ fetch thread context via Octokit
                   ├─ invoke agent runtime (inject-message)
                   └─ post the agent's reply as a comment
```

The webhook never blocks on agent work — GitHub gets its `202` immediately and
all the real work happens off the request path. See [`design.md`](./design.md)
for the full API contract.

### Security

- HMAC-SHA256 verification on every webhook, constant-time compared.
- Delivery-UUID dedup (5-min TTL) so GitHub retries never double-post.
- Short-lived (~60 min) per-installation tokens, minted on demand from the
  App's private key — never persisted.
- Per-installation rate limiting (60 user-mentions / hour) to cap abuse impact.
- Bot-authored comments are ignored on inbound (no self-mention loops).

---

## Related

- **[agenticmail/send-email-action](https://github.com/agenticmail/send-email-action)** —
  send email straight from a GitHub Actions workflow step. Different tool, same
  family: that's for CI pipelines, this is for issue/PR conversations.

---

## License

MIT © AgenticMail
