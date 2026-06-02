# Security Policy

## Supported versions

Only the latest code on `main` (deployed at the project's live URL) is
supported. Fixes are applied to `main`.

## Reporting a vulnerability

**Please do not open a public issue for security problems.**

Use GitHub's private vulnerability reporting: go to the repository's
**Security** tab → **Report a vulnerability**, or contact the maintainer via
[github.com/kadar77](https://github.com/kadar77). Please include steps to
reproduce and the impact you observed. We'll acknowledge as soon as we can and
keep you updated on the fix.

## Scope notes

- The app stores study progress only in your browser (`localStorage`) — there
  are no accounts and no personal data on a server.
- The multiplayer backend ([hayaoshi-server](https://github.com/kadar77/hayaoshi-server))
  accepts live game input over WebSockets; reports about input validation,
  abuse, or resource-exhaustion there are especially welcome.
