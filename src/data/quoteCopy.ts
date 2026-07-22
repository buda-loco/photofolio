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

  presets: {
    label: string;
    help: string;
    custom: string;
    minimum: { label: string; desc: string };
    recommended: { label: string; desc: string };
    complete: { label: string; desc: string };
  };

  scope: {
    title: string;
    sub: string;
    setDetail: string;
    hideDetail: string;
    perHour: (rate: number) => string;
    includesFees: (amount: string) => string;
    fewer: (unit: string) => string;
    more: (unit: string) => string;
    hours: string;
    hoursFull: string;
    hoursOf: (bought: string, recommended: string) => string;
    hoursReduced: (percent: number) => string;
    lessTime: string;
    moreTime: string;
  };

  project: {
    title: string;
    sub: string;
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
    hours: string;
    hoursHelp: (floor: number) => string;
    hoursRecommended: (hours: string, amount: string) => string;
    hoursBuying: (hours: string, percent: number) => string;
    hoursAtFloor: string;
  };

  /** One block, at the end of the project step. */
  delivery: {
    title: string;
    sub: string;
    priority: string;
    priorityDesc: (standard: number, priority: number, uplift: number) => string;
    pace: (hoursPerDay: number) => string;
    startLabel: string;
    startHelp: (leadDays: number) => string;
    duration: (days: number) => string;
    deliveryLabel: string;
    pickDate: string;
    note: string;
  };

  details: {
    title: string;
    sub: string;
    name: string;
    email: string;
    company: string;
    nameRequired: string;
    emailInvalid: string;
    message: string;
    messagePlaceholder: string;
  };

  quote: {
    title: string;
    sub: (number: string, until: string) => string;
    copyLink: string;
    copied: string;
    savePdf: string;
    whatsapp: string;
    whatsappMessage: (quoteNumber: string, total: string, currency: string) => string;
    copyPrompt: string;
    promoLabel: string;
    promoPlaceholder: string;
    promoApplied: (label: string, percent: number) => string;
    promoInvalid: string;
    promoHelp: string;
    /** The hard-cost caveat — only shown once a code actually lands. */
    promoScope: string;
    sendError: (msg: string) => string;
    emailDirectly: string;
    needDetails: string;
  };

  nav: {
    back: string; continue: string; seeQuote: string; send: string; sending: string;
    needWork: string; needItems: string;
  };

  rail: {
    total: string;
    summary: (items: number, hours: string) => string;
    revisions: string;
    priority: string;
    travel: string;
    licence: string;
    sourceFiles: string;
    discount: string;
    delivery: (days: number) => string;
    deposit: (amount: string) => string;
    poa: string;
    reduced: (percent: number, recommended: string) => string;
  };

  sent: {
    label: string;
    title: (firstName: string, quoteNumber: string) => string;
    body: (total: string, currency: string, items: number, email: string) => string;
    savePdf: string;
    backToSite: string;
    whatsapp: string;
  };

  doc: {
    stamp: string;
    number: string;
    issued: string;
    validUntil: string;
    whatsapp: string;
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
    priority: string;
    priorityNote: (percent: number) => string;
    deliveryTitle: string;
    deliveryStart: string;
    deliveryEnd: string;
    deliveryDays: string;
    deliveryPace: (hoursPerDay: number) => string;
    deliveryNote: string;
    travelTime: (label: string) => string;
    travelTimeNote: (hours: string) => string;
    travelExpenses: string;
    travelExpensesEstimated: string;
    travelExpensesPoa: string;
    licence: (label: string) => string;
    sourceFiles: string;
    sourceFilesNote: string;
    discount: (label: string, percent: number) => string;
    discountNote: string;
    reducedSpec: (bought: string, recommended: string) => string;
    reducedNote: (percent: number, bought: string, recommended: string) => string;
    reducedTerm: (percent: number) => string;
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

  presets: {
    label: 'How thorough?',
    help: 'Sets every item at once, and anything you add next. Fine-tune individual items underneath.',
    custom: 'Custom — you’ve adjusted individual items.',
    minimum: {
      label: 'Bare minimum',
      desc: 'The leanest version that still does the job. Fewer of everything, simplest options, no extras.',
    },
    recommended: {
      label: 'Recommended',
      desc: 'What I’d actually propose for a job like this.',
    },
    complete: {
      label: 'Complete',
      desc: 'The fullest version — more of everything, richest options, every extra included.',
    },
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
    hours: 'Time on this',
    hoursFull: 'Full recommended time',
    hoursOf: (bought, recommended) => `${bought} of ${recommended} recommended`,
    hoursReduced: (percent) => `${percent}% of the recommended time — reduced depth`,
    lessTime: 'Less time',
    moreTime: 'More time',
  },

  project: {
    title: 'Project conditions',
    sub: 'The things that change a price without changing the deliverables.',
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
    hours: 'How many hours are you buying?',
    hoursHelp: (floor) =>
      `The recommendation is what the scope you built actually needs. If the budget won’t stretch, buy fewer hours — every deliverable gets proportionally less time, so expect fewer concepts, fewer passes and less polish. You can fine-tune individual items back on the Scope step. ${floor}% is the floor; below that the work stops being deliverable and we should talk instead.`,
    hoursRecommended: (hours, amount) => `Recommended: ${hours} · ${amount}`,
    hoursBuying: (hours, percent) => `Buying ${hours} — ${percent}% of the recommendation`,
    hoursAtFloor: 'This is the least I can deliver this scope on. Less than that, let’s talk about cutting deliverables instead.',
  },

  delivery: {
    title: 'Delivery',
    sub: 'Roughly when the work lands.',
    priority: 'Priority — make it the only project of the day',
    priorityDesc: (standard, priority, uplift) =>
      `Standard work gets ${standard} hours a day and shares the week with other projects. Priority makes yours the only thing on the desk at ${priority} hours a day, for ${uplift}% more.`,
    pace: (hoursPerDay) => `${hoursPerDay} hours a day`,
    startLabel: 'Start date',
    startHelp: (leadDays) => `The earliest I can start is ${leadDays} days from today.`,
    duration: (days) => `${days} working day${days === 1 ? '' : 's'}`,
    deliveryLabel: 'Estimated delivery',
    pickDate: 'Pick a start date to see when the work would land.',
    note: 'These timings are a rough calculation from the hours in this quote, spread over working days — an indication, not a commitment. The real schedule depends on how quickly feedback comes back and what else is booked at the time.',
  },

  details: {
    title: 'Your details',
    sub: 'These go on the quote document, and let me send you a copy.',
    name: 'Name *',
    email: 'Email *',
    company: 'Company',
    nameRequired: 'I need a name to put on the quote.',
    emailInvalid: 'Check the email — it should look like name@example.com',
    message: 'Anything I should know?',
    messagePlaceholder: 'A sentence about the project helps me sanity-check the quote.',
  },

  quote: {
    title: 'Your quote',
    sub: (number, until) => `Quote ${number} · valid until ${until}`,
    copyLink: 'Copy link',
    copied: '✓ Link copied',
    savePdf: 'Save as PDF',
    whatsapp: 'WhatsApp',
    whatsappMessage: (number, total, currency) =>
      `Hi Benjamin — I built quote ${number} on your site (${total} ${currency}). Can we talk it through?`,
    copyPrompt: 'Copy your quote link:',
    promoLabel: 'Do we know each other?',
    // Never an example that works — the placeholder was handing out a live code.
    promoPlaceholder: 'Try a code…',
    promoApplied: (label, percent) => `${label} — ${percent}% off, because you asked nicely`,
    promoInvalid: 'Not one of mine. Worth double-checking the spelling.',
    promoHelp: 'Mates, regulars and anyone I’ve shared a beer with tend to know the words. If that’s you, they go here.',
    promoScope: 'Comes off my time. Equipment hire and travel are still billed at cost — even for you.',
    sendError: (msg) => `Couldn’t send (${msg}).`,
    emailDirectly: 'Email it to me directly →',
    needDetails: 'Add your name and email to send this →',
  },

  nav: {
    back: 'Back',
    continue: 'Continue',
    seeQuote: 'See my quote',
    send: 'Send it to Benjamin',
    sending: 'Sending…',
    needWork: 'Pick at least one kind of work to continue →',
    needItems: 'Select at least one item to continue →',
  },

  rail: {
    total: 'Running total',
    summary: (items, hours) => `${items} item${items === 1 ? '' : 's'} · ${hours}`,
    revisions: 'Extra revisions',
    priority: 'Priority',
    travel: 'Travel',
    licence: 'Usage licence',
    sourceFiles: 'Working files',
    discount: 'Discount',
    // No "~" — Adrianna's tilde sits high enough to read as a diaeresis.
    delivery: (days) => `${days} working day${days === 1 ? '' : 's'} of work`,
    deposit: (amount) => `${amount} deposit to book`,
    poa: 'Some items are POA',
    reduced: (percent, recommended) => `${percent}% of the recommended ${recommended}`,
  },

  sent: {
    label: 'Sent',
    title: (first, number) => `Thanks, ${first} — quote ${number} is on its way.`,
    body: (total, currency, items, email) =>
      `I’ve got your ${total} ${currency} quote (${items} item${items === 1 ? '' : 's'}) and sent a copy to ${email}. I’ll be in touch shortly.`,
    savePdf: 'Save as PDF',
    backToSite: 'Back to site',
    whatsapp: 'Message on WhatsApp',
  },

  doc: {
    stamp: 'Quote',
    whatsapp: 'WhatsApp',
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
    priority: 'Priority — sole focus',
    priorityNote: (percent) => `+${percent}% on production time`,
    deliveryTitle: 'Delivery',
    deliveryStart: 'Start',
    deliveryEnd: 'Estimated delivery',
    deliveryDays: 'Working days',
    deliveryPace: (hoursPerDay) => `${hoursPerDay} hours a day`,
    deliveryNote: 'Timings are a rough calculation from the hours above, spread over working days. They are an indication, not a commitment, and assume feedback comes back promptly.',
    travelTime: (label) => `Travel time — ${label}`,
    travelTimeNote: (hours) => `${hours} billed at the shoot rate`,
    travelExpenses: 'Travel expenses',
    travelExpensesEstimated: 'Estimated — billed at cost',
    travelExpensesPoa: 'Confirmed once the destination is known',
    licence: (label) => `Usage licence — ${label}`,
    sourceFiles: 'Working files released',
    sourceFilesNote: 'Layered source and project files handed over',
    discount: (label, percent) => `${label} — ${percent}% off`,
    discountNote: 'Applied to time and margin, not to costs billed at cost',
    reducedSpec: (bought, recommended) => `${bought} of ${recommended} recommended`,
    reducedNote: (percent, bought, recommended) =>
      `This quote is scoped to ${bought} of the ${recommended} recommended — ${percent}% of the time the work really needs. The deliverables are the same list, but each gets proportionally less time: fewer concepts, fewer passes, less polish.`,
    reducedTerm: (percent) =>
      `Scoped at ${percent}% of the recommended time. Deliverables are reduced in depth accordingly, not in number.`,
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
