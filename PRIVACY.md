# Privacy Policy

_Last updated: June 1, 2026_

Kanji ("the app") is an open-source project maintained by
[@kadar77](https://github.com/kadar77) ("we", "us"). This policy explains what
data the app handles. In short: the app has **no accounts and no tracking**,
your study progress stays **in your browser**, and the only data sent to a
server is the minimum needed to run a live multiplayer game.

## What we store on your device

Your study progress and preferences are saved **locally in your browser**
(`localStorage`) and are never sent to us:

- mastery/progress per kanji, test history, and best game scores;
- settings (level system, theme, fonts, furigana/Mongolian toggles, etc.);
- your last-used multiplayer nickname and avatar (for convenience).

You can erase this at any time from the app's Settings (progress reset) or by
clearing your browser's site data.

## Multiplayer (Hayaoshi 早押し)

When you **host or join** a live game, the following is sent to our game server
(a Cloudflare Worker / Durable Object) solely to run that game in real time:

- the nickname, avatar, and color you choose;
- your answers and score during the game.

This data is **transient and anonymous** — it is held only for the lifetime of
the game room and is **automatically deleted** shortly afterwards (an idle
lobby is removed after about 2 hours; a finished game is removed about 10
minutes after it ends). We do not link it to any identity, and we keep no
history of nicknames or results. If you only use the single-player features,
**nothing is sent to the game server at all.**

## Third-party services

The app loads a few resources from third parties, which may receive your IP
address and standard request data under their own privacy policies:

- **Cloudflare** — hosting, CDN, and the multiplayer game backend.
- **Google Fonts** (`fonts.googleapis.com`, `fonts.gstatic.com`) — web fonts.
- **api.qrserver.com** — generates the QR code shown in a game lobby (the join
  link is sent to render the image).

## Cookies & analytics

The app sets **no cookies** and uses **no analytics, advertising, or tracking**.

## Children

The app is a general-audience educational tool and does not knowingly collect
personal information from anyone, including children.

## Changes

We may update this policy; material changes will be reflected by the "last
updated" date above.

## Contact

Questions or requests? Open an issue at
<https://github.com/kadar77/kanji/issues> or reach the maintainer via
[github.com/kadar77](https://github.com/kadar77).
