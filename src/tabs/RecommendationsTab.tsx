import { TabHero } from '../components/TabHero'
import { hashFor, useHashParam } from '../lib/router'
import data from '../content/recommendations.json'

/**
 * Recommendations from people in the Bible translation movement who know the
 * work. Two layers: a card grid (headshot, name, title, a short verbatim
 * snippet) and a full-text view at #/recommendations/<id>.
 *
 * Every entry lives in src/content/recommendations.json; adding one is one JSON
 * entry plus one photo in public/recommendations/. See
 * src/content/RECOMMENDATIONS.md. Text is quoted verbatim from the letter; the
 * snippet's pieces are joined with an ellipsis and must each appear in `full`.
 */
export interface Recommendation {
  id: string
  name: string
  title: string
  org: string
  photo: string
  photoCredit: string
  date: string
  snippet: string
  full: string[]
  links?: { label: string; url: string }[]
}

const RECS = (data as { recommendations: Recommendation[] }).recommendations

function photoUrl(photo: string): string {
  return `${import.meta.env.BASE_URL}recommendations/${photo}`
}

function monthYear(iso: string): string {
  const [y, m] = iso.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

/** Headshot, or the person's initials on a teal disc while no photo is set. */
function Portrait({ rec, size }: { rec: Recommendation; size: number }) {
  if (rec.photo) {
    return (
      <img
        className="rec-photo"
        src={photoUrl(rec.photo)}
        alt={`Portrait of ${rec.name}`}
        width={size}
        height={size}
        loading="lazy"
      />
    )
  }
  const initials = rec.name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
  return (
    <span className="rec-photo rec-photo--initials" style={{ width: size, height: size }} aria-hidden="true">
      {initials}
    </span>
  )
}

function Card({ rec }: { rec: Recommendation }) {
  return (
    <article className="rec-card">
      <header className="rec-card__who">
        <Portrait rec={rec} size={76} />
        <div>
          <h3 className="rec-name">{rec.name}</h3>
          <p className="rec-title">{rec.title}</p>
          {rec.org && <p className="rec-org">{rec.org}</p>}
        </div>
      </header>
      <blockquote className="rec-snippet">{rec.snippet}</blockquote>
      <a className="rec-more" href={`${hashFor('recommendations')}/${rec.id}`}>
        Read the full recommendation →
      </a>
    </article>
  )
}

function Full({ rec }: { rec: Recommendation }) {
  return (
    <article className="rec-full">
      <a className="rec-back" href={hashFor('recommendations')}>
        ← All recommendations
      </a>
      <header className="rec-full__who">
        <Portrait rec={rec} size={120} />
        <div>
          <h2 className="rec-name">{rec.name}</h2>
          <p className="rec-title">{rec.title}</p>
          {rec.org && <p className="rec-org">{rec.org}</p>}
          <p className="rec-date">{monthYear(rec.date)}</p>
        </div>
      </header>
      {rec.links && rec.links.length > 0 && (
        <p className="rec-links">
          View their website:{' '}
          {rec.links.map((l, i) => (
            <span key={l.url}>
              {i > 0 && ' · '}
              <a href={l.url} target="_blank" rel="noopener noreferrer">
                {l.label} ↗
              </a>
            </span>
          ))}
        </p>
      )}
      <div className="rec-letter">
        {rec.full.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      {rec.photoCredit && <p className="rec-credit">Photo: {rec.photoCredit}</p>}
    </article>
  )
}

export function RecommendationsTab() {
  const param = useHashParam()
  const rec = param ? RECS.find((r) => r.id === param) : undefined

  if (rec) {
    return (
      <section className="section">
        <div className="container">
          <Full rec={rec} />
        </div>
      </section>
    )
  }

  return (
    <>
      <TabHero id="tab-recommendations" />
      <section className="section" id="recommendations">
        <div className="container wide">
          <div className="rec-grid">
            {RECS.map((r) => (
              <Card key={r.id} rec={r} />
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
