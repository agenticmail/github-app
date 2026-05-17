# Smoke test runbook — AgenticMail for GitHub

The minimum set of checks to run before you trust the bot in front of real
users (and the same checks a GitHub Marketplace reviewer will effectively
run during certification).

Run all of these once after every meaningful change to
`netlify/functions/github-webhook.mts`.

---

## 0. Pre-flight

Confirm the webhook host is healthy and all four secrets are configured.

```sh
curl -s https://agenticmail.io/api/github/health | jq
```

Expected:

```json
{
  "ok": true,
  "subsystem": "github-webhook",
  "configured": true,
  "secrets": {
    "GITHUB_APP_ID": true,
    "GITHUB_APP_PRIVATE_KEY": true,
    "GITHUB_WEBHOOK_SECRET": true,
    "ANTHROPIC_AUTH_TOKEN": true
  }
}
```

If `configured` is `false`, stop — go fix the missing env var on Netlify.

---

## 1. Install on a fresh test repo

1. Create or pick a throwaway public repo on a personal account
   (not the `agenticmail` org — we want a different installation path).
2. Visit `https://github.com/apps/agenticmail` and install on **just that one repo**.
3. Within ~5 seconds, hit the audit endpoint:

```sh
curl -s -H "x-admin-token: $ADMIN_AUDIT_TOKEN" \
  "https://agenticmail.io/api/github/audit?day=$(date -u +%Y-%m-%d)&installs=1" | jq
```

You should see an `installation_notify` audit entry with `action: "created"`
and the new installation in the `installs` array.

---

## 2. Auto-triage on issue open

In the test repo, open a new issue with a real-looking body:

> **Title:** Auth tokens leak into client-side logs
>
> **Body:** When a user logs in, the access token shows up in the browser
> console because we log the full Axios response. Should we redact in the
> interceptor or move to a separate logger?

**Expected within ~15 seconds:** a bot comment from `agenticmail[bot]`
with suggested labels (e.g. `security`, `logging`), a priority, and an
"is this a duplicate?" check.

Failure modes to watch for:
- No comment at all → check `/api/github/audit` for a `failed` entry on
  this delivery.
- Bot comment is generic ("I don't have enough info") → check the prompt
  in `generateReply`; the issue body may not have made it through.

---

## 3. @mention in an issue comment

On the same issue, post a comment:

```
@agenticmail summarize
```

**Expected:**
- 👀 reaction on your comment within ~1 second.
- Bot reply comment within ~8 seconds with a 2-paragraph summary ending
  in `— [AgenticMail](https://agenticmail.io) · summarize`.

Verify in the audit log:

```sh
curl -s -H "x-admin-token: $ADMIN_AUDIT_TOKEN" \
  "https://agenticmail.io/api/github/audit?day=$(date -u +%Y-%m-%d)" \
  | jq '.entries[] | select(.event == "issue_comment")'
```

You should see one entry with `status: "processed"` and a non-zero
`latencyMs`.

---

## 4. Auto-summary on PR open

Open a PR in the test repo — any real change is fine, even a typo fix is
enough for the summary path.

**Expected within ~15 seconds:** bot comment summarizing the PR description.

If your PR has no body at all, the bot will still post — its summary will
note that the description is empty. That's intentional; means the path is
working.

---

## 5. Rate-limit cooldown

Spam the bot to verify the cooldown trips cleanly.

In an issue, post:

```
@agenticmail summarize
```

…61 times in under an hour (a quick loop with the GitHub CLI is fine):

```sh
for i in $(seq 1 61); do
  gh issue comment <issue-number> -R <user>/<repo> -b "@agenticmail summarize"
  sleep 2
done
```

**Expected on call 61:** instead of a normal reply, the bot posts the
rate-limit cooldown message with an ETA.

Verify:

```sh
curl -s -H "x-admin-token: $ADMIN_AUDIT_TOKEN" \
  "https://agenticmail.io/api/github/audit?day=$(date -u +%Y-%m-%d)" \
  | jq '[.entries[] | select(.event == "issue_comment")] | length'
```

Reset the bucket by waiting an hour, or — if you have shell access to the
Netlify blob store — delete the rate-limit key directly.

---

## 6. Bad-signature rejection

This is what a GitHub reviewer will probe. Send a request with no
signature:

```sh
curl -s -X POST https://agenticmail.io/api/github/webhook \
  -H "x-github-event: ping" \
  -H "x-github-delivery: probe-$(date +%s)" \
  -H "content-type: application/json" \
  -d '{"zen":"probe"}'
```

**Expected:** HTTP 401, body `{"error":"bad signature"}`.
Audit log should show a `bad_signature` entry for that delivery ID.

---

## 7. Self-loop guard

If the bot replied to its own comment, you'd have a runaway loop. We
guard against it by ignoring comments where `payload.comment.user.type ==
"Bot"`. The auto-triage and auto-summary paths post bot comments, and
those comment-created events fire back at us — verify they're
**ignored**, not re-processed.

Open a brand-new issue and let the auto-triage fire. Then check the
audit log for `issue_comment` entries on that issue:

```sh
curl -s -H "x-admin-token: $ADMIN_AUDIT_TOKEN" \
  "https://agenticmail.io/api/github/audit?day=$(date -u +%Y-%m-%d)" \
  | jq '.entries[] | select(.event == "issue_comment" and .repo == "you/test-repo")'
```

You should see the event landed (`status: "processed"`) but no follow-up
auto-reply — the bot reads its own comment and bails out.

---

## 8. Uninstall trace

Uninstall the App from the test repo. Within ~10 seconds:

```sh
curl -s -H "x-admin-token: $ADMIN_AUDIT_TOKEN" \
  "https://agenticmail.io/api/github/audit?day=$(date -u +%Y-%m-%d)&installs=1" | jq
```

You should see an `installation_notify` entry with `action: "deleted"`
and the installation should no longer appear in `installs`.

---

## Pass criteria

All eight steps green = green-light for the listing. Any red:
- Pull the failing delivery from the audit log.
- Inspect `error` field and Netlify function logs.
- Fix, redeploy, re-run from step 0.
