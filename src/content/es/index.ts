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
    fallback: {
      title: 'El Garaje del Ingeniero',
      reason: 'Tu navegador o dispositivo no puede ejecutar el garaje en 3D, así que aquí tienes el contenido esencial.',
      viewAnyway: 'Probar la versión 3D de todos modos',
    },
    objects: {
      macbook: 'MacBook Pro — leer la nota de bienvenida',
      ipad: 'iPad Pro — portfolio de plataformas Apple',
      bookshelf: 'Estantería — biblioteca personal',
      teslaDoor: 'Puerta del conductor del Tesla Model 3 — portfolio de automoción',
    },
    shots: {
      macbookIntro: 'Bienvenida',
      overview: 'Vista del garaje',
      desk: 'Escritorio',
      ipad: 'iPad',
      bookshelf: 'Estantería',
      tesla: 'Taller',
      teslaLaptop: 'Portátil de diagnosis',
    },
  },
  welcome: {
    title: 'Hola 👋',
    body: [
      'Hola, bienvenido a mi espacio.',
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
      sabadell: { description: null },
      misfits: { description: null },
      inditex: { description: null },
      santander: { description: null },
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
