import { useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { getSession, login, logout, DEMO_CREDENTIALS, type User } from './auth'
import { Brand } from './components/Brand'
import { FieldScene } from './components/FieldScene'
import {
  AlertCircleIcon,
  ArrowRightIcon,
  ChartIcon,
  CheckCircleIcon,
  CloudSunIcon,
  EyeIcon,
  EyeOffIcon,
  InfoIcon,
  LockIcon,
  LogoutIcon,
  MailIcon,
  ShieldCheckIcon,
  SparklesIcon,
  SproutIcon,
} from './components/icons'
import './App.css'

type FieldErrors = {
  email?: string
  password?: string
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function validate(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {}

  if (!email.trim()) {
    errors.email = 'Saisissez votre adresse e-mail.'
  } else if (!EMAIL_PATTERN.test(email.trim())) {
    errors.email = 'Cette adresse e-mail semble incomplète.'
  }

  if (!password) {
    errors.password = 'Saisissez votre mot de passe.'
  }

  return errors
}

/** Panneau de gauche : identité de marque et promesse produit. */
function VisualPanel() {
  return (
    <section className="login__visual" aria-label="Présentation de RizConnect">
      <FieldScene />

      <div className="visual__top">
        <Brand />
      </div>

      <div className="visual__content">
        <p className="eyebrow">Espace producteur · Campagne 2026</p>
        <h1 className="visual__title">
          Vos rizières,
          <br />
          <em>en un seul regard.</em>
        </h1>
        <p className="visual__text">
          Parcelles, météo, récoltes et ventes : la filière riz réunie dans un
          espace simple, pensé pour le terrain.
        </p>
        <ul className="features">
          <li className="feature">
            <SproutIcon />
            Parcelles suivies
          </li>
          <li className="feature">
            <CloudSunIcon />
            Alertes météo
          </li>
          <li className="feature">
            <ChartIcon />
            Ventes centralisées
          </li>
        </ul>
      </div>

      <p className="visual__footer">
        <ShieldCheckIcon />
        Connexion sécurisée · les données de votre exploitation restent protégées
      </p>
    </section>
  )
}

function App() {
  const [user, setUser] = useState<User | null>(() => getSession())
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [capsLock, setCapsLock] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)

  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  function resetFeedback() {
    setFormError(null)
  }

  function handleEmailChange(value: string) {
    setEmail(value)
    if (fieldErrors.email) {
      setFieldErrors((current) => ({ ...current, email: undefined }))
    }
    resetFeedback()
  }

  function handlePasswordChange(value: string) {
    setPassword(value)
    if (fieldErrors.password) {
      setFieldErrors((current) => ({ ...current, password: undefined }))
    }
    resetFeedback()
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (loading) return

    const errors = validate(email, password)
    setFieldErrors(errors)
    setFormError(null)

    if (errors.email) {
      emailRef.current?.focus()
      return
    }
    if (errors.password) {
      passwordRef.current?.focus()
      return
    }

    setLoading(true)
    try {
      const session = await login(email.trim(), password, remember)
      setUser(session)
      setPassword('')
      setHelpOpen(false)
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Connexion impossible pour le moment.',
      )
      passwordRef.current?.focus()
      passwordRef.current?.select()
    } finally {
      setLoading(false)
    }
  }

  function fillDemo() {
    setEmail(DEMO_CREDENTIALS.email)
    setPassword(DEMO_CREDENTIALS.password)
    setFieldErrors({})
    resetFeedback()
  }

  function handlePasswordKeyUp(event: KeyboardEvent<HTMLInputElement>) {
    if (typeof event.getModifierState === 'function') {
      setCapsLock(event.getModifierState('CapsLock'))
    }
  }

  function handleLogout() {
    logout()
    setUser(null)
    setEmail('')
    setPassword('')
    setFieldErrors({})
    resetFeedback()
    setHelpOpen(false)
  }

  // --- Session active : confirmation sobre ---
  if (user) {
    return (
      <main className="login">
        <VisualPanel />

        <section className="login__panel" aria-labelledby="session-title">
          <div className="auth-card auth-card--session" aria-live="polite">
            <div className="session-badge" aria-hidden="true">
              <CheckCircleIcon />
            </div>

            <p className="auth-card__eyebrow">Session ouverte</p>
            <h1 id="session-title">
              Bonjour,
              <br />
              <em>{user.name}.</em>
            </h1>
            <p className="auth-card__sub">
              Vous êtes connecté à votre espace producteur avec{' '}
              <strong>{user.email}</strong>.
            </p>

            <dl className="session-meta">
              <div>
                <dt>Rôle</dt>
                <dd>Producteur</dd>
              </div>
              <div>
                <dt>Accès</dt>
                <dd>
                  <span className="status-dot" aria-hidden="true" />
                  Sécurisé
                </dd>
              </div>
            </dl>

            <button type="button" className="btn-secondary" onClick={handleLogout}>
              <LogoutIcon />
              Se déconnecter
            </button>

            <p className="session-note">
              Le tableau de bord de votre exploitation sera bientôt disponible.
            </p>

            <footer className="auth-card__footer">
              <p className="security">
                <ShieldCheckIcon />
                Session de démonstration · aucune donnée réelle n’est utilisée
              </p>
            </footer>
          </div>
        </section>
      </main>
    )
  }

  // --- Écran de connexion ---
  return (
    <main className="login">
      <VisualPanel />

      <section className="login__panel" aria-labelledby="login-title">
        <div className="auth-card">
          <header className="auth-card__head">
            <p className="auth-card__eyebrow">Espace producteur</p>
            <h1 id="login-title">Connexion</h1>
            <p className="auth-card__sub">
              Heureux de vous revoir. Retrouvez votre exploitation en quelques
              secondes.
            </p>
          </header>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label className="field__label" htmlFor="email">
                Adresse e-mail
              </label>
              <div className="input">
                <MailIcon className="input__icon" />
                <input
                  ref={emailRef}
                  id="email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="vous@votre-exploitation.fr"
                  value={email}
                  onChange={(event) => handleEmailChange(event.target.value)}
                  aria-invalid={Boolean(fieldErrors.email || formError)}
                  aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                  disabled={loading}
                />
              </div>
              {fieldErrors.email && (
                <p className="field__error" id="email-error">
                  <AlertCircleIcon />
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div className="field">
              <label className="field__label" htmlFor="password">
                Mot de passe
              </label>
              <div className="input input--password">
                <LockIcon className="input__icon" />
                <input
                  ref={passwordRef}
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Votre mot de passe"
                  value={password}
                  onChange={(event) => handlePasswordChange(event.target.value)}
                  onKeyUp={handlePasswordKeyUp}
                  onBlur={() => setCapsLock(false)}
                  aria-invalid={Boolean(fieldErrors.password || formError)}
                  aria-describedby={
                    [
                      fieldErrors.password ? 'password-error' : null,
                      capsLock ? 'caps-hint' : null,
                    ]
                      .filter(Boolean)
                      .join(' ') || undefined
                  }
                  disabled={loading}
                />
                <button
                  type="button"
                  className="input__toggle"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={
                    showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'
                  }
                  aria-pressed={showPassword}
                  tabIndex={0}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {capsLock && (
                <p className="field__hint field__hint--warn" id="caps-hint">
                  <AlertCircleIcon />
                  La touche Verr. Maj semble activée.
                </p>
              )}
              {fieldErrors.password && (
                <p className="field__error" id="password-error">
                  <AlertCircleIcon />
                  {fieldErrors.password}
                </p>
              )}
            </div>

            <div className="form__options">
              <label className="check">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                  disabled={loading}
                />
                Rester connecté
              </label>
              <button
                type="button"
                className="link"
                onClick={() => setHelpOpen((open) => !open)}
                aria-expanded={helpOpen}
                aria-controls="reset-help"
              >
                Mot de passe oublié ?
              </button>
            </div>

            {helpOpen && (
              <div className="auth-note" id="reset-help" role="status">
                <InfoIcon />
                <p>
                  Pour réinitialiser votre accès, contactez votre coopérative à{' '}
                  <a href="mailto:support@rizconnect.app">support@rizconnect.app</a>.
                  Un conseiller vous répond sous 24 h.
                </p>
              </div>
            )}

            {formError && (
              <p className="auth-error" role="alert">
                <AlertCircleIcon />
                <span>{formError}</span>
              </p>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" aria-hidden="true" />
                  Connexion en cours…
                </>
              ) : (
                <>
                  Se connecter
                  <ArrowRightIcon />
                </>
              )}
            </button>
          </form>

          <div className="divider">ou</div>

          <div className="demo">
            <div className="demo__head">
              <span className="demo__icon" aria-hidden="true">
                <SparklesIcon />
              </span>
              <div className="demo__copy">
                <p className="demo__title">Compte de démonstration</p>
                <p className="demo__text">Explorez l’espace sans créer de compte.</p>
              </div>
              <button type="button" className="demo__btn" onClick={fillDemo}>
                Pré-remplir
                <ArrowRightIcon />
              </button>
            </div>
            <div className="demo__creds">
              <code>{DEMO_CREDENTIALS.email}</code>
              <span aria-hidden="true">·</span>
              <code>{DEMO_CREDENTIALS.password}</code>
            </div>
          </div>

          <footer className="auth-card__footer">
            <p className="security">
              <ShieldCheckIcon />
              Connexion chiffrée · données protégées
            </p>
            <p className="support">
              Pas encore de compte ?{' '}
              <a href="mailto:contact@rizconnect.app">Contactez votre coopérative</a>
            </p>
          </footer>
        </div>
      </section>
    </main>
  )
}

export default App
