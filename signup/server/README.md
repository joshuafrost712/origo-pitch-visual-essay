# Sign-up sink — Google Apps Script → Google Sheet

`Code.gs` is the public endpoint behind the essay's "Getting involved" sign-ups.
It is bound to a private Google Sheet (`Origo Sign-ups`, Joshua's My Drive) and
deployed as a web app with Anyone access. No secrets live in this file; config
is in Script Properties (`NOTIFY_EMAIL`).

**The canonical setup, deployment, and maintenance doc is in the vault:**
`Areas/AI/Origo signup form setup and runbook.md`. Edit that note, not this stub.

Two things worth having here:

- After editing `Code.gs`, the `/exec` URL keeps serving the old code until you
  do **Deploy → Manage deployments → pencil → Version: New version → Deploy**.
- Check the logic before you redeploy: `node tools/check-signup-logic.mjs`
  (stubbed services, no network). Then verify against the live endpoint:
  `node tools/verify-signup.mjs <exec-url>`
