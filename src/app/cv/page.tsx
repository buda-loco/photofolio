import type { Metadata } from 'next'
import AnimationsInit from '@/components/AnimationsInit'
import TransitionLink from '@/components/TransitionLink'
import CvReel from './CvReel'
import './cv.css'

const DESC =
  'Creative director and designer. Brand, campaign, web and video, in Australia and Argentina. Brisbane-based, working remote.'

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
    title: 'Creative Director',
    org: 'Independent practice · Brand, campaign, film and web for government, cultural and commercial clients. · Brisbane, QLD / Remote',
    when: '2020 – Present',
    points: [
      <><b>National Capital Authority</b>, the federal agency that plans and manages the parliamentary triangle at the centre of Canberra. Designed the <b>National Triangle</b> identity for its tourism and promotion work: logo, style guide, wayfinding, murals, merchandise and tourism film. A member of the Authority&rsquo;s board championed the project, the board approved it, and it ran across public-facing communications for <span className="cv-num">five years</span>.</>,
      <><b>City Renewal Authority</b>, the ACT Government agency renewing Canberra&rsquo;s city centre. Their go-to photographer and videographer over several years: event coverage, campaign imagery and films for internal and external communications, including a campaign on the public servants who keep the city running and a feature on design students&rsquo; work shown in vacant shopfronts turned into a gallery.</>,
      <>Event photography and video across Canberra&rsquo;s calendar: Winter in the City, the campaign behind <span className="cv-num">$2.72M</span> in local economic activity; <span className="cv-num">four consecutive</span> Lunar New Year festivals, edited live on site so finished imagery reached the client&rsquo;s channels the same day; Christmas in the City, Enlighten, Floriade, the National Multicultural Festival and Haig Park&rsquo;s centenary celebrations.</>,
      <><b>University of Canberra</b>. <b>ConnectUp</b> began as a university research project and now runs on its own: activities and places where young people can meet after class, and a working part of Belconnen&rsquo;s activation. Brought in for the branding and marketing, and designed and built <b>connectup.au</b>, the publishing system the team uses to run and promote every event.</>,
      <><b>This is Creative</b>, an Aboriginal-led agency in Canberra, on a nine-part publication suite commissioned by the <b>National Science and Technology Council</b>: four case studies and five fact sheets on Aboriginal and Torres Strait Islander knowledge systems. The agency led the work and the cultural engagement. I was brought in to keep the editorial design on brand and to produce every piece as an accessible version for download.</>,
      <><b>Pacific Security College</b> at the <b>Australian National University</b>. Edited the six episodes of <b>Pacific Wayfinder</b>, a vodcast marking twenty years of the Regional Assistance Mission to Solomon Islands, produced and directed by documentary maker Caitlin Welch, who brought me onto the project.</>,
      <>Branded a <b>40-lot land development</b> in Beechford, Tasmania: identity, site map, promotional PDFs, social assets, video and photography. <span className="cv-num">Two lots sold in the first 24 hours</span> of launch.</>,
      <>Build generative design systems and production tooling with <b>Claude Code</b> and MCP, driving Penpot, Pencil and Sketch to write components, variables and layouts, so clients get editable design files and asset engines they run themselves. Open-source work at github.com/buda-loco: <b>Oxygen Skills</b>, the first Claude Code skill for Oxygen 6 / Breakdance WordPress builds; <b>WP Static Mirror</b>, which serves a WordPress site as plain static files; and a <b>Color Palette Generator</b> for Illustrator. On my own time I am building <b>Invoicer</b>, an iOS invoicing app for freelancers, under my own label, The Pixel Forge.</>,
    ],
  },
  {
    title: 'Assistant Director / Editor',
    org: 'Crewcible · Documentary and commercial production studio · Canberra, ACT',
    when: 'Feb 2023 – Present',
    points: [
      <>Planned, shot and cut the <b>ALTRAC / Sydney Light Rail</b> proposal film with CRE8IVE on a <b>two-day shoot</b>: co-wrote the script, ran the schedule with a team of four, and used realtime visualisation to camera-match 3D renders of the future line into the location footage.</>,
      <>Shot on <b>The Day She Stole The Sun</b>, the studio&rsquo;s feature documentary on the Cobargo bushfires, as camera operator and videographer. Since screened at film festivals.</>,
      <>Wrote, storyboarded, shot, edited and finished client work end to end, coordinating talent throughout; redesigned the studio&rsquo;s website for its relaunch as a podcasting and recording facility. Still collaborating on documentary work today.</>,
    ],
  },
  {
    title: 'Creative Director',
    org: 'Dionysus · Placemaking agency: cultural activations and public events for the ACT Government, developers and universities · Canberra, ACT',
    when: 'Apr 2021 – Jan 2023',
    points: [
      <>Led design on <span className="cv-num">25 to 50</span> events and projects a year at <span className="cv-num">$10,000 to $250,000</span> each, directly for the <b>ACT Government</b> (City Renewal Authority, Events ACT), <b>Molonglo</b> and the <b>University of Canberra</b>.</>,
      <>Kept a 1976 institution with around <span className="cv-num">30,000 customers a week</span> trading through a two-year demolition and rebuild: ran communications for <b>Belconnen Fresh Food Markets</b>&rsquo; 31 traders, managed the crisis between them and the site&rsquo;s ASX-listed buyer, whose interests did not align, and created <b>the Belco Shed</b>, the interim identity that carried the market through.</>,
      <>Held footfall with events and activations, door-to-door campaigns, social media, live radio from the site and <span className="cv-num">23 days</span> of photography; the market reopened as <b>Capital Food Market</b> in December 2023 with its long-standing traders intact.</>,
      <>Shot photography and video across later editions of <b>LA FIESTA</b>, a multicultural festival drawing <span className="cv-num">7,000</span> people and now an official ACT Government case study in precinct activation, and made the video and animation campaign that promoted it.</>,
    ],
  },
  {
    title: 'Senior Graphic Designer',
    org: 'Cre8ive · Communications and creative agency for Australian Government and corporate clients · Canberra, ACT',
    when: 'Mar 2021 – May 2021',
    points: [
      <>Produced print and digital campaign collateral for Australian Government clients and Canberra businesses including <b>Tradies</b>, the <b>Suburban Land Agency</b> and <b>BAL Lawyers</b>.</>,
      <>Developed WCAG-compliant accessible documents for government projects; maintained client websites and social assets across several accounts.</>,
      <>Still retained per project: branding systems for their clients, graphics tooling written for each job.</>,
    ],
  },
  {
    title: 'Senior Designer',
    org: 'Added Value Enterprises · Content and design contractor to Australia Venue Co and ALH Group, two of the country\u2019s largest hospitality groups · Brisbane, QLD',
    when: 'Jan 2020 – Feb 2021',
    points: [
      <>Produced digital content for <span className="cv-num">200+ venues</span> across <b>Australia Venue Co</b>, <b>ALH Group</b> and Hallmark Group: hundreds of animated video assets, and videos promoting venue renovations and featured events, concerts and campaigns, including Big Gay Day, which headlined a Spice Girl.</>,
      <>Wrote and ran the COVID-19 rapid-response content strategy that let the business pivot through lockdown. Every key contract held; every venue stayed visible.</>,
    ],
  },
  {
    title: 'Lecturer',
    org: 'Foundry · Creative industries school · Launceston and Hobart, Tasmania',
    when: '2019 – Jun 2020',
    points: [
      <>Taught photography, video production, design, podcasting and new media at Tasmania&rsquo;s dedicated school for the creative industries, which ran its design programmes in partnership with the <b>University of Tasmania</b>.</>,
    ],
  },
  {
    title: 'Creative Director',
    org: 'Zstudios · Design, events and branding studio for government clients and for Sheraton, BMW, Ford, Michelin and Citroën · Tucumán, Argentina',
    when: '2015 – 2019',
    points: [
      <>Rebranded the studio with its founder and repositioned it for larger clients. Ran the <span className="cv-num">9-person</span> team: <span className="cv-num">100+ projects a year</span> across brand, graphic design, fabrication, event production and photography.</>,
      <>Commissioned by the <b>Argentine National Government</b> to lead event design and visual production for the <b>Argentine Bicentenary</b>, a ten-day national festival attended by <span className="cv-num">200,000+</span> people.</>,
      <>Designed the participant experience across four editions of the <b>Climáctivo Forum</b>, Argentina&rsquo;s principal international climate event: spatial layout, wayfinding, credentials, merchandise, website and live coverage. <span className="cv-num">20,000+</span> attendees in total.</>,
      <>Produced, directed and edited cinema advertising for <b>Solar Shopping Mall</b>, the region&rsquo;s largest, shot with local models and talent.</>,
      <>Delivered exhibition, brand, web, photography and video for the Ministry of Health, provincial governments and councils.</>,
    ],
  },
  {
    title: 'Art Director',
    org: 'Kipus · Communications and PR agency for Latin American technology startups, fintech to e-commerce, Mexico to Argentina · Buenos Aires, Argentina',
    when: '2014 – 2016',
    points: [
      <>Owned the agency&rsquo;s visual identity and brand manual, and condensed current-events data into infographics for decision-makers: a newsletter delivered visually.</>,
    ],
  },
  {
    title: 'Senior Lecturer',
    org: 'UNSTA · Universidad del Norte Santo Tomás de Aquino · Tucumán, Argentina',
    when: 'Jan 2010 – Jan 2015',
    points: [
      <>Led Senior Audiovisual Media, Senior Design Workshop and UX/UI Design classes.</>,
      <>Developed curriculum aligned to industry practice.</>,
      <>Mentored students individually through to portfolio.</>,
    ],
  },
]

