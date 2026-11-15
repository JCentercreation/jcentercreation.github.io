import type { LocaleContent } from '../types';
import { owner } from '../shared/owner';

const es: LocaleContent = {
  ui: {
    siteTitle: 'El Garaje del Ingeniero',
    loading: 'Abriendo el garaje',
    loadingHint: 'Cargando el taller…',
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
      reason: 'Tu navegador o dispositivo no puede ejecutar el garaje en 3D, así que aquí tienes el contenido esencial.',
      viewAnyway: 'Probar la versión 3D de todos modos',
    },
    objects: {
      macbook: 'MacBook Pro — leer la nota de bienvenida',
      ipad: 'iPad Pro — portfolio de plataformas Apple',
      desk: 'Escritorio',
      tesla: 'Taller — Tesla Model 3',
      bookshelf: 'Estantería — biblioteca personal',
      teslaDoor: 'Puerta del conductor del Tesla Model 3 — portfolio de automoción',
    },
    shots: {
      macbookIntro: 'Bienvenida',
      overview: 'Vista del garaje',
      desk: 'Escritorio',
      macbook: 'MacBook',
      ipad: 'iPad',
      bookshelf: 'Estantería',
      tesla: 'Taller',
      teslaLaptop: 'Portátil de diagnosis',
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
      // Los títulos de puesto se mantienen en inglés, tal como los facilitó el propietario.
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
    positions: {
      'nissan-etb-bcn': { title: 'Ingeniero de software – Powertrain ETB', location: 'Área metropolitana de Barcelona' },
      'nissan-etb-cranfield': { title: 'Ingeniero de software – Powertrain ETB', location: 'Cranfield, Reino Unido' },
      'nissan-performance': {
        title: 'Ingeniero de software – Powertrain Performance',
        location: 'Área metropolitana de Barcelona',
      },
      'seat-swe': { title: 'Ingeniero de software', location: 'Área metropolitana de Barcelona' },
      'rfea-scrutineer': {
        title: 'Comisario técnico',
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
  },
  books: {
    heading: 'Biblioteca',
    byAuthor: 'de',
    close: 'Devolver el libro a la estantería',
    coverPending: 'Portada próximamente',
  },
};

export default es;
