import { useNavigate } from 'react-router-dom'
import { Icon } from '@/components/Icon'

export function PrivacyPage() {
  const navigate = useNavigate()
  return (
    <div className="screen-inner fade-in legal-page">
      <button
        type="button"
        className="btn btn-ghost"
        style={{ padding: '8px 10px', marginBottom: 8 }}
        onClick={() => navigate(-1)}
      >
        <Icon name="left" size={16} /> Back
      </button>

      <h1>Privacy Policy</h1>
      <p className="muted legal-updated">Last updated: June 1, 2026</p>

      <p>
        Kanji (“the app”) is an open-source project maintained by{' '}
        <a href="https://github.com/kadar77" target="_blank" rel="noreferrer">@kadar77</a>. In
        short: the app has <strong>no accounts and no tracking</strong>, your study progress stays{' '}
        <strong>in your browser</strong>, and the only data sent to a server is the minimum needed
        to run a live multiplayer game.
      </p>

      <h2>What we store on your device</h2>
      <p>
        Your progress and preferences are saved locally in your browser (<code>localStorage</code>)
        and are never sent to us: per-kanji mastery, test history, best game scores, settings, and
        your last-used multiplayer nickname and avatar. You can erase this anytime from Settings
        (progress reset) or by clearing your browser’s site data.
      </p>

      <h2>Multiplayer (Hayaoshi 早押し)</h2>
      <p>
        When you host or join a live game, the nickname, avatar, and color you choose, plus your
        answers and score, are sent to our game server (a Cloudflare Worker) solely to run that
        game in real time. This data is <strong>transient and anonymous</strong> — held only for
        the lifetime of the room and <strong>automatically deleted</strong> shortly after (an idle
        lobby after ~2 hours; a finished game ~10 minutes after it ends). If you only use the
        single-player features, nothing is sent to the game server.
      </p>

      <h2>Third-party services</h2>
      <p>
        The app loads resources from third parties that may receive your IP address and standard
        request data under their own policies: <strong>Cloudflare</strong> (hosting, CDN, and the
        multiplayer backend), <strong>Google Fonts</strong>, and{' '}
        <strong>api.qrserver.com</strong> (renders the lobby join QR).
      </p>

      <h2>Cookies &amp; analytics</h2>
      <p>The app sets no cookies and uses no analytics, advertising, or tracking.</p>

      <h2>Children</h2>
      <p>
        The app is a general-audience educational tool and does not knowingly collect personal
        information from anyone.
      </p>

      <h2>Contact</h2>
      <p>
        Questions or requests? Open an issue at{' '}
        <a href="https://github.com/kadar77/kanji/issues" target="_blank" rel="noreferrer">
          github.com/kadar77/kanji
        </a>{' '}
        or reach the maintainer via{' '}
        <a href="https://github.com/kadar77" target="_blank" rel="noreferrer">github.com/kadar77</a>.
      </p>
    </div>
  )
}
