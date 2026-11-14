import type { LocaleContent } from '../types';
import { owner } from '../shared/owner';

const en: LocaleContent = {
  ui: {
    siteTitle: "The Engineer's Garage",
    loading: 'Opening the garage',
    loadingHint: 'Loading the workshop…',
    enter: 'Enter',
    backToGarage: 'Back to the garage',
    skipIntro: 'Skip intro',
    language: 'Language',
    languageNames: { en: 'English', es: 'Español' },
    present: 'Present',
    pendingContent: 'Details coming soon.',
    reducedMotionNotice: 'Reduced motion is on: camera moves are shortened.',
    fallback: {
      title: "The Engineer's Garage",
      reason: "Your browser or device can't run the 3D garage, so here's the essential content instead.",
      viewAnyway: 'Try the 3D version anyway',
    },
    objects: {
      macbook: 'MacBook Pro — read the welcome note',
      ipad: 'iPad Pro — Apple platforms portfolio',
      bookshelf: 'Bookshelf — personal library',
      teslaDoor: 'Tesla Model 3 driver door — automotive portfolio',
    },
    shots: {
      macbookIntro: 'Welcome',
      overview: 'Garage overview',
      desk: 'Desk',
      ipad: 'iPad',
      bookshelf: 'Bookshelf',
      tesla: 'Workshop',
      teslaLaptop: 'Diagnostic laptop',
    },
  },
  welcome: {
    title: 'Hello 👋',
    body: [
      'Hello, welcome to my space.',
      `I'm ${owner.name}, a software engineer passionate about technology, automotive engineering and the Apple ecosystem.`,
      'This is my personal space, where you can explore my professional journey, projects, interests and some things that define who I am.',
      'Take a look around. Make yourself at home.',
    ],
    discover: {
      heading: 'Around the room',
      items: [
        'The iPad on the desk — my work building software for Apple platforms.',
        'The car in the workshop — my years in automotive software engineering and motorsport.',
        'The bookshelf — a few books worth pulling off the shelf.',
      ],
    },
  },
  apple: {
    heading: 'Apple Platforms',
    sections: {
      experience: 'Professional Experience',
      technologies: 'Technologies',
      architecture: 'Architecture',
      leadership: 'Engineering & Technical Leadership',
      startups: 'Startups & Independent Projects',
    },
    companies: {
      sabadell: { description: null },
      misfits: { description: null },
      inditex: { description: null },
      santander: { description: null },
    },
    startups: {
      heading: 'Startups & Independent Projects',
      intro:
        "I've also worked with startups and small businesses, helping turn ideas into working software products through MVP development.",
    },
    profile: {
      languages: { label: 'Programming languages', items: ['Swift', 'Objective-C'] },
      uiFrameworks: { label: 'UI frameworks', items: ['UIKit', 'SwiftUI'] },
      architecture: {
        label: 'Architectural patterns',
        items: ['MVC', 'MVVM', 'MVP', 'VIPER', 'MV', 'TCA'],
      },
      testing: {
        label: 'Testing & quality',
        items: ['Unit Testing', 'UI Testing', 'End-to-End Testing', 'Code Coverage'],
      },
      distribution: {
        label: 'App distribution',
        items: ['App Store Connect', 'TestFlight', 'App Store release management'],
      },
      leadership: {
        label: 'Engineering responsibilities',
        items: [
          'Software architecture',
          'Performance decisions',
          'Security decisions',
          'Technical interviews',
          'Mentoring newcomers',
          'iOS technology focal point',
        ],
      },
    },
  },
  automotive: {
    windowTitle: 'Automotive Engineering Portfolio',
    heading: 'Automotive Engineering Portfolio',
    subtitle: 'Automotive Software Engineering & Motorsport',
    companies: {
      nissan: { description: null },
      seat: {
        description:
          'Software engineer working on powertrain Emissions and Performance electronic modules across VAG engines lineup projects.',
      },
      rfea: {
        description:
          'Racing vehicles technical scrutineering at Europe Formula 1 Grand Prix, EuroOpen F3 and F3 EuroSeries, World Touring Car Championship and Deutsche Tourenwagen Masters.',
      },
    },
    positions: {
      'nissan-etb-bcn': { title: 'Software Engineer – Powertrain ETB', location: 'Greater Barcelona Metropolitan Area' },
      'nissan-etb-cranfield': { title: 'Software Engineer – Powertrain ETB', location: 'Cranfield, United Kingdom' },
      'nissan-performance': {
        title: 'Software Engineer – Powertrain Performance',
        location: 'Greater Barcelona Metropolitan Area',
      },
      'seat-swe': { title: 'Software Engineer', location: 'Greater Barcelona Metropolitan Area' },
      'rfea-scrutineer': {
        title: 'Technical Scrutineer',
        location: 'Circuito Ricardo Tormo and Valencia Street Circuit, Valencia',
      },
    },
    highlights: {
      rfea: {
        label: 'Championships & events',
        items: [
          'European Formula 1 Grand Prix',
          'EuroOpen F3',
          'F3 EuroSeries',
          'World Touring Car Championship',
          'Deutsche Tourenwagen Masters',
        ],
      },
    },
    labels: { period: 'Period', role: 'Role', technologies: 'Technologies', location: 'Location' },
  },
  books: {
    heading: 'Library',
    byAuthor: 'by',
    close: 'Put the book back',
    coverPending: 'Cover image coming soon',
  },
};

export default en;
