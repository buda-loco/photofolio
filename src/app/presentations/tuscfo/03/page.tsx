import type { Metadata } from 'next'
import Link from 'next/link'
import C3LogoEditor from '../_components/c3/C3LogoEditor'
import C3PatternGenerator from '../_components/c3/C3PatternGenerator'

export const metadata: Metadata = {
  title: 'Tus CFO — Concepto 03: La celda de siempre',
}

export default function TusCFOConcept03() {
  return (
    <>
      <header className="tc-concept-head">
        <Link href="/presentations/tuscfo" className="tc-credit">
          &larr; Todos los conceptos
        </Link>
        <p className="tc-eyebrow" style={{ marginTop: '1.5rem' }}>
          Concepto 03
        </p>
        <h1 className="tc-concept-name">La celda de siempre</h1>
        <p className="tc-concept-tagline">
          El wordmark encapsulado en la forma más familiar de todas: la celda
          de una planilla. Donde viven los números, vive la marca.
        </p>
      </header>

      <section className="tc-rationale">
        <p className="tc-eyebrow">Racional</p>
        <div className="tc-rationale-body">
          <p>
            Volver a lo más básico. Si hay un objeto que un CFO habita todos
            los días es la <strong>celda de planilla</strong> — y este
            concepto encapsula el wordmark exactamente ahí: una celda ancha
            para <strong>TUS</strong> arriba, y tres celdas para la{' '}
            <strong>C</strong>, la <strong>F</strong> y la <strong>O</strong>{' '}
            abajo. Familiar al instante, sin necesidad de explicación: la
            marca vive donde viven los números.
          </p>
          <p>
            La <strong>progresión de color</strong> entre celdas ordena la
            lectura — de la más oscura a la más clara, como una columna que se
            va iluminando — y le da al sistema un lenguaje propio que se
            extiende a patrones, cifras y aplicaciones. No es una dirección
            nueva: es la que ya había gustado en la exploración anterior de
            marca, ahora afinada y sistematizada para Tus CFO.
          </p>
        </div>
      </section>

      <div className="tc-brandmark">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/presentations/tuscfo/concept03.svg"
          alt="Lockup Tus CFO en celdas de planilla"
        />
      </div>

      <section className="tc-tool-section">
        <div className="tc-tool-head">
          <h2 className="tc-tool-title">Editor de logo</h2>
          <p className="tc-tool-hint">
            Probá el lockup apilado o en una sola fila. Pintá las celdas con
            una progresión de tonos automática o una por una, sumá degradados
            — y descargá lo que te guste en SVG o PNG Full HD.
          </p>
        </div>
        <C3LogoEditor />
      </section>

      <section className="tc-tool-section">
        <div className="tc-tool-head">
          <h2 className="tc-tool-title">Generador de patrones</h2>
          <p className="tc-tool-hint">
            Cifras gigantes construidas con celdas: escribí un número o
            dibujá directamente sobre el lienzo. Armá tu secuencia de
            colores, abrí huecos en el campo y generá variantes infinitas.
          </p>
        </div>
        <C3PatternGenerator />
      </section>

      <footer className="tc-foot">
        <span className="tc-credit">benjaminarnedo &mdash; Julio 2026</span>
        <Link href="/presentations/tuscfo/04" className="tc-credit">
          Siguiente: Concepto 04 &rarr;
        </Link>
      </footer>
    </>
  )
}
