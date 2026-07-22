// Every user-facing string in the quote builder, in one place per language.
//
// Interpolated strings are functions rather than templates with placeholders,
// so the compiler catches a missing argument instead of shipping "{name}".

import type { RateId } from '@/lib/quotePricing';

/** Translations for catalogue terms, keyed by the ids in quoteCatalogue.ts. */
export interface CatalogueCopy {
  disciplines?: Record<string, { label?: string; blurb?: string }>;
  items?: Record<string, {
    name?: string;
    desc?: string;
    params?: Record<string, {
      label?: string;
      unit?: string;
      help?: string;
      desc?: string;
      options?: Record<string, { label?: string; desc?: string }>;
    }>;
  }>;
  rateLabels?: Partial<Record<RateId, string>>;
  turnaround?: Record<string, { label?: string; desc?: string }>;
  travel?: Record<string, { label?: string; desc?: string }>;
  licences?: Record<string, { label?: string; desc?: string }>;
}

export interface QuoteCopy {
  meta: { title: string; description: string };
  /** Strapline under the name on the quote letterhead. */
  role: string;
  steps: [string, string, string, string, string];

  header: { eyebrow: string; title: string; lead: string };

  work: { title: string; sub: string };

  scope: {
    title: string;
    sub: string;
    setDetail: string;
    hideDetail: string;
    perHour: (rate: number) => string;
    includesFees: (amount: string) => string;
    fewer: (unit: string) => string;
    more: (unit: string) => string;
  };

  project: {
    title: string;
    sub: string;
    turnaround: string;
    turnaroundHelp: string;
    travel: string;
    travelHelp: string;
    licence: string;
    licenceHelp: string;
    included: string;
    poa: string;
    revisions: string;
    revisionsHelp: (included: number, hours: number, rate: number) => string;
    fewerRounds: string;
    moreRounds: string;
    sourceFiles: string;
    sourceFilesDesc: (percent: number, min: string) => string;
  };

  details: {
    title: string;
    sub: string;
    name: string;
    email: string;
    company: string;
    timeline: string;
    timelinePlaceholder: string;
    message: string;
    messagePlaceholder: string;
  };

  quote: {
    title: string;
    sub: (number: string, until: string) => string;
    copyLink: string;
    copied: string;
    savePdf: string;
    copyPrompt: string;
    sendError: (msg: string) => string;
    emailDirectly: string;
  };

  nav: { back: string; continue: string; seeQuote: string; send: string; sending: string };

  rail: {
    total: string;
    summary: (items: number, hours: string) => string;
    revisions: string;
    rush: string;
    travel: string;
    licence: string;
    sourceFiles: string;
    deposit: (amount: string) => string;
    poa: string;
  };

  sent: {
    label: string;
    title: (firstName: string, quoteNumber: string) => string;
    body: (total: string, currency: string, items: number, email: string) => string;
    savePdf: string;
    backToSite: string;
  };

  doc: {
    stamp: string;
    number: string;
    issued: string;
    validUntil: string;
    preparedFor: string;
    fallbackClient: string;
    scopeOfWork: string;
    colItem: string;
    colTime: string;
    colAmount: string;
    projectCosts: string;
    equipment: string;
    equipmentNote: string;
    revisions: (rounds: number) => string;
    revisionsNote: (hours: string, included: number) => string;
    rush: (label: string) => string;
    rushNote: (percent: number) => string;
    travelTime: (label: string) => string;
    travelTimeNote: (hours: string) => string;
    travelExpenses: string;
    travelExpensesEstimated: string;
    travelExpensesPoa: string;
    licence: (label: string) => string;
    sourceFiles: string;
    sourceFilesNote: string;
    total: string;
    deposit: (percent: number) => string;
    hoursNote: (hours: string, rates: string) => string;
    poaNote: string;
    terms: string;
    termsList: (o: {
      validDays: number;
      depositPercent: number;
      revisionsIncluded: number;
      sourceFiles: boolean;
      licensable: boolean;
      licenceLabel: string;
      licenceDesc: string;
      businessName: string;
      currency: string;
    }) => string[];
    footerQuote: (number: string, issued: string) => string;
  };
}

