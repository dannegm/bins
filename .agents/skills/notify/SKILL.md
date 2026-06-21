---
name: notify
description: >
  Send a push notification via ntfy to the current project's topic.
  Reads NTFY_TOPIC from the project's .env file.
  Use when the user wants to send a notification, alert, or reminder to their phone/device.
  Invoke as: /notify <message> [--title "Title"] [--priority low|default|high|urgent] [--tags emoji,emoji]
---

# /notify

Send a push notification using the `ntfy` CLI to the project's configured topic.

## Steps

1. Read `NTFY_TOPIC` from the `.env` file in the current working directory. If not found, look for `VITE_NTFY_TOPIC` as fallback. If neither exists, tell the user and stop.
2. Build the `ntfy` CLI command using the topic and the provided message.
3. Run the command and report the result (message ID and timestamp on success, error on failure).

## Usage

```
/notify Deploy finished
/notify "Tests passed ✅" --title "CI" --priority high
/notify "Review this PR" --tags loudspeaker,eyes
```

## Command construction

Base: `ntfy send <NTFY_TOPIC> "<message>"`

Optional flags (only include if provided by the user):
- `--title "..."` → `-t "..."`  or use `ntfy publish --title`
- `--priority <level>` → `-p <level>`
- `--tags <emoji,emoji>` → `--tags <emoji,emoji>`

Use `ntfy publish` form when adding extra options:

```bash
ntfy publish --title "CI" --priority high --tags white_check_mark E3Y0cvmotIcnZYqDKaoBGIOg "Tests passed"
```

## Output

On success: confirm with message ID. On error: show the error and suggest checking that `ntfy` is installed (`brew install ntfy`) and the topic is correct.
