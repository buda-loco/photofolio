"use client";

// The quote document — the thing a client can print, save as PDF, and take to
// whoever holds the budget. Also the last step of the wizard, so it has to read
// well on screen and on A4. Print rules live in quote.css under @media print.
//
// Everything regional (currency, prices, language) arrives via `bundle`; this
// component holds no locale-specific strings of its own.

import { whatsappLink } from '@/data/quoteCatalogue';
import type { QuoteBundle } from '@/data/quoteRegions';
import { parseISODate, type ProjectOptions, type QuoteTotals } from '@/lib/quotePricing';

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
  bundle: QuoteBundle;
  totals: QuoteTotals;
  options: ProjectOptions;
  client: QuoteClient;
  meta: QuoteMeta;
}

const find = <T extends { id: string; label: string; desc: string }>(list: T[], id: string) =>
  list.find((o) => o.id === id) ?? list[0];

export default function QuoteDocument({ bundle, totals, options, client, meta }: Props) {
  const { region, rateLabels, pricing, business, validDays, copy } = bundle;
  const t = copy.doc;
  const money = (n: number) => `${region.currencySymbol}${Math.round(n).toLocaleString(region.locale)}`;
  const hrs = (n: number) => `${Math.round(n * 10) / 10}h`;
  const longDate = (iso: string) => {
    const d = parseISODate(iso);
    // Rendered from the UTC parts the engine stored, so the printed date can't
    // slide a day in a different timezone.
    return d
      ? d.toLocaleDateString(region.locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
      : iso;
  };

  const { lines } = totals;

  // Group lines under their discipline so the document reads like a scope of
  // work rather than a flat receipt.
  const groups = lines.reduce<{ label: string; lines: typeof lines }[]>((acc, l) => {
    const g = acc.find((x) => x.label === l.discipline.label);
    if (g) g.lines.push(l);
    else acc.push({ label: l.discipline.label, lines: [l] });
    return acc;
  }, []);

  const licence = find(bundle.licences, options.licence);
  const travel = bundle.travel.length ? find(bundle.travel, options.travel) : null;
  const licensable = lines.some((l) => l.item.licensable);

  // Every non-line-item charge, as rows — only the ones that actually apply.
  const adjustments: { label: string; note?: string; amount: number; poa?: boolean }[] = [];
  if (totals.itemFees > 0) adjustments.push({ label: t.equipment, note: t.equipmentNote, amount: totals.itemFees });
  if (totals.revisionsCost > 0) adjustments.push({ label: t.revisions(options.extraRevisions), note: t.revisionsNote(hrs(totals.revisionsHours), pricing.revisionsIncluded), amount: totals.revisionsCost });
  if (totals.priorityAmount > 0) adjustments.push({ label: t.priority, note: t.priorityNote(Math.round(totals.priorityUplift * 100)), amount: totals.priorityAmount });
  if (totals.travelLabour > 0 && travel) adjustments.push({ label: t.travelTime(travel.label), note: t.travelTimeNote(hrs(totals.travelHours)), amount: totals.travelLabour });
  if (totals.travelExpenses > 0 || totals.travelPoa) adjustments.push({ label: t.travelExpenses, note: totals.travelPoa ? t.travelExpensesPoa : t.travelExpensesEstimated, amount: totals.travelExpenses, poa: totals.travelPoa });
  if (licensable && (totals.licenceFee > 0 || totals.licencePoa)) adjustments.push({ label: t.licence(licence.label), note: licence.desc, amount: totals.licenceFee, poa: totals.licencePoa });
  if (totals.sourceFilesFee > 0) adjustments.push({ label: t.sourceFiles, note: t.sourceFilesNote, amount: totals.sourceFilesFee });

  // Only advertise rates this region can actually book — the remote-only page
  // has no shoot items, so quoting a shoot rate there would be misleading.
  const availableRates = new Set(Object.values(bundle.allItems).map((e) => e.item.rate));
  const rateSummary = Object.entries(pricing.rates)
    .filter(([k]) => availableRates.has(k as keyof typeof pricing.rates))
    .map(([k, v]) => `${rateLabels[k as keyof typeof rateLabels]} ${region.currencySymbol}${v}/h`)
    .join(' · ');

  return (
    <article className="qd-doc" lang={region.locale}>
      {/* ── Letterhead ── */}
      <header className="qd-head">
        <div className="qd-from">
          <p className="qd-from-name">{business.name}</p>
          <p className="qd-from-meta">
            {copy.role}<br />
            {business.location}<br />
            {business.email}
            {/* Tappable on a phone, and the number still reads as plain text
                once the document is printed. */}
            {business.phone && (
              <>
                <br />
                <a className="qd-link" href={whatsappLink()}>{business.phone} · {t.whatsapp}</a>
              </>
            )}<br />
            {business.site}
          </p>
        </div>
        <div className="qd-stamp">
          <p className="qd-stamp-title">{t.stamp}</p>
          <dl className="qd-stamp-list">
            <div><dt>{t.number}</dt><dd>{meta.number}</dd></div>
            <div><dt>{t.issued}</dt><dd>{meta.issued}</dd></div>
            <div><dt>{t.validUntil}</dt><dd>{meta.validUntil}</dd></div>
          </dl>
        </div>
      </header>

      {/* ── Who it's for ── */}
      <section className="qd-for">
        <span className="qd-label">{t.preparedFor}</span>
        <p className="qd-for-name">{client.company || client.name || t.fallbackClient}</p>
        <p className="qd-for-meta">
          {client.company && client.name ? `${client.name} · ` : ''}
          {client.email}
        </p>
        {client.message && <p className="qd-brief">“{client.message}”</p>}
      </section>

      {/* ── Scope ── */}
      <section className="qd-scope">
        <span className="qd-label">{t.scopeOfWork}</span>
        <table className="qd-table">
          <thead>
            <tr>
              <th scope="col">{t.colItem}</th>
              <th scope="col" className="qd-num">{t.colTime}</th>
              <th scope="col" className="qd-num">{t.colAmount}</th>
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
                    {l.breakdown.reduced
                      ? t.reducedSpec(hrs(l.breakdown.hours), hrs(l.breakdown.recommendedHours))
                      : hrs(l.breakdown.hours)}
                    <span className="qd-rate">{rateLabels[l.item.rate]}</span>
                  </td>
                  <td className="qd-num">{money(l.breakdown.total)}</td>
                </tr>
              ))}
            </tbody>
          ))}

          {adjustments.length > 0 && (
            <tbody>
              <tr className="qd-group"><th scope="rowgroup" colSpan={3}>{t.projectCosts}</th></tr>
              {adjustments.map((a) => (
                <tr key={a.label}>
                  <td>
                    <span className="qd-item-name">{a.label}</span>
                    {a.note && <span className="qd-item-spec">{a.note}</span>}
                  </td>
                  <td className="qd-num qd-muted">—</td>
                  <td className="qd-num">{a.poa ? copy.project.poa : money(a.amount)}</td>
                </tr>
              ))}
            </tbody>
          )}

          <tfoot>
            <tr className="qd-total-row">
              <th scope="row" colSpan={2}>{t.total}</th>
              <td className="qd-num qd-total">{money(totals.total)} <small>{region.currency}</small></td>
            </tr>
            <tr>
              <th scope="row" colSpan={2} className="qd-muted">
                {t.deposit(Math.round(pricing.depositPercent * 100))}
              </th>
              <td className="qd-num qd-muted">{money(totals.deposit)}</td>
            </tr>
          </tfoot>
        </table>

        <p className="qd-hours-note">
          {t.hoursNote(hrs(totals.hours + totals.revisionsHours + totals.travelHours), rateSummary)}
        </p>

        {totals.reduced && (
          <p className="qd-reduced">
            {t.reducedNote(
              Math.round(totals.hoursFactor * 100),
              hrs(totals.hours),
              hrs(totals.recommendedHours),
            )}
          </p>
        )}

        {totals.hasPoa && <p className="qd-poa">{t.poaNote}</p>}
      </section>

      {/* ── Delivery ── */}
      {totals.schedule.workingDays > 0 && (
        <section className="qd-delivery">
          <span className="qd-label">{t.deliveryTitle}</span>
          <dl className="qd-delivery-list">
            {totals.schedule.start && (
              <div><dt>{t.deliveryStart}</dt><dd>{longDate(totals.schedule.start)}</dd></div>
            )}
            <div>
              <dt>{t.deliveryDays}</dt>
              <dd>{totals.schedule.workingDays} · {t.deliveryPace(totals.schedule.hoursPerDay)}</dd>
            </div>
            {totals.schedule.end && (
              <div className="qd-delivery-end">
                <dt>{t.deliveryEnd}</dt><dd>{longDate(totals.schedule.end)}</dd>
              </div>
            )}
          </dl>
          <p className="qd-delivery-note">{t.deliveryNote}</p>
        </section>
      )}

      {/* ── Terms ── */}
      <section className="qd-terms">
        <span className="qd-label">{t.terms}</span>
        <ul>
          {t.termsList({
            validDays,
            depositPercent: Math.round(pricing.depositPercent * 100),
            revisionsIncluded: pricing.revisionsIncluded,
            sourceFiles: options.sourceFiles,
            licensable,
            licenceLabel: licence.label,
            licenceDesc: licence.desc,
            businessName: business.name,
            currency: region.currency,
          }).map((line) => <li key={line}>{line}</li>)}
          {totals.reduced && <li>{t.reducedTerm(Math.round(totals.hoursFactor * 100))}</li>}
        </ul>
      </section>

      <footer className="qd-foot">
        <p>{business.name} · {business.email}{business.phone ? ` · ${business.phone}` : ''} · {business.site}</p>
        <p>{t.footerQuote(meta.number, meta.issued)}</p>
      </footer>
    </article>
  );
}