export const EN_COPY: QuoteCopy = {
  meta: {
    title: 'Build your quote',
    description: 'Build a transparent, itemised quote for any kind of design, photo, video or web work.',
  },
  role: 'Design · Photography · Motion',
  steps: ['Work', 'Scope', 'Project', 'Details', 'Quote'],

  header: {
    eyebrow: 'Quote builder',
    title: 'Build your quote',
    lead: 'Pick what you need, set the details, and get a real itemised quote — priced the same way I’d price it in a meeting. Print it, save it as a PDF, or send it straight to me.',
  },

  work: {
    title: 'What do you need?',
    sub: 'Pick everything that applies — you’ll configure the specifics next.',
  },

  scope: {
    title: 'Build the scope',
    sub: 'Select an item, then set its detail. Every number below feeds straight into the price.',
    setDetail: 'Set detail',
    hideDetail: 'Hide detail',
    perHour: (rate) => `$${rate}/h`,
    includesFees: (amount) => `Includes ${amount} in equipment and hire costs.`,
    fewer: (unit) => `Fewer ${unit}s`,
    more: (unit) => `More ${unit}s`,
  },

  project: {
    title: 'Project conditions',
    sub: 'The things that change a price without changing the deliverables.',
    turnaround: 'Turnaround',
    turnaroundHelp: 'A rush fee applies to production time only — never to travel, equipment or licensing.',
    travel: 'Where’s the shoot?',
    travelHelp: 'Travel time is billed at the shoot rate; flights and accommodation are estimated and billed at cost. Only applies because you’ve selected work that puts me on location.',
    licence: 'Usage licence',
    licenceHelp: 'Where and for how long the shot work runs. Only applies because you’ve selected shoot or edit work.',
    included: 'Included',
    poa: 'POA',
    revisions: 'Extra revision rounds',
    revisionsHelp: (included, hours, rate) =>
      `${included} rounds are already included. Each extra round is ${hours}h at $${rate}/h.`,
    fewerRounds: 'Fewer rounds',
    moreRounds: 'More rounds',
    sourceFiles: 'Keep the working files',
    sourceFilesDesc: (percent, min) =>
      `Layered source files and project files, not just the final exports — so another designer can pick the work up. ${percent}% of production time, minimum ${min}.`,
  },

  details: {
    title: 'Your details',
    sub: 'These go on the quote document, and let me send you a copy.',
    name: 'Name *',
    email: 'Email *',
    company: 'Company',
    timeline: 'When do you need it?',
    timelinePlaceholder: 'e.g. mid-August',
    message: 'Anything I should know?',
    messagePlaceholder: 'A sentence about the project helps me sanity-check the quote.',
  },

  quote: {
    title: 'Your quote',
    sub: (number, until) => `Quote ${number} · valid until ${until}`,
    copyLink: 'Copy link',
    copied: '✓ Link copied',
    savePdf: 'Save as PDF',
    copyPrompt: 'Copy your quote link:',
    sendError: (msg) => `Couldn’t send (${msg}).`,
    emailDirectly: 'Email it to me directly →',
  },

  nav: {
    back: 'Back',
    continue: 'Continue',
    seeQuote: 'See my quote',
    send: 'Send it to Benjamin',
    sending: 'Sending…',
  },

  rail: {
    total: 'Running total',
    summary: (items, hours) => `${items} item${items === 1 ? '' : 's'} · ${hours}`,
    revisions: 'Extra revisions',
    rush: 'Rush fee',
    travel: 'Travel',
    licence: 'Usage licence',
    sourceFiles: 'Working files',
    deposit: (amount) => `${amount} deposit to book`,
    poa: 'Some items are POA',
  },

  sent: {
    label: 'Sent',
    title: (first, number) => `Thanks, ${first} — quote ${number} is on its way.`,
    body: (total, currency, items, email) =>
      `I’ve got your ${total} ${currency} quote (${items} item${items === 1 ? '' : 's'}) and sent a copy to ${email}. I’ll be in touch shortly.`,
    savePdf: 'Save as PDF',
    backToSite: 'Back to site',
  },

  doc: {
    stamp: 'Quote',
    number: 'Number',
    issued: 'Issued',
    validUntil: 'Valid until',
    preparedFor: 'Prepared for',
    fallbackClient: 'Your project',
    scopeOfWork: 'Scope of work',
    colItem: 'Item',
    colTime: 'Time',
    colAmount: 'Amount',
    projectCosts: 'Project costs',
    equipment: 'Equipment & hire',
    equipmentNote: 'Hard costs attached to the items above',
    revisions: (rounds) => `Additional revision rounds (${rounds})`,
    revisionsNote: (hours, included) => `${hours} beyond the ${included} included`,
    rush: (label) => `Rush fee — ${label}`,
    rushNote: (percent) => `+${percent}% on production time`,
    travelTime: (label) => `Travel time — ${label}`,
    travelTimeNote: (hours) => `${hours} billed at the shoot rate`,
    travelExpenses: 'Travel expenses',
    travelExpensesEstimated: 'Estimated — billed at cost',
    travelExpensesPoa: 'Confirmed once the destination is known',
    licence: (label) => `Usage licence — ${label}`,
    sourceFiles: 'Working files released',
    sourceFilesNote: 'Layered source and project files handed over',
    total: 'Total',
    deposit: (percent) => `Deposit to book — ${percent}%`,
    hoursNote: (hours, rates) => `${hours} of work in total. Rates: ${rates}.`,
    poaNote: 'Some items are marked POA — they can’t be fixed until we’ve confirmed the details. Everything else in this quote is firm.',
    terms: 'Terms',
    termsList: (o) => [
      `Valid for ${o.validDays} days from the issue date above.`,
      `${o.depositPercent}% deposit confirms the booking; the balance is due on delivery.`,
      `${o.revisionsIncluded} rounds of revisions are included. Further rounds are billed at the applicable hourly rate.`,
      o.sourceFiles
        ? 'Working files (layered source and project files) are included and released on final payment.'
        : 'Final deliverables are supplied in the agreed formats. Working files are not included; they can be released for an additional fee.',
      o.licensable
        ? `Usage is licensed as: ${o.licenceLabel.toLowerCase()} — ${o.licenceDesc.toLowerCase()}`
        : 'Deliverables are licensed for the agreed purpose.',
      `Copyright remains with ${o.businessName} until final payment is received.`,
      `Prices are in ${o.currency}. This is a quote, not an invoice.`,
    ],
    footerQuote: (number, issued) => `Quote ${number} · issued ${issued}`,
  },
};
