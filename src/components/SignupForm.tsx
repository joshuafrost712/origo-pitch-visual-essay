import { useId, useState } from 'react'
import { T, t } from './T'
import {
  signupConfigured,
  submitSignup,
  type SignupOutcome,
  type SignupResult,
} from '../lib/signup'

/**
 * The "Getting involved" sign-up. Accessibility is a requirement here rather
 * than a polish item: the people most likely to use it include translators on
 * poor connections and screen-reader users.
 *
 * The rule this component exists to keep: it never says a sign-up succeeded
 * unless the endpoint said so. See the header comment in src/lib/signup.ts.
 */

/** Which content node carries the message for each outcome. */
const MESSAGE_NODE: Record<SignupOutcome, string> = {
  added: 'su-added-updates',
  'added-beta': 'su-added-beta',
  updated: 'su-already',
  'bad-email': 'su-bad-email',
  'no-interest': 'su-no-interest',
  failed: 'su-failed',
  unconfigured: 'su-unconfigured',
}

/** The address is already published on the site; read it from the one node that holds it. */
function MailtoInvite() {
  const address = t('about-contact', 'label')
  return (
    <a className="su-mailto" href={`mailto:${address}`}>
      {address}
    </a>
  )
}

export function SignupForm() {
  const uid = useId()
  const id = (part: string) => `${uid}-${part}`

  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [updates, setUpdates] = useState(false)
  const [beta, setBeta] = useState(false)
  const [worksOn, setWorksOn] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [pending, setPending] = useState(false)
  const [result, setResult] = useState<SignupResult | null>(null)

  // With no endpoint configured there is no form to render, only an invitation
  // to email. This branch is what keeps a premature ship honest, and it has a
  // test of its own in tools/verify-signup-ui.mjs.
  if (!signupConfigured) {
    return (
      <div className="su su--unconfigured">
        <T id="su-unconfigured" field="text" as="p" className="su-status su-status--err" />
        <MailtoInvite />
      </div>
    )
  }

  const done = result?.ok === true
  // Messages appear only after a submit attempt, and are cleared by any edit, so
  // nothing stale sits under a field the reader has since corrected.
  const clearResult = () => result && setResult(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pending) return
    setPending(true)
    setResult(null)
    try {
      setResult(await submitSignup({ email, name, updates, beta, worksOn, honeypot }))
    } finally {
      setPending(false)
    }
  }

  const statusText = pending
    ? t('su-pending', 'text')
    : result
      ? t(MESSAGE_NODE[result.outcome], 'text')
      : ''

  const statusClass = pending
    ? 'su-status su-status--pending'
    : done
      ? 'su-status su-status--ok'
      : result
        ? 'su-status su-status--err'
        : 'su-status'

  return (
    <div className="su">
      {/* On success the form goes away rather than sitting there filled in,
          inviting a second submit of the same address. */}
      {!done && (
        // noValidate so this component owns validation: the browser's native
        // bubble would otherwise preempt the submit handler and the reader would
        // never see the section's own wording.
        <form className="su-form" onSubmit={onSubmit} noValidate>
          <div className="su-fields">
            <div className="su-field">
              <label className="su-label" htmlFor={id('email')}>
                <T id="su-email-label" field="label" />
              </label>
              <input
                className="su-input"
                id={id('email')}
                name="email"
                type="email"
                required
                autoComplete="email"
                aria-describedby={id('privacy')}
                aria-invalid={result?.outcome === 'bad-email' || undefined}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  clearResult()
                }}
              />
            </div>

            <div className="su-field">
              <label className="su-label" htmlFor={id('name')}>
                <T id="su-name-label" field="label" />
              </label>
              <input
                className="su-input"
                id={id('name')}
                name="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  clearResult()
                }}
              />
            </div>
          </div>

          <div className="su-checks">
            <div className="su-check">
              <input
                id={id('updates')}
                name="updates"
                type="checkbox"
                checked={updates}
                onChange={(e) => {
                  setUpdates(e.target.checked)
                  clearResult()
                }}
              />
              <label htmlFor={id('updates')}>
                <T id="su-updates-label" field="label" />
              </label>
            </div>
            <div className="su-check">
              <input
                id={id('beta')}
                name="beta"
                type="checkbox"
                checked={beta}
                onChange={(e) => {
                  setBeta(e.target.checked)
                  clearResult()
                }}
              />
              <label htmlFor={id('beta')}>
                <T id="su-beta-label" field="label" />
              </label>
            </div>
          </div>

          {/* Only asked when it is relevant, which is when the beta box is ticked. */}
          {beta && (
            <div className="su-field su-field--works">
              <label className="su-label" htmlFor={id('works')}>
                <T id="su-works-label" field="label" />
              </label>
              <textarea
                className="su-input su-textarea"
                id={id('works')}
                name="works_on"
                rows={2}
                placeholder={t('su-works-placeholder', 'label')}
                value={worksOn}
                onChange={(e) => {
                  setWorksOn(e.target.value)
                  clearResult()
                }}
              />
            </div>
          )}

          {/* Honeypot. Out of the tab order and hidden from assistive tech, so a
              human never meets it; the endpoint treats any content as a bot. */}
          <div className="su-honey" aria-hidden="true">
            <label htmlFor={id('website')}>Website</label>
            <input
              id={id('website')}
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>

          <div className="su-actions">
            <button className="su-btn" type="submit" disabled={pending}>
              {pending ? <T id="su-pending" field="text" /> : <T id="su-button" field="label" />}
            </button>
            {/* The email input's aria-describedby points at this paragraph, so the
                promise the address is given under is read out with the field
                itself. One element rather than a visible copy plus an sr-only
                one, which would be announced twice. */}
            <p className="su-privacy" id={id('privacy')}>
              <T id="su-privacy" field="text" />
            </p>
          </div>
        </form>
      )}

      {/* One persistent live region, so a status change is announced whether it
          replaces the form or sits beneath it. */}
      <p className={statusClass} role="status" aria-live="polite">
        {statusText}
      </p>

      {/* Never leave a reader stranded on a failure we cannot explain. */}
      {result?.outcome === 'failed' && <MailtoInvite />}
    </div>
  )
}
