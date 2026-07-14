import type { Metadata } from 'next'
import Link from 'next/link'
import C1LogoEditor from '../_components/c1/C1LogoEditor'
import C1PatternGenerator from '../_components/c1/C1PatternGenerator'
import C1Coin3D from '../_components/c1/C1Coin3D'

export const metadata: Metadata = {
  title: 'Tus CFO — Concepto 01: Tres letras, una moneda',
}

export default function TusCFOConcept01() {
  return (
    <>
      <header className="tc-concept-head">
        <Link href="/presentations/tuscfo" className="tc-credit">
          &larr; Todos los conceptos
        </Link>
        <p className="tc-eyebrow" style={{ marginTop: '1.5rem' }}>
          Concepto 01
        </p>
        <h1 className="tc-concept-name">Tres letras, una moneda</h1>
        <p className="tc-concept-tagline">
          La C, la F y la O disueltas en un único círculo. Y apenas el círculo
          gana perspectiva, aparece lo inevitable: una moneda.
        </p>
      </header>

      <section className="tc-rationale">
        <p className="tc-eyebrow">Racional</p>
        <div className="tc-rationale-body">
          <p>
            Un CFO ordena lo complejo hasta volverlo simple. Este monograma
            hace exactamente eso: toma las formas básicas de la{' '}
            <strong>C</strong>, la <strong>F</strong> y la <strong>O</strong> y
            las resuelve en una sola figura circular — compacta, geométrica,
            inconfundible a cualquier tamaño.
          </p>
          <p>
            Y hay un segundo regalo escondido: con un simple cambio de
            perspectiva, el círculo se convierte en <strong>moneda</strong>. El
            objeto financiero más universal que existe, sin dibujar un solo
            signo de pesos. Esa doble lectura — monograma de frente, moneda en
            perspectiva — le da a la marca un sistema entero de aplicaciones.
          </p>
        </div>
      </section>

      <div className="tc-brandmark">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/presentations/tuscfo/concept013d.svg"
          alt="Monograma Tus CFO en perspectiva de moneda"
        />
      </div>

      <section className="tc-tool-section">
        <div className="tc-tool-head">
          <h2 className="tc-tool-title">Editor de logo</h2>
          <p className="tc-tool-hint">
            Pintá el monograma entero o por partes, con las tres paletas y sus
            tonos. Probá fondos, tamaños, rotaciones — y descargá lo que te
            guste en SVG o PNG Full HD.
          </p>
        </div>
        <C1LogoEditor />
      </section>

      <section className="tc-tool-section">
        <div className="tc-tool-head">
          <h2 className="tc-tool-title">Generador de patrones</h2>
          <p className="tc-tool-hint">
            Las piezas que componen el logo, sueltas en una grilla: rotación y
            color al azar, un patrón nuevo con cada click. El sistema
            generándose a sí mismo.
          </p>
        </div>
        <C1PatternGenerator />
      </section>

      <section className="tc-tool-section">
        <div className="tc-tool-head">
          <h2 className="tc-tool-title">La moneda</h2>
          <p className="tc-tool-hint">
            El monograma acuñado en 3D. Arrastrá para girarla, elegí los
            colores de cara, relieve y canto, y exportá un PNG con fondo
            transparente desde cualquier ángulo.
          </p>
        </div>
        <C1Coin3D />
      </section>

      <footer className="tc-foot">
        <span className="tc-credit">benjaminarnedo &mdash; Julio 2026</span>
        <Link href="/presentations/tuscfo/02" className="tc-credit">
          Siguiente: Concepto 02 &rarr;
        </Link>
      </footer>
    </>
  )
}
