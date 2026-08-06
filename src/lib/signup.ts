/**
 * Sign-up submit path for the "Getting involved" section.
 *
 * WHY THIS DOES NOT COPY src/devfeedback/send.ts
 *
 * send.ts posts to its Apps Script sink with `mode: 'no-cors'` and treats any
 * delivered request as success, because an opaque response cannot be read. For a
 * feedback comment that is a fair trade: the batch is one person's note, and the
 * download fallback means nothing is lost.
 *
 * It is the wrong trade for a sign-up. This whole site argues that it tells you
 * what it actually knows, so telling a reader "you are on the list" when the
 * request may have vanished is the one failure that would matter most here. A
 * later session should NOT "fix" this file into consistency with send.ts.
 *
 * So the primary path is a normal readable fetch. Verified empirically against
 * the live endpoint on 2026-08-06: Apps Script's /exec answers a POST with a 302
 * to script.googleusercontent.com, and BOTH hops carry
 * `access-control-allow-origin: *`, so the final JSON body is readable
 * cross-origin. Content-Type text/plain keeps it a "simple" request, so there is
 * no preflight (Apps Script would not answer an OPTIONS).
 *
 * The JSONP doGet path stays as the documented fallback, used only if a readable
 * POST ever stops working (a Google change to those CORS headers would do it).
 * It is readable cross-origin by construction, since it arrives as a <script>.
 *
 * Anything we cannot positively read as success is a failure, and a failure
 * shows the mailto so nobody is stranded.
 */

/** Public Apps Script /exec URL, injected at build time. Empty when unset. */
const ENDPOINT = (import.meta.env.VITE_SIGNUP_URL as string | undefined)?.trim() || ''

/**
 * Unset is a first-class state, not an error. With no endpoint the section
 * renders a mailto invitation instead of a form that cannot work.
 */
export const signupConfigured: boolean = ENDPOINT.length > 0

/** Give up rather than leave the button disabled forever. */
const TIMEOUT_MS = 15000

export interface SignupInput {
  email: string
  name: string
  updates: boolean
  beta: boolean
  worksOn: string
  /** Honeypot. A human never sees this field, so any content means a bot. */
  honeypot: string
}

/**
 * What the component renders. Each maps to one string in essay-content.json;
 * `added` and `updated` are the only outcomes that may claim success.
 */
export type SignupOutcome =
  | 'added'
  | 'added-beta'
  | 'updated'
  | 'bad-email'
  | 'no-interest'
  | 'failed'
  | 'unconfigured'

export interface SignupResult {
  outcome: SignupOutcome
  /** True only when the endpoint said so. Drives the confirmation UI. */
  ok: boolean
}

/**
 * Deliberately permissive: one @, a dot in the domain, no spaces or address-list
 * punctuation. Matches validEmail_ in signup/server/Code.gs, so the client and
 * the endpoint agree on what counts as malformed. Real deliverability is not
 * knowable here, and a stricter pattern only rejects valid unusual addresses.
 */
const EMAIL_RE = /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]{2,}$/

const MAX = { email: 254, name: 120, worksOn: 1000 }

/** Cheap client-side gate, so obvious mistakes never reach the endpoint. */
export function validate(input: SignupInput): 'bad-email' | 'no-interest' | null {
  const email = input.email.trim()
  if (!email || email.length > MAX.email || !EMAIL_RE.test(email)) return 'bad-email'
  if (!input.updates && !input.beta) return 'no-interest'
  return null
}

interface EndpointResponse {
  ok?: unknown
  status?: unknown
  error?: unknown
}

function payloadOf(input: SignupInput): Record<string, string | boolean> {
  return {
    email: input.email.trim().slice(0, MAX.email),
    name: input.name.trim().slice(0, MAX.name),
    updates: input.updates,
    beta: input.beta,
    // Only meaningful when the beta box is ticked; the field is hidden otherwise.
    works_on: input.beta ? input.worksOn.trim().slice(0, MAX.worksOn) : '',
    // Which page the sign-up came from, recorded in the Sheet's Source column.
    source: `essay:${typeof location === 'undefined' ? 'unknown' : location.hash || '#/together'}`,
    website: input.honeypot,
  }
}

/**
 * Map the endpoint's {ok, status, error} onto an outcome. An unrecognised shape
 * is a failure: this is the function that must never invent a success.
 */
function interpret(body: EndpointResponse | null, beta: boolean): SignupResult {
  if (!body || typeof body !== 'object') return { outcome: 'failed', ok: false }
  if (body.ok === true) {
    if (body.status === 'updated') return { outcome: 'updated', ok: true }
    if (body.status === 'added') return { outcome: beta ? 'added-beta' : 'added', ok: true }
    return { outcome: 'failed', ok: false }
  }
  if (body.ok === false) {
    // 'rate', 'busy', 'bad-request', 'server' and anything unrecognised all mean
    // the same thing to a reader: it did not go through, here is the mailto.
    if (body.error === 'bad-email') return { outcome: 'bad-email', ok: false }
    if (body.error === 'no-interest') return { outcome: 'no-interest', ok: false }
    return { outcome: 'failed', ok: false }
  }
  return { outcome: 'failed', ok: false }
}

/** Primary path: readable POST. Throws if the body cannot be read as JSON. */
async function postReadable(
  payload: Record<string, string | boolean>,
  signal: AbortSignal,
): Promise<EndpointResponse> {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
    redirect: 'follow',
    signal,
  })
  // Not res.ok-gated: Apps Script can answer 200 with an error body, and a
  // non-2xx has no readable body worth interpreting either way.
  return (await res.json()) as EndpointResponse
}

/**
 * Fallback: JSONP through doGet. A <script> tag is readable cross-origin by
 * construction, so this survives a CORS regression on the POST path.
 */
function getJsonp(
  payload: Record<string, string | boolean>,
  timeoutMs: number,
): Promise<EndpointResponse> {
  return new Promise((resolve, reject) => {
    // Must match the endpoint's callback guard: a plain JS identifier.
    const cb = `origoSignup${Math.random().toString(36).slice(2, 10)}`
    const params = new URLSearchParams({ callback: cb })
    for (const [k, v] of Object.entries(payload)) params.set(k, String(v))

    const script = document.createElement('script')
    let timer: number

    const cleanup = () => {
      window.clearTimeout(timer)
      delete (window as unknown as Record<string, unknown>)[cb]
      script.remove()
    }

    ;(window as unknown as Record<string, unknown>)[cb] = (data: EndpointResponse) => {
      cleanup()
      resolve(data)
    }
    script.onerror = () => {
      cleanup()
      reject(new Error('jsonp failed'))
    }
    timer = window.setTimeout(() => {
      cleanup()
      reject(new Error('jsonp timed out'))
    }, timeoutMs)

    script.src = `${ENDPOINT}?${params.toString()}`
    document.head.appendChild(script)
  })
}

export async function submitSignup(input: SignupInput): Promise<SignupResult> {
  if (!signupConfigured) return { outcome: 'unconfigured', ok: false }

  const local = validate(input)
  if (local) return { outcome: local, ok: false }

  const payload = payloadOf(input)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    return interpret(await postReadable(payload, controller.signal), input.beta)
  } catch {
    // The POST was unreadable (opaque response, CORS regression, network error).
    // Try JSONP before calling it a failure, but never report success on a path
    // that did not answer.
    try {
      return interpret(await getJsonp(payload, TIMEOUT_MS), input.beta)
    } catch {
      return { outcome: 'failed', ok: false }
    }
  } finally {
    clearTimeout(timer)
  }
}
