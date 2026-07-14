import type { Metadata } from 'next'
import Link from 'next/link'
import C2LogoEditor from '../_components/c2/C2LogoEditor'
import C2PatternGenerator from '../_components/c2/C2PatternGenerator'

export const metadata: Metadata = {
  title: 'Tus CFO — Concepto 02: Los gráficos hablan',
}

export default function TusCFOConcept02() {
  return (
    <>
      <header className="tc-concept-head">
        <Link href="/presentations/tuscfo" className="tc-credit">
          &larr; Todos los conceptos
        </Link>
        <p className="tc-eyebrow" style={{ marginTop: '1.5rem' }}>
          Concepto 02
        </p>
        <h1 className="tc-concept-name">Los gráficos hablan</h1>
        <p className="tc-concept-tagline">
          La torta, las barras y el medidor — los tres gráficos de siempre —
          puestos en fila deletrean CFO.
        </p>
      </header>

      <section className="tc-rationale">
        <p className="tc-eyebrow">Racional</p>
        <div className="tc-rationale-body">
          <p>
            Hay tres gráficos que cualquiera reconoce al instante como
            «finanzas»: la <strong>torta</strong>, las <strong>barras</strong>{' '}
            y el <strong>medidor</strong>. Este concepto los toma tal cual son
            — una torta con su porción servida, un gráfico de barras
            descendente, un dial con su aguja — y descubre que, puestos uno al
            lado del otro, deletrean <strong>CFO</strong>. La marca no ilustra
            lo que hace: lo dice en su propio idioma. Habla en gráficos.
          </p>
          <p>
            Y como cada letra es un gráfico de verdad, el logo es también un
            sistema vivo: la torta puede girar, las barras respirar, el
            medidor latir — sin dejar nunca de leerse como tipografía. El
            «Tus» se sumará al lockup a medida que avance la propuesta; por
            ahora el foco está en la sigla, que ya carga todo el significado.
          </p>
        </div>
      </section>

      <div className="tc-brandmark">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/presentations/tuscfo/concept02.svg"
          alt="Logo Tus CFO — torta, barras y medidor deletreando CFO"
        />
      </div>

      <section className="tc-tool-section">
        <div className="tc-tool-head">
          <h2 className="tc-tool-title">Editor de logo</h2>
          <p className="tc-tool-hint">
            Pintá el logo con dos colores de cada paleta o con uno solo,
            activá el degradado, pasalo de horizontal a vertical — y descargá
            lo que te guste en SVG o PNG Full HD.
          </p>
        </div>
        <C2LogoEditor />
      </section>

      <section className="tc-tool-section">
        <div className="tc-tool-head">
          <h2 className="tc-tool-title">Generador de patrones</h2>
          <p className="tc-tool-hint">
            Las tres letras sueltas en una grilla: la torta gira, las barras
            respiran, el medidor late. Probá tamaños variados y huecos,
            generá un patrón nuevo con cada click — y descargalo quieto en
            SVG o PNG.
          </p>
        </div>
        <C2PatternGenerator />
      </section>

      <footer className="tc-foot">
        <span className="tc-credit">benjaminarnedo &mdash; Julio 2026</span>
        <Link href="/presentations/tuscfo/03" className="tc-credit">
          Siguiente: Concepto 03 &rarr;
        </Link>
      </footer>
    </>
  )
}