const SKILLS = [
  'Creative direction: brand strategy, art direction, campaigns, events and placemaking',
  'Team leadership: mentoring, critique and stakeholder management',
  'Graphic design: identity, publications, print and digital',
  'Web: WordPress, Oxygen, HTML, CSS, JavaScript and Next.js',
  'UX/UI: Figma, Penpot, Pencil, design systems and accessibility',
  'Video: direction, camera, editing, colour grading and finishing',
  'Post-production: DaVinci Resolve, Premiere Pro and Final Cut Pro',
  'Motion: After Effects, Apple Motion and Blender',
  'Adobe: InDesign, Photoshop, Illustrator; Affinity suite',
  'AI tooling: agentic coding with Claude Code, image and video generation with frontier models, generative systems and workflow automation',
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
        <span className="cv-role">Creative Director &amp; Designer · Brand · Web · Video</span>

        <p className="cv-contact">
          <span>Brisbane, Queensland, Australia</span>
          <span className="cv-sep">·</span>
          <a href="mailto:hello@benjaminarnedo.com"><b>hello@benjaminarnedo.com</b></a>
          <span className="cv-sep">·</span>
          <a href="tel:+61416865550">0416 865 550</a>
          <span className="cv-sep">·</span>
          <TransitionLink href="/showreel">Showreel</TransitionLink>
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
        Creative director and designer. Brand, campaign, web and video, in Australia and
        Argentina. I take a job from concept and brand strategy through art direction, design,
        shoot, edit and delivery, and I still sit in the file. I have led creative teams,
        mentored designers at university level, and managed stakeholders, suppliers and
        budgets across government, cultural and commercial work. I build design systems and
        production tooling with agentic AI. Australian citizen, Brisbane-based, working remote.
      </p>

      <h2>Experience</h2>
      {JOBS.map((job) => {
        // org is "Company · what the company is · Place"; the middle part is optional
        const parts = job.org.split(' · ')
        const company = parts[0]
        const place = parts.length > 1 ? parts[parts.length - 1] : ''
        const blurb = parts.slice(1, -1).join(' · ')
        return (
        <div className="cv-job" key={job.title + job.org} data-animate="fade-up">
          <div className="cv-job-head">
            <p className="cv-job-title">{job.title}</p>
            <span className="cv-job-when">{job.when}</span>
          </div>
          <p className="cv-job-org">
            <span className="cv-job-co">{company}</span>
            {place && <span className="cv-job-place">{place}</span>}
            {job.tag && <span className="cv-tag">{job.tag}</span>}
          </p>
          {blurb && <p className="cv-job-blurb">{blurb}</p>}
          <ul>
            {job.points.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </div>
        )
      })}

      <p className="cv-earlier" data-animate="fade-up">
        <b>Earlier career · Argentina · 2000 – 2010.</b> Design, UX and project roles across
        Plusware, e-ssence.net, Telemática, Comfye, Comunicar, Souza Diseño, Vectorica and
        Developmates. CTO for TEDx Tucumán 2011. Finalist, Open App Challenge 2012
        (Movistar / Telefónica).
      </p>

      <h2>Capabilities</h2>
      <ul className="cv-skills" data-animate="fade-up">
        {SKILLS.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>

      <h2>Education &amp; Teaching</h2>
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
        <div>
          <p className="cv-edu-title">Teaching</p>
          <p className="cv-edu-meta">
            Senior Lecturer, UNSTA — five years
            <br />
            Lecturer, Foundry (University of Tasmania partnership)
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
