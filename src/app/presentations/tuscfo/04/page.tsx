import type { Metadata } from 'next'
import Link from 'next/link'
import C4LogoEditor from '../_components/c4/C4LogoEditor'
import C4FlowGenerator from '../_components/c4/C4FlowGenerator'

export const metadata: Metadata = {
  title: 'Tus CFO — Concepto 04: El flujo',
}

export default function TusCFOConcept04() {
  return (
    <>
      <header className="tc-concept-head">
        <Link href="/presentations/tuscfo" className="tc-credit">
          &larr; Todos los conceptos
        </Link>
        <p className="tc-eyebrow" style={{ marginTop: '1.5rem' }}>
          Concepto 04
        </p>
        <h1 className="tc-concept-name">El flujo</h1>
        <p className="tc-concept-tagline">
          El wordmark más sobrio de los cuatro — y atrás, un sistema vivo que
          te ayuda a ver a dónde va tu plata.
        </p>
      </header>

      <section className="tc-rationale">
        <p className="tc-eyebrow">Racional</p>
        <div className="tc-rationale-body">
          <p>
            La dirección más sobria y corporativa. El wordmark{' '}
            <strong>CFO</strong> usa la misma tipografía de la marca de Fer
            Bolagay — una familiaridad deliberada entre marcas hermanas — y el{' '}
            <strong>TUS</strong> habita el contrapunzón de la C: lo tuyo,
            literalmente, adentro de lo financiero. No grita; sostiene.
          </p>
          <p>
            Acá la personalidad no está en el logo sino en el sistema:{' '}
            <strong>flujos</strong> que muestran a dónde va el dinero — como
            un diagrama de cash-flow — llevados a un plano abstracto. Nacen de
            un origen, se dividen, cambian de color en cada división, y
            decoran los bordes de cualquier pieza: una tapa, una factura, una
            presentación.
          </p>
        </div>
      </section>

      <div className="tc-brandmark">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/presentations/tuscfo/concept04.svg"
          alt="Wordmark Tus CFO con el TUS adentro de la C"
        />
      </div>

      <section className="tc-tool-section">
        <div className="tc-tool-head">
          <h2 className="tc-tool-title">Editor de logo</h2>
          <p className="tc-tool-hint">
            Probá el wordmark en un solo color, en dúo (TUS vs CFO) o letra
            por letra. Cambiá el fondo, invertí la versión — y descargá lo
            que te guste en SVG o PNG Full HD.
          </p>
        </div>
        <C4LogoEditor />
      </section>

      <section className="tc-tool-section">
        <div className="tc-tool-head">
          <h2 className="tc-tool-title">Generador de flujos</h2>
          <p className="tc-tool-hint">
            Dibujá el recorrido de la plata: movés el origen, las divisiones
            y los finales, sumás ramas, jugás con degradados, fusiones y
            direcciones — y el flujo se redibuja en vivo. Cada variante es
            una pieza lista para exportar.
          </p>
        </div>
        <C4FlowGenerator />
      </section>

      <footer className="tc-foot">
        <span className="tc-credit">benjaminarnedo &mdash; Julio 2026</span>
        <Link href="/presentations/tuscfo" className="tc-credit">
          Volver al inicio &rarr;
        </Link>
      </footer>
    </>
  )
}
