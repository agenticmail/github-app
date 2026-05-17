# Welcome email template — first install

Fired by the `installation.created` webhook (design.md §4.5). When a new
account installs **AgenticMail for GitHub**, the install handler resolves the
account owner's email and sends this template via the existing AgenticMail send
path.

## When it sends

- Trigger: `installation.created`
- Recipient: the owner of `installation.account` (org owner or the user)
- Once per installation. `installation.deleted` does **not** send anything.

## Subject line

```
You've installed AgenticMail for GitHub 🎀
```

## Placeholders

The install handler must substitute these before sending. Every placeholder is
`{{double_braced}}`.

| Placeholder              | Source                                              | Example                                                            |
| ------------------------ | --------------------------------------------------- | ------------------------------------------------------------------ |
| `{{account_login}}`      | `installation.account.login`                        | `acme-co`                                                          |
| `{{account_type}}`       | `installation.account.type`                         | `Organization`                                                     |
| `{{installation_id}}`    | `installation.id`                                   | `48217734`                                                         |
| `{{repo_scope}}`         | derived from `installation.repository_selection`    | `all repositories` / `3 selected repositories`                     |
| `{{settings_url}}`       | derived — see rule below                            | `https://github.com/organizations/acme-co/settings/installations/48217734` |

**`{{settings_url}}` derivation rule:**

- If `account_type == "Organization"`:
  `https://github.com/organizations/{{account_login}}/settings/installations/{{installation_id}}`
- Otherwise (a user account):
  `https://github.com/settings/installations/{{installation_id}}`

This is the GitHub-hosted App settings page where the operator manages repo
access and can uninstall.

## Body — plain text

Rendered version: `templates/welcome-email.txt`

## Body — HTML

Rendered version: `templates/welcome-email.html`

Send both parts as a multipart message (text + html). Clients that can't render
HTML fall back to the text part — they are kept content-equivalent on purpose.

---

## Preview (plain text)

```
Hi there,

AgenticMail for GitHub is now installed on {{account_login}}
({{account_type}}), covering {{repo_scope}}. Your AI teammate is live.

TRY IT IN 10 SECONDS
Open any issue or pull request on a covered repo and leave a comment:

    @agenticmail summarize

The bot will react 👀, then post a 2-paragraph summary of the thread.

WHAT ELSE IT DOES
  @agenticmail triage             suggest labels + priority
  @agenticmail reply <prompt>     draft a follow-up comment
  @agenticmail email <address>    send the thread to a real inbox
  @agenticmail handoff to <agent> route it to another agent
  @agenticmail link related       find related issues

New issues are triaged automatically and new pull requests are
summarized automatically — no mention needed.

MANAGE THIS INSTALL
Add or remove repositories, or uninstall, from the App settings page:
{{settings_url}}

Questions? Just reply to this email or reach us at support@agenticmail.io.

— The AgenticMail team
https://agenticmail.io/github
```
