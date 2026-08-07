import type { Metadata } from 'next'
import AnimationsInit from '@/components/AnimationsInit'
import CvReel from './CvReel'
import './cv.css'

const DESC =
  'Creative director with 26 years across agency, in-house, studio and freelance work in Argentina and Australia. Brisbane-based, working remote.'

export const metadata: Metadata = {
  title: 'CV',
  description: DESC,
  alternates: { canonical: 'https://benjaminarnedo.com/cv' },
  openGraph: {
    title: 'CV — Benjamin Arnedo',
    description: DESC,
    url: 'https://benjaminarnedo.com/cv',
    images: [{ url: '/social-media.jpg', width: 1280, height: 720 }],
  },
  twitter: { title: 'CV — Benjamin Arnedo', description: DESC, images: ['/social-media.jpg'] },
}

type Job = {
  title: string
  org: string
  when: string
  tag?: string
  points: React.ReactNode[]
}

const JOBS: Job[] = [
  {
    title: 'Creative Director — Independent practice',
    org: 'Brisbane, QLD / Remote',
    when: '2020 – Present',
    tag: 'Freelance',
    points: [
      <>Photography and creative direction for the <b>City Renewal Authority</b> (ACT Government) Winter in the City campaign — a two-week event generating <span className="cv-num">$2.72M</span> in local economic activity, with <span className="cv-num">30,000</span> attendees at Glebe Park and <span className="cv-num">12,000</span> at Garema Place. Images ran in the Authority&rsquo;s public campaign.</>,
      <><span className="cv-num">Four consecutive years</span> documenting the <b>Lunar New Year festival</b> in Dickson for the same client.</>,
      <>Original brand identity for <b>National Triangle</b>, the tourism and promotion brand of the <b>National Capital Authority</b> (federal government), 2021 — the identity ran for <span className="cv-num">five years</span>.</>,
      <>Designed and built <b>connectup.au</b> for the <b>University of Canberra</b> (2024) — an academic research project activating a student hub in Belconnen, ACT.</>,
      <>Website design and build, motion graphics and brand identity for private clients across Australia and Argentina — all remote, including an extended period working from overseas, as sole point of contact from brief to delivery.</>,
      <><b>Build generative design systems.</b> Construct components, variables and layouts programmatically by driving Penpot, Pencil and Sketch over MCP — producing editable design files, not images. Deliver pattern and asset engines clients run themselves to grow their own libraries.</>,
      <><b>Ship open-source tooling</b> — public at github.com/buda-loco. <b>Oxygen Skills</b>: the first Claude Code skill for Oxygen 6 / Breakdance WordPress builds. <b>WP Static Mirror</b>: serves a WordPress site as plain static files, removing the attack surface rather than hardening it. <b>Color Palette Generator</b>: an Adobe Illustrator script producing palettes with RGB, CMYK and HEX values.</>,
    ],
  },
  {
    title: 'Assistant Director / Editor',
    org: 'Crewcible · Canberra, ACT',
    when: 'Feb 2023 – 2024',
    points: [
      <>Directed and edited documentary and commercial projects, from shoot through to delivery.</>,
      <>Contributed to the <b>ALTRAC / Sydney Light Rail</b> proposal film with CRE8IVE — integrating location footage with 3D infrastructure renders for a national transport client&rsquo;s Parramatta Road to Green Square route pitch.</>,
      <>Managed production pipelines and worked with directors and producers on narrative and pacing.</>,
    ],
  },
  {
    title: 'Graphic Designer — Communications & Client Management',
    org: 'Dionysus · Canberra, ACT',
    when: 'May 2021 – Jan 2023',
    points: [
      <>Led rebranding initiatives and crisis communications for government and corporate clients.</>,
      <>Created and executed marketing and communication strategies aligned to business goals.</>,
      <>Moved company operations into ClickUp, improving job tracking and throughput.</>,
      <>Managed teams and client relationships from brief to delivery.</>,
    ],
  },
  {
    title: 'Senior Graphic Designer',
    org: 'Added Value Enterprises · Brisbane, QLD',
    when: 'Jun 2020 – Feb 2022',
    tag: 'Freelance',
    points: [
      <>Designed and implemented digital marketing strategies for Brisbane clients.</>,
      <>Optimised social media campaigns against agreed KPIs.</>,
      <>Managed content creation and distribution for targeted audiences.</>,
    ],
  },
  {
    title: 'Senior Graphic Designer',
    org: 'Cre8ive · Canberra, ACT',
    when: 'Mar 2021 – May 2021',
    points: [
      <>Produced collateral for Australian Government and corporate clients to existing brand guidelines.</>,
      <>Developed WCAG-compliant accessible documents for government projects.</>,
      <>Maintained client websites and designed social media assets.</>,
    ],
  },
  {
    title: 'Lecturer',
    org: 'Foundry · Launceston, Tasmania',
    when: 'Feb 2020 – Jun 2020',
    points: [
      <>Delivered photography, video production and design curriculum.</>,
      <>Maintained course content and assessment records; provided student feedback.</>,
    ],
  },
  {
    title: 'Co-Director & Co-Founder',
    org: 'Zstudios · Tucumán, Argentina',
    when: '2015 – 2019',
    points: [
      <>Co-founded and ran the studio end to end: team, suppliers and client relationships.</>,
      <>Led creative direction across branding, digital, print and video.</>,
      <>Wound the studio down in 2019 on relocating to Australia.</>,
    ],
  },
  {
    title: 'Art Director',
    org: 'Kipus · Buenos Aires, Argentina',
    when: '2014 – 2016',
    points: [
      <>Created the company&rsquo;s visual identity and brand style manual.</>,
      <>Designed client infographics covering key weekly news topics.</>,
      <>Ran multiple concurrent projects to deadline.</>,
    ],
  },
  {
    title: 'Senior Lecturer',
    org: 'UNSTA · Tucumán, Argentina',
    when: 'Jan 2010 – Jan 2015',
    points: [
      <>Led Senior Audiovisual Media, Senior Design Workshop and UX/UI Design classes.</>,
      <>Developed curriculum aligned to industry practice.</>,
      <>Mentored students individually through to portfolio.</>,
    ],
  },
]

