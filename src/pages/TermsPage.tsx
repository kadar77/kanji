import { Link, useNavigate } from 'react-router-dom'
import { Icon } from '@/components/Icon'

export function TermsPage() {
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

      <h1>Terms of Use</h1>
      <p className="muted legal-updated">Last updated: June 1, 2026</p>

      <p>
        Welcome to Kanji (“the app”), an open-source project maintained by{' '}
        <a href="https://github.com/kadar77" target="_blank" rel="noreferrer">@kadar77</a>. By
        using the app you agree to these terms.
      </p>

      <h2>The service</h2>
      <p>
        Kanji is a free educational tool provided <strong>“as is”, without warranties of any
        kind</strong>. We don’t guarantee the content is error-free or that the service will be
        uninterrupted, and we may change or discontinue features at any time.
      </p>

      <h2>Acceptable use</h2>
      <p>When using the app — especially the multiplayer game — you agree to:</p>
      <ul>
        <li>choose nicknames and avatars that are not offensive, harassing, or impersonating;</li>
        <li>not disrupt, overload, abuse, or gain unauthorized access to the service or backend;</li>
        <li>use the app for personal, non-commercial study.</li>
      </ul>
      <p>We may remove rooms or block access that violates these terms.</p>

      <h2>Content &amp; licensing</h2>
      <p>
        The app’s source code is open-source under the MIT License. The bundled kanji dataset is
        derived from third-party dictionaries and corpora (KANJIDIC2, JMdict, Tatoeba, and others)
        under their respective licenses, including CC BY-SA 4.0 and CC BY — see the credits in the{' '}
        <a href="https://github.com/kadar77/kanji/blob/main/ATTRIBUTION.md" target="_blank" rel="noreferrer">
          repository
        </a>
        . The app is not affiliated with the JLPT, the 漢検 foundation, or any font or dictionary
        provider.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, the maintainer is not liable for any indirect,
        incidental, or consequential damages arising from your use of the app.
      </p>

      <h2>Contact</h2>
      <p>
        Questions? Open an issue at{' '}
        <a href="https://github.com/kadar77/kanji/issues" target="_blank" rel="noreferrer">
          github.com/kadar77/kanji
        </a>
        . See also our <Link to="/privacy">Privacy Policy</Link>.
      </p>
    </div>
  )
}
