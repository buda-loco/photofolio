// Spanish (Argentina) copy for the quote builder at /cotizacion.
//
// Voseo throughout — "elegí", "necesitás", "podés" — matching the register of
// the Tus CFO deck. Prices are USD; the symbol is "US$" because a bare "$"
// reads as pesos in Argentina.

import type { CatalogueCopy, QuoteCopy } from './quoteCopy';

/* ═══════════════════ Catalogue terms ═══════════════════ */

export const ES_CATALOGUE: CatalogueCopy = {
  rateLabels: {
    design: 'Diseño',
    post: 'Postproducción',
    shoot: 'Rodaje',
    build: 'Desarrollo',
    motion: 'Motion',
  },

  disciplines: {
    'graphic-design': {
      label: 'Diseño gráfico',
      blurb: 'Editorial, piezas de marca, campaña e impresión — todo tipo de diseño gráfico.',
    },
    branding: {
      label: 'Branding',
      blurb: 'Logos, sistemas de identidad y el manual que los mantiene coherentes.',
    },
    photography: {
      label: 'Fotografía',
      blurb: 'Edición, retoque y entrega sobre el material que ya tenés.',
    },
    videography: {
      label: 'Video',
      blurb: 'Guion, edición y versiones — sobre el material que ya tenés.',
    },
    post: {
      label: 'Postproducción',
      blurb: 'Edición, corrección de color, sonido y retoque sobre tu material.',
    },
    motion: {
      label: 'Motion graphics',
      blurb: 'Animación — sobre tu diseño, o diseñando yo las piezas.',
    },
    web: {
      label: 'Diseño web',
      blurb: 'Sitios estáticos, desarrollos a medida, WordPress y consultoría UX/UI.',
    },
    consultancy: {
      label: 'Consultoría de diseño',
      blurb: 'Branding, diseño y señalética — sin necesidad de un proyecto completo.',
    },
    'event-visuals': {
      label: 'Visuales para eventos',
      blurb: 'Contenido para pantallas — corporativo, bandas y eventos.',
    },
  },

  items: {
    /* ── Diseño gráfico ── */
    'gd-editorial': {
      name: 'Diseño editorial y de publicaciones',
      desc: 'Revistas, memorias, libros, catálogos.',
      params: {
        pages: { label: 'Páginas', unit: 'página' },
        scope: {
          label: 'Alcance',
          options: {
            template: { label: 'Sólo páginas maestras', desc: 'Diseño el sistema y vos volcás el contenido.' },
            full: { label: 'Diagramación completa', desc: 'Cada página diagramada y compuesta.' },
            'full-art': { label: 'Diagramación + dirección de arte', desc: 'Incluye búsqueda y encargo de imágenes.' },
          },
        },
      },
    },
    'gd-collateral': {
      name: 'Piezas de marketing y marca',
      desc: 'Flyers, afiches, folletos, papelería.',
      params: {
        pieces: { label: 'Piezas', unit: 'pieza' },
        complexity: {
          label: 'Complejidad',
          options: {
            simple: { label: 'Con plantilla', desc: 'Trabajando dentro de una identidad existente.' },
            standard: { label: 'Estándar' },
            bespoke: { label: 'A medida', desc: 'Concepto original para cada pieza.' },
          },
        },
      },
    },
    'gd-presentation': {
      name: 'Diseño de presentaciones',
      params: {
        slides: { label: 'Diapositivas', unit: 'diapositiva' },
        scope: {
          label: 'Alcance',
          options: {
            template: { label: 'Plantilla reutilizable', desc: 'Diapositivas maestras que completás vos.' },
            full: { label: 'Presentación completa' },
          },
        },
      },
    },
    'gd-social': {
      name: 'Piezas de redes y campaña',
      params: {
        assets: { label: 'Piezas', unit: 'pieza' },
        ratios: { label: 'Adaptadas a todos los formatos', desc: 'Feed, historias y horizontal para cada pieza.' },
      },
    },
    'gd-artwork': {
      name: 'Arte final y producción gráfica',
      desc: 'Preflight, demasías, separación de color, contacto con la imprenta.',
      params: { artworks: { label: 'Artes finales', unit: 'arte final' } },
    },

    /* ── Branding ── */
    'br-discovery': {
      name: 'Descubrimiento y estrategia de marca',
      desc: 'Taller, posicionamiento, referencias, dirección creativa.',
      params: {
        depth: {
          label: 'Profundidad',
          options: {
            light: { label: 'Llamada de brief', desc: 'Una sesión y dirección por escrito.' },
            standard: { label: 'Taller', desc: 'Medio día de taller más el documento de estrategia.' },
            deep: { label: 'Estrategia completa', desc: 'Investigación, auditoría, posicionamiento y mensajes.' },
          },
        },
      },
    },
    'br-logo': {
      name: 'Logo e isologotipo',
      desc: 'Marca principal, versiones y variantes responsivas.',
      params: {
        routes: {
          label: 'Rutas conceptuales',
          help: 'Cuántas direcciones distintas desarrollo antes de elegir una.',
          options: {
            '1': { label: '1 ruta', desc: 'Enfocada — para un brief claro.' },
            '2': { label: '2 rutas' },
            '3': { label: '3 rutas', desc: 'La exploración más amplia.' },
          },
        },
        lockups: { label: 'Set completo de versiones', desc: 'Horizontal, apilada, sólo isotipo, monocromo e invertida.' },
      },
    },
    'br-identity': {
      name: 'Sistema de identidad visual',
      desc: 'Tipografía, color, recursos gráficos, dirección de arte.',
      params: {
        scope: {
          label: 'Alcance',
          options: {
            core: { label: 'Esencial', desc: 'Tipografía y color.' },
            standard: { label: 'Estándar', desc: 'Tipografía, color, recursos gráficos y dirección de imagen.' },
            expanded: { label: 'Ampliado', desc: 'Suma patrones, ilustración y principios de movimiento.' },
          },
        },
      },
    },
    'br-manual': {
      name: 'Manual de identidad',
      desc: 'El documento que mantiene a todos dentro de la marca.',
      params: {
        pages: { label: 'Páginas', unit: 'página' },
        depth: {
          label: 'Profundidad',
          options: {
            essential: { label: 'Esencial', desc: 'Logo, color, tipografía, usos correctos e incorrectos.' },
            standard: { label: 'Manual estándar' },
            full: { label: 'Brand book completo', desc: 'Estrategia, tono, aplicaciones y plantillas.' },
          },
        },
      },
    },
    'br-applications': {
      name: 'Aplicaciones de identidad',
      desc: 'La identidad bajada a puntos de contacto reales.',
      params: { applications: { label: 'Aplicaciones', unit: 'aplicación' } },
    },

    /* ── Fotografía ── */
    'ph-preprod': {
      name: 'Preproducción y planificación',
      desc: 'Brief, guion de tomas, scouting, cronograma.',
      params: {
        scale: {
          label: 'Escala',
          options: {
            light: { label: 'Simple', desc: 'Brief y guion de tomas.' },
            standard: { label: 'Estándar' },
            complex: { label: 'Compleja', desc: 'Casting, locaciones, permisos, estilismo.' },
          },
        },
      },
    },
    'ph-shoot': {
      name: 'Rodaje',
      desc: 'Tiempo en locación o en estudio.',
      params: {
        hours: { label: 'Tiempo en el día', unit: 'hora' },
        crew: {
          label: 'Equipo',
          help: 'Más manos en el día implica más costo, pero un rodaje más rápido y controlado.',
          options: {
            solo: { label: 'Sólo yo', desc: 'Operador solo.' },
            assist: { label: '+ Asistente', desc: 'Un par de manos extra para luces y equipo.' },
            full: { label: 'Equipo completo', desc: 'Segundo operador más asistente.' },
          },
        },
        lighting: { label: 'Equipo de luces y grip', desc: 'Flashes, modificadores, trípodes.' },
        studio: { label: 'Alquiler de estudio', desc: 'Estimado — se confirma al elegir el espacio.' },
      },
    },
    'ph-edit': {
      name: 'Selección, edición y retoque',
      params: {
        images: { label: 'Imágenes finales', unit: 'imagen' },
        retouch: {
          label: 'Nivel de retoque',
          options: {
            standard: { label: 'Estándar', desc: 'Color, recorte, limpieza.' },
            advanced: { label: 'Avanzado', desc: 'Retoque de piel, producto y detalle.' },
            composite: { label: 'Composición', desc: 'Montajes de varias tomas y manipulación intensa.' },
          },
        },
      },
    },
    'ph-delivery': {
      name: 'Entrega y galería',
      desc: 'Exportaciones, versiones web e impresión, galería online.',
    },

    /* ── Video ── */
    'vd-preprod': {
      name: 'Concepto, tratamiento y planificación',
      params: {
        scale: {
          label: 'Escala',
          options: {
            light: { label: 'Simple', desc: 'Brief, guion de tomas, cronograma.' },
            standard: { label: 'Estándar', desc: 'Tratamiento, storyboard, cronograma.' },
            complex: { label: 'Compleja', desc: 'Guion, casting, locaciones, permisos.' },
          },
        },
      },
    },
    'vd-shoot': {
      name: 'Rodaje',
      desc: 'Tiempo de cámara en locación o en estudio.',
      params: {
        hours: { label: 'Tiempo en el día', unit: 'hora' },
        crew: {
          label: 'Equipo',
          help: 'Más manos en el día implica más costo, pero un rodaje más rápido y controlado.',
          options: {
            solo: { label: 'Sólo yo', desc: 'Operador solo.' },
            assist: { label: '+ Asistente', desc: 'Un par de manos extra para luces y equipo.' },
            full: { label: 'Equipo completo', desc: 'Segundo operador más asistente.' },
          },
        },
        lighting: { label: 'Equipo de luces y grip' },
        audio: { label: 'Equipo de audio profesional', desc: 'Micrófonos inalámbricos, caña, grabador.' },
        gimbal: { label: 'Gimbal / equipo de movimiento' },
        interviews: { label: 'Set de entrevista', desc: 'Luz y sonido para entrevista a dos cámaras.' },
      },
    },
    'vd-edit': {
      name: 'Edición',
      desc: 'Armado, relato, ritmo, música y máster de entrega.',
      params: {
        minutes: { label: 'Duración final', unit: 'minuto' },
        complexity: {
          label: 'Complejidad de edición',
          options: {
            simple: { label: 'Simple', desc: 'Una cámara, poco material.' },
            standard: { label: 'Estándar' },
            complex: { label: 'Compleja', desc: 'Multicámara, mucho material, relato en capas.' },
          },
        },
      },
    },
    'vd-cutdowns': {
      name: 'Versiones y cortes',
      desc: 'Cortes para redes, formatos alternativos, versiones subtituladas.',
      params: {
        versions: { label: 'Versiones', unit: 'versión' },
        subs: { label: 'Subtítulos incrustados' },
      },
    },

    /* ── Postproducción ── */
    'po-edit': {
      name: 'Edición sobre material provisto',
      params: {
        minutes: { label: 'Duración final', unit: 'minuto' },
        rushes: {
          label: '¿Cuánto material hay?',
          help: 'Ordenar y revisar el material suele ser la parte más larga de una edición.',
          options: {
            light: { label: 'Menos de una hora' },
            medium: { label: '1 a 5 horas' },
            heavy: { label: 'Más de 5 horas' },
          },
        },
      },
    },
    'po-colour': {
      name: 'Corrección de color',
      params: {
        minutes: { label: 'Duración a corregir', unit: 'minuto' },
        depth: {
          label: 'Tipo',
          options: {
            correct: { label: 'Corrección', desc: 'Balance, empalme, limpieza.' },
            creative: { label: 'Color creativo', desc: 'Una estética deliberada.' },
            lookdev: { label: 'Desarrollo de look', desc: 'Look propio construido y aplicado plano por plano.' },
          },
        },
      },
    },
    'po-sound': {
      name: 'Diseño sonoro y mezcla',
      params: { minutes: { label: 'Duración a mezclar', unit: 'minuto' } },
    },
    'po-retouch': {
      name: 'Retoque de imagen',
      desc: 'Sobre imágenes que aportás vos.',
      params: {
        images: { label: 'Imágenes', unit: 'imagen' },
        level: {
          label: 'Nivel',
          options: {
            standard: { label: 'Estándar' },
            advanced: { label: 'Avanzado' },
            composite: { label: 'Composición' },
          },
        },
      },
    },

    /* ── Motion ── */
    'mo-animation': {
      name: 'Piezas animadas',
      params: {
        seconds: { label: 'Duración final', unit: 'segundo' },
        source: {
          label: '¿De quién es el diseño?',
          help: 'Animar un diseño terminado es más rápido que diseñar antes las piezas.',
          options: {
            supplied: { label: 'Lo aportás vos', desc: 'Arte en capas, listo para producción.' },
            'supplied-prep': { label: 'Lo aportás y yo lo preparo', desc: 'El arte necesita rearmarse para animar.' },
            mine: { label: 'Lo diseño yo también', desc: 'Diseño las piezas y después las animo.' },
          },
        },
        complexity: {
          label: 'Complejidad',
          options: {
            simple: { label: 'Simple', desc: 'Transiciones y tipografía en movimiento.' },
            standard: { label: 'Estándar' },
            complex: { label: 'Compleja', desc: 'Personajes, 3D o sistemas intrincados.' },
          },
        },
        sound: { label: 'Diseño sonoro' },
      },
    },
    'mo-titles': {
      name: 'Títulos, placas y cierres',
      desc: 'Plantillas animadas reutilizables.',
      params: { elements: { label: 'Elementos', unit: 'elemento' } },
    },
    'mo-sting': {
      name: 'Logo animado / cortina',
      params: {
        complexity: {
          label: 'Complejidad',
          options: {
            simple: { label: 'Aparición simple' },
            standard: { label: 'Estándar' },
            complex: { label: 'Compleja / 3D' },
          },
        },
      },
    },

    /* ── Web ── */
    'we-design': {
      name: 'Diseño de sitio web',
      desc: 'El diseño en sí, antes de cualquier desarrollo.',
      params: {
        pages: { label: 'Páginas / plantillas', unit: 'página' },
        fidelity: {
          label: 'Nivel de detalle',
          options: {
            wire: { label: 'Wireframes', desc: 'Sólo estructura y jerarquía.' },
            full: { label: 'Diseño visual completo' },
            proto: { label: 'Diseño + prototipo', desc: 'Navegable, con el movimiento especificado.' },
          },
        },
        mobile: { label: 'Mobile diseñado aparte', desc: 'No un simple reacomodo, sino una versión mobile pensada.' },
      },
    },
    'we-static': {
      name: 'Desarrollo de sitio estático',
      desc: 'Rápido, hecho a mano, sin CMS.',
      params: { pages: { label: 'Páginas', unit: 'página' } },
    },
    'we-custom': {
      name: 'Desarrollo de sitio a medida',
      desc: 'Frontend propio — animado, responsivo, listo para producción.',
      params: {
        templates: { label: 'Plantillas', unit: 'plantilla' },
        cms: { label: 'Integración con CMS', desc: 'Para que edites el contenido vos.' },
        motion: { label: 'Movimiento e interacción avanzados' },
      },
    },
    'we-wordpress': {
      name: 'Desarrollo en WordPress',
      params: {
        templates: { label: 'Plantillas', unit: 'plantilla' },
        approach: {
          label: 'Enfoque',
          options: {
            existing: { label: 'Tema existente', desc: 'Configurado y estilado.' },
            theme: { label: 'Tema personalizado' },
            custom: { label: 'Tema a medida', desc: 'Construido desde cero según el diseño.' },
          },
        },
        woo: { label: 'WooCommerce' },
      },
    },
    'we-uxui': {
      name: 'Consultoría UX/UI',
      desc: 'Auditoría, recomendaciones y dirección sobre un producto existente.',
      params: { hours: { label: 'Tiempo', unit: 'hora' } },
    },

    /* ── Consultoría ── */
    'co-session': {
      name: 'Sesiones de consultoría',
      desc: 'Sesiones de trabajo sobre lo que necesites resolver.',
      params: { hours: { label: 'Tiempo', unit: 'hora' } },
    },
    'co-audit': {
      name: 'Auditoría de marca y diseño',
      desc: 'Una revisión documentada con recomendaciones.',
      params: {
        scope: {
          label: 'Alcance',
          options: {
            light: { label: 'Focalizada', desc: 'Un área — identidad, web o gráfica.' },
            standard: { label: 'Estándar' },
            deep: { label: 'Todo', desc: 'Cada punto de contacto, más una hoja de ruta.' },
          },
        },
      },
    },
    'co-signage': {
      name: 'Señalética y wayfinding',
      desc: 'Diseño y especificación para fabricación.',
      params: {
        signs: { label: 'Tipos de cartel', unit: 'tipo de cartel' },
        specs: { label: 'Especificaciones y planos de fabricación', desc: 'Listos para entregar a un fabricante.' },
      },
    },
    'co-artdirection': {
      name: 'Dirección de arte',
      desc: 'Dirigiendo un rodaje o campaña que producís vos.',
      params: { days: { label: 'Días', unit: 'día' } },
    },

    /* ── Visuales para eventos ── */
    'ev-content': {
      name: 'Paquete de contenido para pantalla',
      desc: 'Loops, cortinas, placas de espera, zócalos.',
      params: {
        assets: { label: 'Piezas', unit: 'pieza' },
        'custom-res': { label: 'Resolución de pantalla no estándar', desc: 'Pantallas LED, ultra panorámicas, multipantalla.' },
      },
    },
    'ev-band': {
      name: 'Set visual para banda o artista',
      desc: 'Un set visual sincronizado para vivo.',
      params: {
        tracks: { label: 'Temas', unit: 'tema' },
        reactive: { label: 'Reactivo al audio / disparado en vivo' },
      },
    },
    'ev-stage': {
      name: 'Diseño de escenario y pantallas',
      params: {
        scale: {
          label: 'Escala',
          options: {
            small: { label: 'Una pantalla' },
            standard: { label: 'Escenario estándar' },
            large: { label: 'Grande / multipantalla' },
          },
        },
      },
    },
    'ev-live': {
      name: 'Operación en el lugar',
      desc: 'Operando los visuales en vivo el día del evento.',
      params: {
        hours: { label: 'Tiempo en el lugar', unit: 'hora' },
        rehearsal: { label: 'Ensayo / jornada técnica' },
        kit: { label: 'Equipo de reproducción y notebook' },
      },
    },
  },


  licences: {
    organic: { label: 'Interno y redes orgánicas', desc: 'Tus canales, sitio y redes. Sin pauta paga.' },
    twelve: { label: '12 meses, un mercado', desc: 'Pauta paga en un mercado durante un año.' },
    national: { label: 'Campaña nacional, 12 meses', desc: 'Pauta paga a nivel nacional durante un año.' },
    buyout: { label: 'Cesión total', desc: 'Uso ilimitado, a perpetuidad, en todo el mundo.' },
  },
};

