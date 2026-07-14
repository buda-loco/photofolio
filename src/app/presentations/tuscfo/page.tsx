import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Tus CFO — Identidad Visual, Primera Propuesta',
}

const CONCEPTS = [
  {
    num: '01',
    href: '/presentations/tuscfo/01',
    img: '/presentations/tuscfo/concept01.svg',
    tagline: 'Tres letras, una moneda',
    desc: 'La C, la F y la O disueltas en un único círculo. Un monograma que, apenas cambia la perspectiva, se convierte en moneda — el objeto financiero por excelencia.',
  },
  {
    num: '02',
    href: '/presentations/tuscfo/02',
    img: '/presentations/tuscfo/concept02.svg',
    tagline: 'Los gráficos hablan',
    desc: 'Los tres elementos más comunes de las finanzas — torta, barras, medidor — deletrean CFO. El lenguaje visual del oficio convertido en marca.',
  },
  {
    num: '03',
    href: '/presentations/tuscfo/03',
    img: '/presentations/tuscfo/concept03.svg',
    tagline: 'La celda de siempre',
    desc: 'El wordmark encapsulado en algo inmediatamente familiar: celdas de planilla. Donde viven los números, ahora vive la marca.',
  },
  {
    num: '04',
    href: '/presentations/tuscfo/04',
    img: '/presentations/tuscfo/concept04.svg',
    tagline: 'El flujo',
    desc: 'La opción más sobria: la tipografía de Fer, el TUS habitando la C, y un sistema de flujos que muestra a dónde va la plata.',
  },
]

export default function TusCFOIndex() {
  return (
    <>
      <section className="tc-hero">
        <h1 className="tc-hero-title">
          Tus <em>CFO</em>
        </h1>
        <p className="tc-hero-sub">Identidad Visual &mdash; Primera Propuesta</p>
        <p className="tc-hero-intro">
          Cuatro direcciones. Cada una responde de forma distinta a la misma
          pregunta: ¿cómo se ve una marca que maneja tus números como si fueran
          propios?
        </p>
      </section>

      <section className="tc-brief">
        <p>
          <strong>Tus CFO</strong> es tu director financiero, sin el escritorio
          adentro de tu empresa. Pensado para negocios que todavía no llegan a
          un CFO de tiempo completo, pero que ya necesitan uno: alguien que
          mire los números con criterio, ordene y decida con vos. Nace como
          marca hermana del universo de Fer Bolagay, pero con una identidad
          propia — más institucional, más precisa, inconfundiblemente
          financiera. Las cuatro propuestas comparten un mismo sistema de color y
          están diseñadas para escalar: del logo al patrón, del patrón al
          sistema.
        </p>
      </section>

      <section className="tc-why">
        <p className="tc-eyebrow">Por qué esto no es un PDF</p>
        <div className="tc-why-body">
          <p>
            Una identidad no es un logo pegado en una lámina: es un{' '}
            <em>sistema que genera piezas</em>. Un PDF muestra resultados; acá
            vas a poder usar la máquina que los produce.
          </p>
          <p>
            Cada concepto viene con sus propios editores en vivo: uno para el
            logo y otro para el patrón/sistema. Tocá, mezclá paletas, generá
            versiones nuevas, descargá lo que te guste. Ninguna combinación
            rompe la marca — esa es justamente la prueba de que el sistema
            funciona.
          </p>
          <p>
            Jugá sin miedo. Es la forma más rápida de saber qué dirección te
            representa: no mirando la marca, sino usándola.
          </p>
        </div>
      </section>

      <section className="tc-cards" aria-label="Conceptos">
        {CONCEPTS.map((c) => (
          <Link key={c.num} href={c.href} className="tc-card">
            <span className="tc-card-num">CONCEPTO {c.num}</span>
            <span className="tc-card-mark">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.img} alt={`Concepto ${c.num} — ${c.tagline}`} />
            </span>
            <h2 className="tc-card-tagline">{c.tagline}</h2>
            <p className="tc-card-desc">{c.desc}</p>
            <span className="tc-card-link">
              Ver concepto
              <svg
                className="tc-card-arrow"
                width="22"
                height="10"
                viewBox="0 0 22 10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
                aria-hidden="true"
              >
                <line x1="0" y1="5" x2="20" y2="5" />
                <polyline points="16,1 21,5 16,9" />
              </svg>
            </span>
          </Link>
        ))}
      </section>

      <footer className="tc-foot">
        <span className="tc-credit">benjaminarnedo &mdash; Julio 2026</span>
        <span className="tc-credit">benjaminarnedo.com</span>
      </footer>
    </>
  )
}
