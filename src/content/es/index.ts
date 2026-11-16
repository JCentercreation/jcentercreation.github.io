import type { LocaleContent } from '../types';
import { owner } from '../shared/owner';

const es: LocaleContent = {
  ui: {
    siteTitle: 'El Garaje del Ingeniero',
    loading: 'Abriendo el garaje',
    loadingHint: 'Cargando el taller…',
    loadingStages: { engine: 'Cargando el motor 3D…', scene: 'Preparando el garaje…', ready: 'Abriendo el garaje' },
    boot: {
      preparing: 'Preparando tu espacio…',
      ready: 'Listo',
      stepOf: '{n} de {total}',
      slow: 'Está tardando más de lo habitual en este dispositivo. Puedes seguir esperando o abrir ya la versión sencilla.',
      steps: {
        engine: 'Iniciando el motor 3D',
        room: 'Construyendo el garaje',
        workspace: 'Preparando el escritorio',
        library: 'Ordenando la biblioteca',
        car: 'Aparcando el coche',
        storm: 'Dejando entrar la tormenta',
        materials: 'Preparando los materiales',
        reflections: 'Capturando los reflejos',
      },
    },
    loadError: {
      title: 'No se ha podido abrir el garaje',
      body: 'Algo ha fallado al iniciar la escena 3D. Puedes volver a intentarlo o leerlo todo en la versión sencilla.',
      retry: 'Reintentar',
      continue2d: 'Ir a la versión sencilla',
    },
    welcomeLabel: 'Nota de bienvenida',
    enter: 'Entrar',
    backToGarage: 'Volver al garaje',
    skipIntro: 'Saltar intro',
    language: 'Idioma',
    languageNames: { en: 'English', es: 'Español' },
    present: 'Actualidad',
    pendingContent: 'Detalles próximamente.',
    reducedMotionNotice: 'Movimiento reducido activado: los movimientos de cámara se acortan.',
    exploreHint: 'Haz clic en el MacBook, el iPad, la puerta del coche o la estantería para explorar.',
    placesLabel: 'Lugares del garaje',
    fallback: {
      title: 'El Garaje del Ingeniero',
      reasons: {
        unsupported: 'Tu navegador o dispositivo no puede ejecutar el garaje en 3D, así que aquí tienes el contenido esencial.',
        chosen: 'Estás viendo la versión sencilla: el contenido esencial, sin el garaje en 3D.',
        failed: 'El garaje en 3D no ha podido cargarse esta vez, así que aquí tienes el contenido esencial.',
      },
      viewAnyway: 'Probar la versión 3D de todos modos',
      open3D: 'Abrir el garaje en 3D',
      retry3D: 'Volver a intentar el garaje en 3D',
    },
    objects: {
      macbook: 'MacBook Pro — leer la nota de bienvenida',
      ipad: 'iPad Pro — portfolio de plataformas Apple',
      desk: 'Escritorio',
      tesla: 'Taller — Tesla Model 3',
      bookshelf: 'Estantería — biblioteca personal',
      teslaDoor: 'Puerta del conductor del Tesla Model 3 — portfolio de automoción',
      carLaptop: 'Portátil en el asiento del conductor — abrir el portfolio de automoción',
    },
    shots: {
      macbookIntro: 'Bienvenida',
      overview: 'Vista del garaje',
      desk: 'Escritorio',
      macbook: 'MacBook',
      ipad: 'iPad',
      bookshelf: 'Estantería',
      tesla: 'Taller',
      teslaInterior: 'Interior del coche',
      teslaLaptop: 'Portfolio de automoción',
    },
  },
  welcome: {
    title: 'Hola 👋',
    body: [
      'Hola, te doy la bienvenida a mi espacio.',
      `Soy ${owner.name}, ingeniero de software apasionado por la tecnología, la ingeniería de automoción y el ecosistema Apple.`,
      'Este es mi espacio personal, donde puedes descubrir mi trayectoria profesional, mis proyectos, mis intereses y algunas cosas que me definen.',
      'Echa un vistazo. Estás en tu casa.',
    ],
    discover: {
      heading: 'Por la habitación',
      items: [
        'El iPad del escritorio — mi trabajo desarrollando software para plataformas Apple.',
        'El coche del taller — mis años en ingeniería de software de automoción y en el motorsport.',
        'La estantería — unos cuantos libros que merece la pena sacar del estante.',
      ],
    },
  },
  macbook: {
    appName: 'Notas',
    folder: 'Javier',
    notes: {
      welcome: 'Bienvenida',
      about: 'Sobre mí',
      experience: 'Experiencia',
      skills: 'Habilidades',
      projects: 'Proyectos personales',
    },
    labels: {
      sections: 'Secciones del portfolio',
      explore: 'Explorar mi portfolio',
      close: 'Cerrar y volver al garaje',
      backToWelcome: 'Volver a la nota de bienvenida',
      backToProjects: 'Todos los proyectos',
      openLink: 'Abrir',
      opensInNewTab: 'se abre en una pestaña nueva',
      status: 'Estado',
      links: 'Enlaces',
    },
    about: {
      heading: 'Sobre mí',
      combinesLabel: 'Mi perfil combina',
      combines: [
        'Ingeniería de software iOS',
        'Ingeniería de software de automoción',
        'Tecnología y arquitectura de software',
        'El ecosistema Apple',
      ],
      paragraphs: [
        'Empecé mi carrera como ingeniero de software desarrollando software embebido de tren motriz en empresas como Nissan y SEAT.',
        'Después me pasé a la ingeniería de software para plataformas Apple, trabajando para empresas como Banc Sabadell, Banco Santander e Inditex.',
        'Como ingeniero de software me centro especialmente en las decisiones de arquitectura, rendimiento y seguridad. Mi trabajo también incluye hacer entrevistas técnicas, acompañar a las nuevas incorporaciones y ser referente técnico.',
        'También he trabajado con startups desarrollando MVPs, y me gusta trabajar en mis propios proyectos personales.',
      ],
    },
    experience: {
      heading: 'Experiencia profesional',
      intro: 'Desarrollo de software para plataformas Apple.',
      timeline: 'Trayectoria',
      role: 'Puesto',
      rolePending: 'Detalles del puesto próximamente.',
      period: 'Periodo',
      description: 'Descripción',
      showDetails: 'Ver detalles',
      hideDetails: 'Ocultar detalles',
    },
    skills: {
      heading: 'Habilidades técnicas',
      groups: {
        languages: { label: 'Lenguajes y frameworks', items: ['Swift', 'Objective-C', 'UIKit', 'SwiftUI'] },
        architecture: { label: 'Arquitectura', items: ['MVC', 'MVVM', 'MVP', 'VIPER', 'MV', 'TCA'] },
        quality: {
          label: 'Calidad y entrega',
          items: ['Tests unitarios', 'Tests de UI', 'Tests end-to-end', 'Cobertura de tests', 'App Store Connect', 'TestFlight', 'Publicaciones en App Store'],
        },
        practices: {
          label: 'Prácticas de ingeniería',
          items: ['Decisiones de arquitectura y rendimiento', 'Decisiones de seguridad', 'Entrevistas técnicas', 'Mentoría', 'iOS Technology Focal (referente técnico iOS)'],
        },
      },
    },
    projectsHeading: 'Proyectos personales',
    projectsIntro: 'Cosas que construyo en mi tiempo libre. Selecciona un proyecto para ver sus detalles.',
    // Textos de proyectos aprobados por el propietario (incluida la frase sobre beta testers de PROOF y la descripción de los cursos de Swift).
    projects: {
      writingfree: {
        description:
          'Un espacio limpio, centrado y sin distracciones para plasmar tus ideas. Un modelo de IA en el propio dispositivo te ofrece observaciones útiles sobre lo que escribes.',
        status: null,
      },
      necktimer: {
        description:
          'Una app que ayuda a tomar conciencia de la postura de la espalda y a prevenir lesiones, usando las señales de los acelerómetros de los AirPods para detectar la postura.',
        status: null,
      },
      proof: {
        description:
          'Te ayuda a saber qué imágenes son fiables en un mundo en el que ver ya no es creer. La comunidad de beta testers no para de crecer.',
        status: 'En desarrollo',
      },
      'swift-courses': {
        description: 'Recursos de aprendizaje para la comunidad de desarrolladores.',
        status: null,
      },
    },
  },
  ipad: {
    appName: 'Trayectoria',
    home: {
      eyebrow: 'Ingeniería iOS',
      title: 'Mi evolución como ingeniero iOS',
      subtitle: 'Explora la trayectoria, las tecnologías y patrones con los que trabajo, y mis responsabilidades técnicas y de mentoría.',
    },
    sections: {
      timeline: { title: 'Trayectoria', intro: 'Construyendo para plataformas Apple, desde 2020 hasta hoy. Selecciona una empresa para ver los detalles.' },
      ios: { title: 'Ingeniería iOS', intro: 'Los lenguajes y frameworks de UI que utilizo para desarrollar en plataformas Apple.' },
      architecture: { title: 'Arquitectura', intro: 'Patrones de arquitectura con los que trabajo.' },
      practices: { title: 'Prácticas de ingeniería', intro: 'Testing y calidad, entrega de apps y decisiones técnicas.' },
      leadership: { title: 'Liderazgo y mentoría', intro: 'Responsabilidades documentadas en mi experiencia profesional.' },
    },
    labels: {
      sections: 'Secciones de la trayectoria',
      overview: 'Inicio',
      close: 'Cerrar y volver al garaje',
      role: 'Puesto',
      period: 'Periodo',
      selectHint: 'Selecciona una empresa',
      closeDetail: 'Cerrar detalles',
      generalOverview: 'Descripción general',
      generalNote: 'Descripciones breves y generales de cada patrón, no vinculadas a una empresa o proyecto concreto.',
      context: 'Contexto',
    },
    ios: { languages: 'Lenguajes', uiFrameworks: 'Frameworks de UI' },
    architecture: {
      patterns: {
        mvc: { expansion: 'Model–View–Controller', summary: 'Separa los datos, la presentación y el controlador que los coordina. El patrón tradicional de UIKit.' },
        mvvm: { expansion: 'Model–View–ViewModel', summary: 'Un view model expone el estado de presentación que la vista observa y representa.' },
        mvp: { expansion: 'Model–View–Presenter', summary: 'Un presenter contiene la lógica de presentación y dirige una vista pasiva.' },
        viper: { expansion: 'View–Interactor–Presenter–Entity–Router', summary: 'Divide cada módulo en capas de responsabilidad única, incluida la navegación.' },
        mv: { expansion: 'Model–View', summary: 'Las vistas de SwiftUI observan los modelos directamente, sin una capa intermedia.' },
        tca: { expansion: 'The Composable Architecture', summary: 'Estado, acciones y reducers compuestos en un único store fácil de testear.' },
      },
    },
    practices: {
      testing: { label: 'Testing y calidad', items: ['Tests unitarios', 'Tests de UI', 'Tests end-to-end', 'Cobertura de tests'] },
      delivery: { label: 'Entrega de apps', items: ['App Store Connect', 'TestFlight', 'Publicaciones en App Store'] },
      technical: { label: 'Ingeniería técnica', items: ['Decisiones de arquitectura', 'Decisiones de rendimiento', 'Decisiones de seguridad'] },
    },
    leadership: {
      items: {
        techReference: 'Referente técnico iOS',
        interviews: 'Entrevistas técnicas',
        mentoring: 'Mentoría de nuevas incorporaciones',
        guidance: 'Orientación técnica',
        decisions: 'Decisiones de ingeniería',
      },
    },
  },
  windows: { start: 'Inicio', clock: '23:47' },
  apple: {
    heading: 'Plataformas Apple',
    sections: {
      experience: 'Experiencia profesional',
      technologies: 'Tecnologías',
      architecture: 'Arquitectura',
      leadership: 'Ingeniería y liderazgo técnico',
      startups: 'Startups y proyectos independientes',
    },
    companies: {
      // Roles y descripciones aprobados por el propietario (fuente de verdad — no editar).
      // Decisión del propietario: los títulos de puesto se mantienen en inglés en ambos idiomas.
      sabadell: {
        role: 'iOS Software Engineer',
        description:
          'Desarrollo de nuevas funcionalidades para la aplicación iOS del banco. También participé en entrevistas técnicas a candidatos y en la mentoría y acompañamiento de nuevas incorporaciones al equipo.',
      },
      misfits: {
        role: 'Founder & iOS Engineer',
        description:
          'Fundador de Misfits Studio, donde gestiono y desarrollo proyectos desde cero para startups y pequeños negocios. Asumo tanto las responsabilidades de Product Manager como de Software Engineer, participando en todo el proceso de desarrollo del producto, desde la definición inicial hasta su implementación.',
      },
      inditex: {
        role: 'iOS Engineer',
        description:
          'Desarrollo de nuevas funcionalidades para las aplicaciones iOS de la compañía, desempeñando además el papel de referente técnico del área iOS, proporcionando orientación técnica y participando en las decisiones de ingeniería.',
      },
      santander: {
        role: 'iOS Software Engineer',
        description:
          'Desarrollo de nuevas funcionalidades para la aplicación iOS del banco y mentoría y acompañamiento de nuevas incorporaciones al equipo.',
      },
    },
    startups: {
      heading: 'Startups y proyectos independientes',
      intro:
        'También he trabajado con startups y pequeñas empresas, ayudando a convertir ideas en productos de software reales mediante el desarrollo de MVPs.',
    },
    profile: {
      languages: { label: 'Lenguajes de programación', items: ['Swift', 'Objective-C'] },
      uiFrameworks: { label: 'Frameworks de UI', items: ['UIKit', 'SwiftUI'] },
      architecture: {
        label: 'Patrones de arquitectura',
        items: ['MVC', 'MVVM', 'MVP', 'VIPER', 'MV', 'TCA'],
      },
      testing: {
        label: 'Testing y calidad',
        items: ['Tests unitarios', 'Tests de UI', 'Tests end-to-end', 'Cobertura de código'],
      },
      distribution: {
        label: 'Distribución de apps',
        items: ['App Store Connect', 'TestFlight', 'Gestión de publicaciones en App Store'],
      },
      leadership: {
        label: 'Responsabilidades de ingeniería',
        items: [
          'Arquitectura de software',
          'Decisiones de rendimiento',
          'Decisiones de seguridad',
          'Entrevistas técnicas',
          'Mentoría de nuevas incorporaciones',
          'Referente técnico de iOS',
        ],
      },
    },
  },
  automotive: {
    windowTitle: 'Portfolio de Ingeniería de Automoción',
    heading: 'Portfolio de Ingeniería de Automoción',
    subtitle: 'Ingeniería de software de automoción y motorsport',
    companies: {
      nissan: { description: null },
      seat: {
        description:
          'Ingeniero de software en módulos electrónicos de Emisiones y Prestaciones del tren motriz, en proyectos de la gama de motores del grupo VAG.',
      },
      rfea: {
        description:
          'Verificación técnica de vehículos de competición en el Gran Premio de Europa de Fórmula 1, EuroOpen F3 y F3 EuroSeries, el Campeonato Mundial de Turismos y el Deutsche Tourenwagen Masters.',
      },
    },
    // Decisión del propietario: los títulos de puesto se mantienen en inglés en ambos idiomas.
    positions: {
      'nissan-etb-bcn': { title: 'Software Engineer – Powertrain ETB', location: 'Barcelona, España' },
      'nissan-etb-cranfield': { title: 'Software Engineer – Powertrain ETB', location: 'Cranfield, Reino Unido' },
      'nissan-performance': {
        title: 'Software Engineer – Powertrain Performance',
        location: 'Barcelona, España',
      },
      'seat-swe': { title: 'Software Engineer', location: 'Área metropolitana de Barcelona' },
      'rfea-scrutineer': {
        title: 'Technical Scrutineer',
        location: 'Circuito Ricardo Tormo y Circuito Urbano de Valencia, Valencia',
      },
    },
    highlights: {
      rfea: {
        label: 'Campeonatos y eventos',
        items: [
          'Gran Premio de Europa de Fórmula 1',
          'EuroOpen F3',
          'F3 EuroSeries',
          'Campeonato Mundial de Turismos (WTCC)',
          'Deutsche Tourenwagen Masters',
        ],
      },
    },
    labels: { period: 'Periodo', role: 'Puesto', technologies: 'Tecnologías', location: 'Ubicación' },
    portfolio: {
      sections: { overview: 'Resumen', nissan: 'Nissan', seat: 'SEAT', rfea: 'RFEDA', technologies: 'Tecnologías' },
      overviewIntro: 'Ingeniería de software de tren motriz y verificación técnica en el motorsport, 2010–2019.',
      timeline: 'Trayectoria',
      openCompany: 'Abrir',
      locations: 'Ubicaciones',
      events: 'Campeonatos y eventos',
      positions: 'Puestos',
      technologiesIntro: 'Tecnologías y prácticas registradas en mis puestos de automoción.',
      techAt: 'En',
      closePortfolio: 'Cerrar el portfolio',
      start: 'Inicio',
      navLabel: 'Secciones del portfolio',
      selectLaptop: 'Selecciona el portátil para abrir el portfolio de automoción.',
      venues: ['Circuito Ricardo Tormo', 'Circuito Urbano de Valencia'],
    },
  },
  books: {
    heading: 'Biblioteca',
    byAuthor: 'de',
    close: 'Devolver el libro a la estantería',
    coverPending: 'Portada próximamente',
    selectHint: 'Selecciona un libro para sacarlo de la estantería.',
    listLabel: 'Libros de la estantería',
    firstPublished: 'Primera edición',
    // Resúmenes factuales del tema de cada libro (pendientes de aprobación — docs/OUTSTANDING.md).
    descriptions: {
      sapiens: 'Una historia de la humanidad, desde la aparición del Homo sapiens hasta la actualidad.',
      dinosaurs: 'Una historia de los dinosaurios, desde sus orígenes hasta su extinción, basada en el registro fósil.',
      'emperor-maladies': 'Una historia del cáncer, desde sus primeras descripciones hasta el tratamiento y la investigación actuales.',
    },
  },
};

export default es;
