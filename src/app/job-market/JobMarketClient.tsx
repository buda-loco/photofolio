'use client'

import { useEffect, useRef } from 'react'
import TransitionLink from '@/components/TransitionLink'
import {
  SCRAPED, RELEVANT, DETAILED, EMPLOYERS, EMPLOYERS_ONCE,
  SOURCES, SEARCH_TERMS, FUNNEL, CITIES, SALARY, SALARY_BY_CITY,
  ARRANGEMENTS, ARRANGEMENT_STATED, ARRANGEMENT_UNSTATED,
  TOOLS, TASKS, REPEAT_EMPLOYERS, CV_COVERAGE, TAKEAWAYS,
  type Row, type CvRow,
} from '@/data/jobMarket'

const money = (n: number) => '$' + n.toLocaleString('en-AU')
const pct = (n: number, d: number) => Math.round((n / d) * 100)

/**
 * Single-series magnitude bars. One hue throughout — every chart on this page
 * answers "how many ads", so a second colour would be inventing a dimension
 * the data does not have. `onCv` switches a hatched fill for the two-state
 * "not on my CV" case; it is a state, not a series, and the tick plus the
 * legend carry it so it never reads by colour alone.
 */
function BarChart({
  rows, denom, showCv = false,
}: {
  rows: (Row | CvRow)[]
  denom: number
  showCv?: boolean
}) {
  const max = Math.max(...rows.map(r => r[1]))

  return (
    <div className="jm-chart">
      {rows.map((row, i) => {
        const [label, value] = row
        const onCv = showCv ? (row as CvRow)[2] : true
        const share = pct(value, denom)
        return (
          <div
            className="jm-bar"
            key={label}
            tabIndex={0}
            title={`${label} — ${value} of ${denom} ads (${((value / denom) * 100).toFixed(1)}%)`}
            aria-label={`${label}: ${value} of ${denom} ads, ${share} percent`}
          >
            <span className="jm-bar-lab">
              {showCv && onCv && <span className="jm-tick" aria-hidden="true">✓</span>}
              {label}
            </span>
            <span className="jm-bar-track">
              <span
                className={`jm-bar-fill${showCv && !onCv ? ' is-ghost' : ''}`}
                style={{
                  ['--w' as string]: `${((value / max) * 100).toFixed(1)}%`,
                  ['--d' as string]: `${i * 45}ms`,
                }}
              />
            </span>
            <span className="jm-bar-val">
              {share}%<em> {value}</em>
            </span>
          </div>
        )
      })}
    </div>
  )
}

function Stat({ fig, unit, label, sub, money: isMoney = false }: {
  fig: string
  unit?: string
  label: string
  sub: string
  money?: boolean
}) {
  return (
    <div className={`jm-stat${isMoney ? ' jm-stat--money' : ''}`}>
      <span className="jm-stat-fig">
        {fig}
        {unit && <span className="jm-stat-unit">{unit}</span>}
      </span>
      <span className="jm-stat-lab">{label}</span>
      <span className="jm-stat-sub">{sub}</span>
    </div>
  )
}