/* ═══════════════════ Interface copy ═══════════════════ */

export const ES_COPY: QuoteCopy = {
  meta: {
    title: 'Armá tu presupuesto',
    description: 'Armá un presupuesto detallado y transparente para diseño, foto, video o web.',
  },
  role: 'Diseño · Fotografía · Motion',
  steps: ['Trabajo', 'Alcance', 'Proyecto', 'Datos', 'Presupuesto'],

  header: {
    eyebrow: 'Presupuestador',
    title: 'Armá tu presupuesto',
    lead: 'Elegí lo que necesitás, ajustá los detalles y llevate un presupuesto detallado de verdad — con los mismos números que te daría en una reunión. Imprimilo, guardalo en PDF o mandámelo directo.',
  },

  work: {
    title: '¿Qué necesitás?',
    sub: 'Elegí todo lo que aplique — los detalles los configurás en el paso siguiente.',
  },

  scope: {
    title: 'Armá el alcance',
    sub: 'Seleccioná un ítem y después ajustá su detalle. Cada número de acá abajo impacta directo en el precio.',
    setDetail: 'Ajustar detalle',
    hideDetail: 'Ocultar detalle',
    perHour: (rate) => `US$${rate}/h`,
    includesFees: (amount) => `Incluye ${amount} en equipamiento y alquileres.`,
    fewer: (unit) => `Menos ${unit}`,
    more: (unit) => `Más ${unit}`,
    hours: 'Tiempo dedicado',
    hoursFull: 'Tiempo recomendado completo',
    hoursOf: (bought, recommended) => `${bought} de ${recommended} recomendadas`,
    hoursReduced: (percent) => `${percent}% del tiempo recomendado — menos profundidad`,
    lessTime: 'Menos tiempo',
    moreTime: 'Más tiempo',
  },

  project: {
    title: 'Condiciones del proyecto',
    sub: 'Lo que cambia el precio sin cambiar los entregables.',
    travel: '¿Dónde es el rodaje?',
    travelHelp: 'El tiempo de viaje se factura a la tarifa de rodaje.',
    licence: 'Licencia de uso',
    licenceHelp: 'Dónde y por cuánto tiempo se usa el material. Aplica porque seleccionaste trabajo de rodaje o edición.',
    included: 'Incluida',
    poa: 'A consultar',
    revisions: 'Rondas de revisión extra',
    revisionsHelp: (included, hours, rate) =>
      `Ya vienen ${included} rondas incluidas. Cada ronda extra son ${hours}h a US$${rate}/h.`,
    fewerRounds: 'Menos rondas',
    moreRounds: 'Más rondas',
    sourceFiles: 'Quedarte con los archivos editables',
    sourceFilesDesc: (percent, min) =>
      `Archivos fuente en capas y de proyecto, no sólo las exportaciones finales — para que otro diseñador pueda retomar el trabajo. ${percent}% del tiempo de producción, mínimo ${min}.`,
    hours: '¿Cuántas horas vas a contratar?',
    hoursHelp: (floor) =>
      `La recomendación es lo que realmente necesita el alcance que armaste. Si el presupuesto no da, contratá menos horas: cada entregable recibe proporcionalmente menos tiempo, así que esperá menos propuestas, menos pasadas y menos terminación. Podés ajustar ítem por ítem volviendo al paso Alcance. El ${floor}% es el piso; por debajo de eso el trabajo deja de ser entregable y conviene que lo hablemos.`,
    hoursRecommended: (hours, amount) => `Recomendado: ${hours} · ${amount}`,
    hoursBuying: (hours, percent) => `Contratás ${hours} — ${percent}% de lo recomendado`,
    hoursAtFloor: 'Es lo mínimo con lo que puedo entregar este alcance. Por debajo, mejor hablamos de recortar entregables.',
  },

  delivery: {
    title: 'Entrega',
    sub: 'Aproximadamente cuándo lo vas a tener.',
    priority: 'Prioridad — que sea el único proyecto del día',
    priorityDesc: (standard, priority, uplift) =>
      `El trabajo estándar recibe ${standard} horas por día y comparte la semana con otros proyectos. Con prioridad, el tuyo es lo único sobre el escritorio: ${priority} horas por día, por un ${uplift}% más.`,
    pace: (hoursPerDay) => `${hoursPerDay} horas por día`,
    startLabel: 'Fecha de inicio',
    startHelp: (leadDays) => `Lo antes que puedo arrancar es dentro de ${leadDays} días.`,
    duration: (days) => `${days} día${days === 1 ? '' : 's'} hábil${days === 1 ? '' : 'es'}`,
    deliveryLabel: 'Entrega estimada',
    pickDate: 'Elegí una fecha de inicio para ver cuándo estaría listo.',
    note: 'Estos tiempos son un cálculo aproximado a partir de las horas de este presupuesto, repartidas en días hábiles — son una referencia, no un compromiso. El cronograma real depende de qué tan rápido vuelvan las devoluciones y de qué otros trabajos haya agendados.',
  },

  details: {
    title: 'Tus datos',
    sub: 'Van en el presupuesto y me permiten mandarte una copia.',
    name: 'Nombre *',
    email: 'Email *',
    company: 'Empresa',
    timeline: '¿Para cuándo lo necesitás?',
    timelinePlaceholder: 'ej. mediados de agosto',
    message: '¿Algo que deba saber?',
    messagePlaceholder: 'Una línea sobre el proyecto me ayuda a verificar que el presupuesto cierre.',
  },

  quote: {
    title: 'Tu presupuesto',
    sub: (number, until) => `Presupuesto ${number} · válido hasta el ${until}`,
    copyLink: 'Copiar enlace',
    copied: '✓ Enlace copiado',
    savePdf: 'Guardar en PDF',
    whatsapp: 'WhatsApp',
    whatsappMessage: (number, total, currency) =>
      `Hola Benjamin — armé el presupuesto ${number} en tu sitio (${total} ${currency}). ¿Lo charlamos?`,
    copyPrompt: 'Copiá el enlace de tu presupuesto:',
    sendError: (msg) => `No se pudo enviar (${msg}).`,
    emailDirectly: 'Mandámelo por email →',
    needDetails: 'Agregá tu nombre y email para enviarlo →',
  },

  nav: {
    back: 'Atrás',
    continue: 'Continuar',
    seeQuote: 'Ver mi presupuesto',
    send: 'Enviárselo a Benjamin',
    sending: 'Enviando…',
  },

  rail: {
    total: 'Total parcial',
    summary: (items, hours) => `${items} ítem${items === 1 ? '' : 's'} · ${hours}`,
    revisions: 'Revisiones extra',
    priority: 'Prioridad',
    travel: 'Viaje',
    licence: 'Licencia de uso',
    sourceFiles: 'Archivos editables',
    delivery: (days) => `${days} día${days === 1 ? '' : 's'} hábil${days === 1 ? '' : 'es'} de trabajo`,
    deposit: (amount) => `${amount} de anticipo para reservar`,
    poa: 'Algunos ítems son a consultar',
    reduced: (percent, recommended) => `${percent}% de las ${recommended} recomendadas`,
  },

  sent: {
    label: 'Enviado',
    title: (first, number) => `Gracias, ${first} — el presupuesto ${number} ya está en camino.`,
    body: (total, currency, items, email) =>
      `Recibí tu presupuesto de ${total} ${currency} (${items} ítem${items === 1 ? '' : 's'}) y te mandé una copia a ${email}. Te escribo en breve.`,
    savePdf: 'Guardar en PDF',
    backToSite: 'Volver al sitio',
    whatsapp: 'Escribime por WhatsApp',
  },

  doc: {
    stamp: 'Presupuesto',
    whatsapp: 'WhatsApp',
    number: 'Número',
    issued: 'Emitido',
    validUntil: 'Válido hasta',
    preparedFor: 'Preparado para',
    fallbackClient: 'Tu proyecto',
    scopeOfWork: 'Alcance del trabajo',
    colItem: 'Ítem',
    colTime: 'Tiempo',
    colAmount: 'Importe',
    projectCosts: 'Costos del proyecto',
    equipment: 'Equipamiento y alquileres',
    equipmentNote: 'Costos directos asociados a los ítems de arriba',
    revisions: (rounds) => `Rondas de revisión adicionales (${rounds})`,
    revisionsNote: (hours, included) => `${hours} por encima de las ${included} incluidas`,
    priority: 'Prioridad — dedicación exclusiva',
    priorityNote: (percent) => `+${percent}% sobre el tiempo de producción`,
    deliveryTitle: 'Entrega',
    deliveryStart: 'Inicio',
    deliveryEnd: 'Entrega estimada',
    deliveryDays: 'Días hábiles',
    deliveryPace: (hoursPerDay) => `${hoursPerDay} horas por día`,
    deliveryNote: 'Los tiempos son un cálculo aproximado a partir de las horas de arriba, repartidas en días hábiles. Son una referencia, no un compromiso, y asumen que las devoluciones vuelven a tiempo.',
    travelTime: (label) => `Tiempo de viaje — ${label}`,
    travelTimeNote: (hours) => `${hours} facturadas a la tarifa de rodaje`,
    travelExpenses: 'Gastos de viaje',
    travelExpensesEstimated: 'Estimados — se facturan al costo',
    travelExpensesPoa: 'Se confirman al conocer el destino',
    licence: (label) => `Licencia de uso — ${label}`,
    sourceFiles: 'Entrega de archivos editables',
    sourceFilesNote: 'Archivos fuente en capas y de proyecto entregados',
    reducedSpec: (bought, recommended) => `${bought} de ${recommended} recomendadas`,
    reducedNote: (percent, bought, recommended) =>
      `Este presupuesto está calculado sobre ${bought} de las ${recommended} recomendadas — el ${percent}% del tiempo que el trabajo realmente necesita. La lista de entregables es la misma, pero cada uno recibe proporcionalmente menos tiempo: menos propuestas, menos pasadas y menos terminación.`,
    reducedTerm: (percent) =>
      `Calculado sobre el ${percent}% del tiempo recomendado. Los entregables se reducen en profundidad, no en cantidad.`,
    total: 'Total',
    deposit: (percent) => `Anticipo para reservar — ${percent}%`,
    hoursNote: (hours, rates) => `${hours} de trabajo en total. Tarifas: ${rates}.`,
    poaNote: 'Algunos ítems figuran a consultar — no se pueden cerrar hasta confirmar los detalles. Todo lo demás en este presupuesto es firme.',
    terms: 'Condiciones',
    termsList: (o) => [
      `Válido por ${o.validDays} días desde la fecha de emisión.`,
      `Un anticipo del ${o.depositPercent}% confirma la reserva; el saldo se abona contra entrega.`,
      `Incluye ${o.revisionsIncluded} rondas de revisión. Las rondas adicionales se facturan a la tarifa horaria correspondiente.`,
      o.sourceFiles
        ? 'Los archivos editables (fuente en capas y de proyecto) están incluidos y se entregan con el pago final.'
        : 'Los entregables finales se envían en los formatos acordados. Los archivos editables no están incluidos; pueden entregarse por un costo adicional.',
      o.licensable
        ? `El uso se licencia como: ${o.licenceLabel.toLowerCase()} — ${o.licenceDesc.toLowerCase()}`
        : 'Los entregables se licencian para el uso acordado.',
      `Los derechos de autor permanecen con ${o.businessName} hasta recibir el pago final.`,
      `Los precios están expresados en ${o.currency}. Esto es un presupuesto, no una factura.`,
    ],
    footerQuote: (number, issued) => `Presupuesto ${number} · emitido el ${issued}`,
  },
};