const SKILLS = [
  'Creative direction and art direction',
  'Brand strategy and identity systems',
  'Custom generative systems — pattern engines and asset generators built per brand',
  'Web design and development (WordPress, HTML, CSS, JavaScript, Next.js)',
  'Photography, videography and video editing',
  'Motion graphics and animation',
  'UX/UI design and consultation',
  'Adobe Creative Suite and Affinity suite',
  'Team leadership, client and stakeholder management',
  'English / Spanish, native bilingual',
]

const SERVICES = [
  'Create creative apps for your clients',
  'Design awesome apps for you',
  'Supervise a multi-channel marketing campaign',
  'Automate design processes',
  'Create specialised skills for your studio',
  'Suggest creative workflows',
  'Design amazing brands',
  'Build pattern engines your team runs without me',
  'Build the thing that builds the things',
  'Direct the shoot and cut it myself',
  'Make a commercial without a film crew',
  'Give your WordPress site no attack surface at all',
  'Teach your designers the tooling',
  'Rescue a brand that has drifted',
  'Run a rebrand end to end',
  'Shoot your event and have it edited by Monday',
  'Turn a brand guideline into something that generates',
  'Write the words as well',
]

export default function CvPage() {
  return (
    <div className="page cv">
      <AnimationsInit />

      <header className="cv-head" data-animate="fade-up">
        <h1>Benjamin Arnedo</h1>
        <span className="cv-role">Creative Director</span>

        <p className="cv-contact">
          <span>Brisbane, Queensland, Australia</span>
          <span className="cv-sep">·</span>
          <a href="mailto:hello@benjaminarnedo.com"><b>hello@benjaminarnedo.com</b></a>
          <span className="cv-sep">·</span>
          <a href="https://www.linkedin.com/in/benjaminarnedo/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
          <span className="cv-sep">·</span>
          <a href="https://github.com/buda-loco" target="_blank" rel="noopener noreferrer">GitHub</a>
          <span className="cv-sep">·</span>
          <span><b>Australian Citizen</b></span>
          <span className="cv-sep">·</span>
          <span>English / Spanish</span>
        </p>

        <a className="cv-download" href="/benjamin-arnedo-cv.pdf" download>
          Download PDF
        </a>
      </header>

      <h2>Profile</h2>
      <p className="cv-intro" data-animate="fade-up">
        Creative director with <span className="cv-num">26 years</span> across agency, in-house, studio and freelance
        work in Argentina and Australia. I came up making the work — type, code, camera,
        edit, motion — and taught it at university level for five years before I directed
        anyone. I still build: generative design systems, production tooling, and shipped
        software other designers use. Australian citizen, with government, NGO and private
        sector clients including the ACT Government. Bilingual English/Spanish.
        Brisbane-based, working remote.
      </p>

      <h2>Experience</h2>
      {JOBS.map((job) => (
        <div className="cv-job" key={job.title + job.org} data-animate="fade-up">
          <div className="cv-job-head">
            <p className="cv-job-title">{job.title}</p>
            <span className="cv-job-when">{job.when}</span>
          </div>
          <p className="cv-job-org">
            {job.org}
            {job.tag && <span className="cv-tag">{job.tag}</span>}
          </p>
          <ul>
            {job.points.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </div>
      ))}

      <p className="cv-earlier" data-animate="fade-up">
        <b>Earlier career · Argentina · 2000 – 2010.</b> Design, UX and project roles across
        Plusware, e-ssence.net, Telemática, Comfye, Comunicar, Souza Diseño, Vectorica and
        Developmates. CTO for TEDx Tucumán 2011. Finalist, Open App Challenge 2012
        (Movistar / Telefónica).
      </p>

      <h2>Skills</h2>
      <ul className="cv-skills" data-animate="fade-up">
        {SKILLS.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>

      <h2>Education</h2>
      <div className="cv-edu-grid" data-animate="fade-up">
        <div>
          <p className="cv-edu-title">Bachelor of Graphic Design</p>
          <p className="cv-edu-meta">
            UNSTA — National University of the North Saint Thomas Aquinas
            <br />
            Tucumán, Argentina · 2001 – 2005
          </p>
        </div>
        <div>
          <p className="cv-edu-title">Diploma in Business</p>
          <p className="cv-edu-meta">
            Spencer College
            <br />
            Brisbane, QLD · 2020 – 2021
          </p>
        </div>
      </div>

      <p className="cv-foot">References available on request.</p>

      <section className="cv-reel-block" aria-labelledby="cv-reel-heading">
        <h2 id="cv-reel-heading" className="cv-reel-heading">
          This is all the stuff <em>I can do for you</em>
        </h2>
        <CvReel items={SERVICES} />
      </section>
    </div>
  )
}