export default function JobMarketClient() {
  const progressRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const sections = Array.from(document.querySelectorAll<HTMLElement>('.jm-reveal'))

    if (reduce) {
      sections.forEach(s => s.classList.add('is-in'))
      return
    }

    // Deliberately IntersectionObserver, not ScrollTrigger: AnimationsInit kills
    // every ScrollTrigger from an async import on mount, which races this
    // component and can leave the bars stuck at zero width. Same reason
    // ShowreelGrid avoids it.
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in')
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    )
    sections.forEach(s => io.observe(s))

    // Plain scroll listener rather than ScrollTrigger, for the same reason.
    // Lenis drives window.scrollY, so this stays in step with the smooth scroll.
    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const bar = progressRef.current
        if (bar) {
          const h = document.documentElement.scrollHeight - window.innerHeight
          bar.style.transform = `scaleX(${h > 0 ? window.scrollY / h : 0})`
        }
        ticking = false
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()

    return () => {
      io.disconnect()
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  const salaryX = (v: number) =>
    ((v - SALARY.min) / (SALARY.max - SALARY.min)) * 100

  return (
    <div className="page jm">
      <div className="jm-progress" ref={progressRef} aria-hidden="true" />

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="jm-hero">
        <p className="jm-eyebrow">
          Australian creative job market
          <span className="jm-n">· Aug–Sep 2026</span>
        </p>
        <h1>
          225 creative<br />director jobs,<br />read properly.
        </h1>
        <p className="jm-lede">
          I scraped every creative-lead role I could find in Australia and read what
          they actually ask for. Here is what the market wants.
        </p>
        <div className="jm-chips">
          <span className="jm-chip is-key">{SCRAPED.toLocaleString('en-AU')} ads scraped</span>
          <span className="jm-chip">{SOURCES.join(' · ')}</span>
          <span className="jm-chip">{SEARCH_TERMS.length} search terms</span>
          <span className="jm-chip">{DETAILED} read in full</span>
          <span className="jm-chip">{EMPLOYERS} employers</span>
        </div>
      </section>

      {/* ── Method ─────────────────────────────────────────────── */}
      <section className="jm-section jm-reveal">
        <p className="jm-eyebrow">How the set was built</p>
        <h2>1,032 ads in. 149 read line by line.</h2>
        <p className="jm-body jm-body--bright">
          Three job boards, six search terms — creative director, design lead, design
          director, head of design, art director, brand design director. Then I stripped
          out the construction industry, which floods any &ldquo;design manager&rdquo;
          search with site roles that have nothing to do with this work.
        </p>

        <div className="jm-funnel">
          {FUNNEL.map(step => (
            <div
              className="jm-fstep"
              key={step.label}
              style={{ ['--w' as string]: `${((step.n / SCRAPED) * 100).toFixed(1)}%` }}
            >
              <span className="jm-fstep-lab">
                {step.label} <span>— {step.sub}</span>
              </span>
              <span className="jm-fstep-n">{step.n.toLocaleString('en-AU')}</span>
            </div>
          ))}
        </div>

        <p className="jm-note">
          Two denominators run through this page, and I have labelled which is which on
          every chart. Location, salary, employer and work-arrangement figures use all{' '}
          <strong>{RELEVANT}</strong> relevant ads. Tool and task figures use only the{' '}
          <strong>{DETAILED}</strong> whose full description I could read — you cannot
          count a word in an ad body you never retrieved.
        </p>
      </section>

      {/* ── Where ──────────────────────────────────────────────── */}
      <section className="jm-section jm-reveal">
        <p className="jm-eyebrow">
          Where the work is <span className="jm-n">· {RELEVANT} ads</span>
        </p>
        <h2>Two cities hold two thirds of it.</h2>
        <p className="jm-body">
          Sydney and Melbourne together account for 152 of {RELEVANT} roles. Brisbane is
          a real third market rather than a rounding error, which is the finding that
          matters to me. Perth, Adelaide and Canberra barely register.
        </p>
        <BarChart rows={CITIES} denom={RELEVANT} />
      </section>

      {/* ── Salary ─────────────────────────────────────────────── */}
      <section className="jm-section jm-reveal">
        <p className="jm-eyebrow">
          Salary <span className="jm-n">· {SALARY.n} ads stating a number</span>
        </p>
        <h2>Median {money(SALARY.median)}.</h2>
        <p className="jm-body">
          Half of these roles advertise between{' '}
          <strong>{money(SALARY.p25)} and {money(SALARY.p75)}</strong>. The full spread
          runs from {money(SALARY.min)} to {money(SALARY.max)}, so the outliers are doing
          real work on the average — the median is the honest number here, not the mean.
        </p>

        <div
          className="jm-range"
          role="img"
          aria-label={`Salary distribution: 25th percentile ${money(SALARY.p25)}, median ${money(SALARY.median)}, 75th percentile ${money(SALARY.p75)}, full range ${money(SALARY.min)} to ${money(SALARY.max)}.`}
        >
          <span className="jm-range-line" />
          <span
            className="jm-range-box"
            style={{
              left: `${salaryX(SALARY.p25)}%`,
              width: `${salaryX(SALARY.p75) - salaryX(SALARY.p25)}%`,
            }}
          />
          <span className="jm-range-cap" style={{ left: '0%' }} />
          <span className="jm-range-cap" style={{ left: '100%' }} />
          <span
            className="jm-range-med"
            style={{ left: `calc(${salaryX(SALARY.median)}% - 1.5px)` }}
          />
          {/* Only min / median / max are labelled — p25 and p75 are the box, and
              are spelled out in the tiles below. Five labels bunched up in the
              left third of the scale. */}
          <span className="jm-range-tick is-start">min {money(SALARY.min)}</span>
          <span className="jm-range-tick is-strong" style={{ left: `${salaryX(SALARY.median)}%` }}>
            {money(SALARY.median)}
          </span>
          <span className="jm-range-tick is-end">max {money(SALARY.max)}</span>
        </div>

        <div className="jm-stats">
          <Stat money fig={money(SALARY.median)} label="Median" sub={`the middle of ${SALARY.n} ads`} />
          <Stat money fig={money(SALARY.p25)} label="25th percentile" sub="a quarter pay less" />
          <Stat money fig={money(SALARY.p75)} label="75th percentile" sub="a quarter pay more" />
          <Stat money fig={money(SALARY.iqr)} label="Interquartile range" sub="the width of the middle half" />
        </div>

        <p className="jm-eyebrow jm-eyebrow--mt">
          Median by city <span className="jm-n">· annualised roles only</span>
        </p>
        <p className="jm-body">
          Sydney pays <strong>$16,000</strong> more than Brisbane at the median. Worth
          knowing before you assume the southern cities are where the money is — that gap
          is smaller than the rent difference.
        </p>
        <div className="jm-stats">
          {SALARY_BY_CITY.map(c => (
            <Stat key={c.city} money fig={money(c.median)} label={c.city} sub={`median of ${c.n} ads`} />
          ))}
        </div>
        <p className="jm-note">
          Hourly and day-rate contracts are excluded — annualising them invents a number
          the ad never offered. Cities shown where at least five ads state a salary.
          Brisbane&rsquo;s true median is $99,999.50, rounded here.
        </p>
      </section>

      {/* ── Arrangement ────────────────────────────────────────── */}
      <section className="jm-section jm-reveal">
        <p className="jm-eyebrow">
          Work arrangement <span className="jm-n">· {ARRANGEMENT_STATED} ads that say</span>
        </p>
        <h2>Fully remote is 11%.</h2>
        <p className="jm-body">
          This is the number I did not want to find. Hybrid has won, on-site is holding,
          and genuinely remote creative leadership is one role in nine. A further{' '}
          {ARRANGEMENT_UNSTATED} ads never state an arrangement at all, and I have left
          those out rather than guess.
        </p>
        <BarChart rows={ARRANGEMENTS} denom={ARRANGEMENT_STATED} />
      </section>

      {/* ── Tools ──────────────────────────────────────────────── */}
      <section className="jm-section jm-reveal">
        <p className="jm-eyebrow">
          Tools named in the ad <span className="jm-n">· {DETAILED} full descriptions</span>
        </p>
        <h2>Adobe still runs the country.</h2>
        <p className="jm-body">
          Every prediction that Figma would take this market is early. Adobe appears in
          more than a third of ads, and its three core apps each outrank Figma on their
          own. The two that surprised me sit lower down:{' '}
          <strong>Canva beats After Effects</strong>, and generative AI is now named in
          more ads than HTML.
        </p>
        <BarChart rows={TOOLS} denom={DETAILED} showCv />
        <div className="jm-legend">
          <span><i className="jm-key-solid" />Already on my CV</span>
          <span><i className="jm-key-hatch" />Not on my CV</span>
        </div>
      </section>

      {/* ── Tasks ──────────────────────────────────────────────── */}
      <section className="jm-section jm-reveal">
        <p className="jm-eyebrow">
          What they ask you to do <span className="jm-n">· {DETAILED} full descriptions</span>
        </p>
        <h2>The top skill isn&rsquo;t a craft skill.</h2>
        <p className="jm-body">
          Working across teams is named in <span className="jm-hl">62%</span> of ads —
          more than concepting, more than campaigns, and roughly three times more than
          typography. Read down the list and the pattern is blunt: these are jobs about
          carrying an idea through other people. The craft is assumed.
        </p>
        <BarChart rows={TASKS} denom={DETAILED} />
      </section>

      {/* ── The gap ────────────────────────────────────────────── */}
      <section className="jm-section jm-reveal">
        <p className="jm-eyebrow">The part that is about me</p>
        <h2>Nine of the ten most-wanted tools are already on my CV.</h2>
        <p className="jm-body">
          I ran my own capability list against the market&rsquo;s. This is the whole
          reason I built the dataset — not to describe the market, but to find out where
          I actually sit in it.
        </p>
        <div className="jm-stats">
          <Stat
            fig={String(CV_COVERAGE.topToolsCovered)}
            unit={`/${CV_COVERAGE.topToolsOf}`}
            label="Top tools covered"
            sub="of the ten most-requested"
          />
          <Stat
            fig={String(CV_COVERAGE.toolMentions.pct)}
            unit="%"
            label="Of all tool mentions"
            sub={`${CV_COVERAGE.toolMentions.covered} of ${CV_COVERAGE.toolMentions.total} across ${DETAILED} ads`}
          />
          <Stat
            fig={String(CV_COVERAGE.taskMentions.pct)}
            unit="%"
            label="Of all task mentions"
            sub={`${CV_COVERAGE.taskMentions.covered} of ${CV_COVERAGE.taskMentions.total} across ${DETAILED} ads`}
          />
          <Stat fig="2" label="Real gaps" sub="retail/in-store and packaging" />
        </div>

        <p className="jm-eyebrow jm-eyebrow--mt">Where I fall short</p>
        <p className="jm-body">
          Two things come up often enough to name.{' '}
          <strong>Retail and in-store design</strong> appears in 28% of ads and{' '}
          <strong>packaging</strong> in 18%; neither is a strength of mine. I have done
          fabrication, exhibition and event build at Zstudios, which is adjacent, but it
          is not the same as a retail rollout and I am not going to pretend otherwise.
        </p>
        <p className="jm-body">
          The one I do not have at all is Canva, in 14% of ads. That is an afternoon, not
          a gap.
        </p>
      </section>

      {/* ── Employers ──────────────────────────────────────────── */}
      <section className="jm-section jm-reveal">
        <p className="jm-eyebrow">
          Who is hiring <span className="jm-n">· {EMPLOYERS} employers across {RELEVANT} ads</span>
        </p>
        <h2>Almost nobody is hiring twice.</h2>
        <p className="jm-body">
          {EMPLOYERS_ONCE} of {EMPLOYERS} employers posted exactly one role. This is a
          long tail, not a market with a few big buyers — which means the job is findable
          but never concentrated, and a scattergun application strategy is the wrong
          shape for it.
        </p>
        <div className="jm-tablewrap">
          <table className="jm-table">
            <caption>Employers with more than one matching role</caption>
            <thead>
              <tr>
                <th scope="col">Employer</th>
                <th scope="col" className="jm-num">Roles</th>
              </tr>
            </thead>
            <tbody>
              {REPEAT_EMPLOYERS.map(([name, n]) => (
                <tr key={name}>
                  <td>{name}</td>
                  <td className="jm-num">{n}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Takeaways ──────────────────────────────────────────── */}
      <section className="jm-section jm-reveal">
        <p className="jm-eyebrow">What I take from it</p>
        <h2>Five things I did not know a week ago.</h2>
        <div className="jm-reads">
          {TAKEAWAYS.map(t => (
            <div className="jm-read" key={t.title}>
              <h3>{t.title}</h3>
              <p>{t.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────── */}
      <section className="jm-section jm-cta jm-reveal">
        <p className="jm-eyebrow">Three ways this could be useful</p>
        <h2>If you got here from LinkedIn, pick your one.</h2>
        <p className="jm-body jm-body--bright">
          I am a creative director and designer in Brisbane, working remote. Brand, web
          and video, hands-on from brief to delivery.
        </p>

        <div className="jm-cards">
          <div className="jm-card">
            <span className="jm-card-who">Recruiters</span>
            <h3>Want to talk about a role?</h3>
            <p>
              Have a look at the work first — it will tell you faster than a CV whether I
              am the right fit. Then email me and I will reply the same day.
            </p>
            <TransitionLink href="/work" className="jm-btn">See the work</TransitionLink>
          </div>

          <div className="jm-card">
            <span className="jm-card-who">Creatives</span>
            <h3>Looking, or want to partner up?</h3>
            <p>
              If you are in the same search, take the numbers — that is what they are
              for. And if you want to team up on something, a pitch, a shoot, a build, I
              am interested.
            </p>
            <a className="jm-btn" href="mailto:hello@benjaminarnedo.com?subject=Saw%20your%20market%20analysis">
              Say hello
            </a>
          </div>

          <div className="jm-card">
            <span className="jm-card-who">Agency owners</span>
            <h3>Hiring creative talent?</h3>
            <p>
              I have run a nine-person studio and led design on 25 to 50 events a year. I
              can come in as a lead, or on a project, and I ship the work myself.
            </p>
            <TransitionLink href="/cv" className="jm-btn">Read the CV</TransitionLink>
          </div>
        </div>
      </section>
    </div>
  )
}
