# Issue Requests (Slack → GitHub)

Minerva lets anyone on the team file a request for the software team without pinging someone directly. Requests become
issues in the software issues repo (currently
[`waterloo-rocketry/2026-2027-software-issues`](https://github.com/waterloo-rocketry/2026-2027-software-issues)).

## Using it

- **`/request [optional description]`** opens a form (title, description, type, urgency, needed-by date, subteam).
- **Create software issue** in the `⋮` menu of any message opens the same form, prefilled with the message's text and
  linked back to it. Use this to turn a ping into an issue.

On submit, Minerva creates the issue, DMs the requester a link, and (for the message shortcut) replies in the original
thread. Issues are labelled `from-slack`, a type label (`bug` / `enhancement` / `question`) and a priority label
(`priority: high` / `priority: medium` / `priority: low`).

The issues repo is **public**, and the form warns users about this.

## How it works

| File                                              | Responsibility                                                         |
| ------------------------------------------------- | ---------------------------------------------------------------------- |
| `src/listeners/commands/requestCommand.ts`        | `/request` → opens the form                                            |
| `src/listeners/shortcuts/createIssueShortcut.ts`  | Message shortcut → opens the form prefilled from the message           |
| `src/listeners/views/issueRequestSubmit.ts`       | Form submission → validates, files the issue, notifies the requester   |
| `src/utils/issueRequests.ts`                      | Form layout, parsing, issue body/labels, Slack → Markdown conversion   |
| `src/utils/github.ts`                             | GitHub App authentication and issue creation                           |

Minerva authenticates as a GitHub App installed only on the issues repo, so issues are authored by `minerva[bot]` and no
personal token is involved. If the GitHub App isn't configured, the rest of Minerva runs normally and requesters are told
their issue couldn't be created (their text is sent back to them so it isn't lost).

## One-time setup

### 1. GitHub App (needs a `waterloo-rocketry` org owner)

1. Org settings → Developer settings → GitHub Apps → **New GitHub App**.
   - Name: `Minerva`; Homepage URL: this repo; **uncheck** Webhook → Active.
   - Repository permissions: **Issues: Read and write** (Metadata: Read-only is added automatically).
   - Where can this app be installed: **Only on this account**.
2. Note the **App ID**, then **Generate a private key** (downloads a `.pem`).
3. **Install App** → Only select repositories → the issues repo (and a sandbox repo for development, see below). The
   installation ID is the number at the end of the installation's settings URL
   (`.../settings/installations/<INSTALLATION_ID>`).

### 2. Repo secrets and variables

In this repo: Settings → Environments. Set these in **both** `development` and `production`:

| Name                        | Type     | Value                                                     |
| --------------------------- | -------- | --------------------------------------------------------- |
| `GH_APP_ID`                 | Secret   | The App ID                                                |
| `GH_APP_PRIVATE_KEY_BASE64` | Secret   | Output of `base64 -i minerva.pem \| tr -d '\n'`           |
| `GH_APP_INSTALLATION_ID`    | Secret   | The installation ID                                       |
| `GH_ISSUES_REPO`            | Variable | `owner/repo` to file issues in (see below)                |

Names can't start with `GITHUB_`, since GitHub reserves that prefix. The key is base64-encoded because the deploy workflows
write `.env` with `echo`, which would break a multi-line PEM.

For **development**, point `GH_ISSUES_REPO` at a sandbox repo (e.g. `waterloo-rocketry/minerva-issues-sandbox`) so
testing doesn't create issues in the real tracker. For **production**, use the current cycle's issues repo. When a new
design cycle starts, only this variable needs to change (plus installing the App on the new repo).

### 3. Labels in the issues repo

```sh
REPO=waterloo-rocketry/2026-2027-software-issues
gh label create from-slack       -R $REPO -c 4A154B -d "Filed from Slack via Minerva"
gh label create "priority: high"   -R $REPO -c B60205 -d "Blocking - needed ASAP"
gh label create "priority: medium" -R $REPO -c FBCA04 -d "Needed within a couple of weeks"
gh label create "priority: low"    -R $REPO -c 0E8A16 -d "Whenever"
```

`bug`, `enhancement` and `question` are GitHub's default labels and already exist.

### 4. Slack app configuration (both the dev and prod Slack apps)

At [api.slack.com/apps](https://api.slack.com/apps) → the Minerva app:

1. **Slash Commands** → Create New Command: `/request`, description "Request something from the software team", usage
   hint `[optional description]`.
2. **Interactivity & Shortcuts** → make sure Interactivity is on → Create New Shortcut → **On messages**:
   name "Create software issue", callback ID **`create_issue_from_message`**.
3. Reinstall the app to the workspace if Slack prompts for it.

Socket Mode is already enabled, so no request URLs are needed. The feature uses scopes Minerva already has (`commands`,
`chat:write`, `users:read`).

## Testing

- Unit tests: `yarn test` (`tests/unit/utils/issueRequests.test.ts`, `tests/unit/utils/github.test.ts`,
  `tests/unit/views/issueRequestSubmit.test.ts`).
- In the dev Slack: after steps 1–4 for development, `yarn run deploy-dev`, then try `/request` and the message
  shortcut. Issues should appear in the sandbox repo.
