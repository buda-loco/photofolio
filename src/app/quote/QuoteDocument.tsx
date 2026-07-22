"use client";

// The quote document — the thing a client can print, save as PDF, and take to
// whoever holds the budget. Also the last step of the wizard, so it has to read
// well on screen and on A4. Print rules live in quote.css under @media print.

import { RATE_LABELS, BUSINESS, CURRENCY, PRICING, QUOTE_VALID_DAYS, TURNAROUND, TRAVEL, LICENCES, CONTACT_PHONE } from '@/data/quoteCatalogue';
import type { ProjectOptions, QuoteTotals } from '@/lib/quotePricing';

const money = (n: number) => `$${Math.round(n).toLocaleString()}`;
const hrs = (n: number) => `${Math.round(n * 10) / 10}h`;

export interface QuoteMeta {
  number: string;
  issued: string;
  validUntil: string;
}

export interface QuoteClient {
  name: string;
  email: string;
  company: string;
  message: string;
}

interface Props {
  totals: QuoteTotals;
  options: ProjectOptions;
  client: QuoteClient;
  meta: QuoteMeta;
}

const find = <T extends { id: string; label: string }>(list: T[], id: string) =>
  list.find((o) => o.id === id) ?? list[0];

export default function QuoteDocument({ totals, options, client, meta }: Props) {
  const { lines } = totals;

  // Group lines under their discipline so the document reads like a scope of
  // work rather than a flat receipt.
  const groups = lines.reduce<{ label: string; lines: typeof lines }[]>((acc, l) => {
    const g = acc.find((x) => x.label === l.discipline.label);
    if (g) g.lines.push(l);
    else acc.push({ label: l.discipline.label, lines: [l] });
    return acc;
  }, []);

  const turnaround = find(TURNAROUND, options.turnaround);
  const travel = find(TRAVEL, options.travel);
  const licence = find(LICENCES, options.licence);
  const licensable = lines.some((l) => l.item.licensable);

  // Every non-line-item charge, as rows — only the ones that actually apply.
  const adjustments: { label: string; note?: string; amount: number; poa?: boolean }[] = [];
  if (totals.itemFees > 0) adjustments.push({ label: 'Equipment & hire', note: 'Hard costs attached to the items above', amount: totals.itemFees });
  if (totals.revisionsCost > 0) adjustments.push({ label: `Additional revision rounds (${options.extraRevisions})`, note: `${hrs(totals.revisionsHours)} beyond the ${PRICING.revisionsIncluded} included`, amount: totals.revisionsCost });
  if (totals.rushAmount > 0) adjustments.push({ label: `Rush fee — ${turnaround.label}`, note: `+${Math.round((totals.rushMult - 1) * 100)}% on production time`, amount: totals.rushAmount });
  if (totals.travelLabour > 0) adjustments.push({ label: `Travel time — ${travel.label}`, note: `${hrs(totals.travelHours)} billed at the shoot rate`, amount: totals.travelLabour });
  if (totals.travelExpenses > 0 || totals.travelPoa) adjustments.push({ label: 'Travel expenses', note: totals.travelPoa ? 'Confirmed once the destination is known' : 'Estimated — billed at cost', amount: totals.travelExpenses, poa: totals.travelPoa });
  if (licensable && (totals.licenceFee > 0 || totals.licencePoa)) adjustments.push({ label: `Usage licence — ${licence.label}`, note: licence.desc, amount: totals.licenceFee, poa: totals.licencePoa });
  if (totals.sourceFilesFee > 0) adjustments.push({ label: 'Working files released', note: 'Layered source and project files handed over', amount: totals.sourceFilesFee });

  return (
    <article className="qd-doc">
      {/* ── Letterhead ── */}
      <header className="qd-head">
        <div className="qd-from">
          <p className="qd-from-name">{BUSINESS.name}</p>
          <p className="qd-from-meta">
            {BUSINESS.role}<br />
            {BUSINESS.location}<br />
            {BUSINESS.email}
            {CONTACT_PHONE && <><br />{CONTACT_PHONE}</>}<br />
            {BUSINESS.site}
          </p>
        </div>
        <div className="qd-stamp">
          <p className="qd-stamp-title">Quote</p>
          <dl className="qd-stamp-list">
            <div><dt>Number</dt><dd>{meta.number}</dd></div>
            <div><dt>Issued</dt><dd>{meta.issued}</dd></div>
            <div><dt>Valid until</dt><dd>{meta.validUntil}</dd></div>
          </dl>
        </div>
      </header>

      {/* ── Who it's for ── */}
      <section className="qd-for">
        <span className="qd-label">Prepared for</span>
        <p className="qd-for-name">{client.company || client.name || 'Your project'}</p>
        <p className="qd-for-meta">
          {client.company && client.name ? `${client.name} · ` : ''}
          {client.email}
        </p>
        {client.message && <p className="qd-brief">“{client.message}”</p>}
      </section>

      {/* ── Scope ── */}
      <section className="qd-scope">
        <span className="qd-label">Scope of work</span>
        <table className="qd-table">
          <thead>
            <tr>
              <th scope="col">Item</th>
              <th scope="col" className="qd-num">Time</th>
              <th scope="col" className="qd-num">Amount</th>
            </tr>
          </thead>
          {groups.map((g) => (
            <tbody key={g.label}>
              <tr className="qd-group">
                <th scope="rowgroup" colSpan={3}>{g.label}</th>
              </tr>
              {g.lines.map((l) => (
                <tr key={l.item.id}>
                  <td>
                    <span className="qd-item-name">{l.item.name}</span>
                    {l.breakdown.spec.length > 0 && (
                      <span className="qd-item-spec">{l.breakdown.spec.join(' · ')}</span>
                    )}
                  </td>
                  <td className="qd-num qd-muted">
                    {hrs(l.breakdown.hours)}
                    <span className="qd-rate">{RATE_LABELS[l.item.rate]}</span>
                  </td>
                  <td className="qd-num">{money(l.breakdown.total)}</td>
                </tr>
              ))}
            </tbody>
          ))}

          {adjustments.length > 0 && (
            <tbody>
              <tr className="qd-group"><th scope="rowgroup" colSpan={3}>Project costs</th></tr>
              {adjustments.map((a) => (
                <tr key={a.label}>
                  <td>
                    <span className="qd-item-name">{a.label}</span>
                    {a.note && <span className="qd-item-spec">{a.note}</span>}
                  </td>
                  <td className="qd-num qd-muted">—</td>
                  <td className="qd-num">{a.poa ? 'POA' : money(a.amount)}</td>
                </tr>
              ))}
            </tbody>
          )}

          <tfoot>
            <tr className="qd-total-row">
              <th scope="row" colSpan={2}>Total</th>
              <td className="qd-num qd-total">{money(totals.total)} <small>{CURRENCY}</small></td>
            </tr>
            <tr>
              <th scope="row" colSpan={2} className="qd-muted">
                Deposit to book — {Math.round(PRICING.depositPercent * 100)}%
              </th>
              <td className="qd-num qd-muted">{money(totals.deposit)}</td>
            </tr>
          </tfoot>
        </table>

        <p className="qd-hours-note">
          {hrs(totals.hours + totals.revisionsHours + totals.travelHours)} of work in total.
          {' '}Rates: {Object.entries(PRICING.rates).map(([k, v]) => `${RATE_LABELS[k as keyof typeof RATE_LABELS]} $${v}/h`).join(' · ')}.
        </p>

        {totals.hasPoa && (
          <p className="qd-poa">
            Some items are marked POA — they can’t be fixed until we’ve confirmed the details.
            Everything else in this quote is firm.
          </p>
        )}
      </section>

      {/* ── Terms ── */}
      <section className="qd-terms">
        <span className="qd-label">Terms</span>
        <ul>
          <li>Valid for {QUOTE_VALID_DAYS} days from the issue date above.</li>
          <li>{Math.round(PRICING.depositPercent * 100)}% deposit confirms the booking; the balance is due on delivery.</li>
          <li>{PRICING.revisionsIncluded} rounds of revisions are included. Further rounds are billed at the applicable hourly rate.</li>
          <li>
            {options.sourceFiles
              ? 'Working files (layered source and project files) are included and released on final payment.'
              : 'Final deliverables are supplied in the agreed formats. Working files are not included; they can be released for an additional fee.'}
          </li>
          <li>
            {licensable
              ? `Usage is licensed as: ${licence.label.toLowerCase()} — ${licence.desc.toLowerCase()}`
              : 'Deliverables are licensed for the agreed purpose.'}
          </li>
          <li>Copyright remains with {BUSINESS.name} until final payment is received.</li>
          <li>Prices are in {CURRENCY}. This is a quote, not an invoice.</li>
        </ul>
      </section>

      <footer className="qd-foot">
        <p>{BUSINESS.name} · {BUSINESS.email} · {BUSINESS.site}</p>
        <p>Quote {meta.number} · issued {meta.issued}</p>
      </footer>
    </article>
  );
}
