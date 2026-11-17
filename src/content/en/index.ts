import type { LocaleContent } from '../types';
import { owner } from '../shared/owner';

const en: LocaleContent = {
  ui: {
    siteTitle: "The Engineer's Garage",
    loading: 'Opening the garage',
    loadingHint: 'Loading the workshop…',
    loadingStages: { engine: 'Loading the 3D engine…', scene: 'Preparing the garage…', ready: 'Opening the garage' },
    boot: {
      preparing: 'Preparing your space…',
      ready: 'Ready',
      stepOf: '{n} of {total}',
      slow: 'This is taking longer than usual on this device. You can keep waiting, or open the simple version now.',
      steps: {
        engine: 'Starting the 3D engine',
        room: 'Building the garage',
        workspace: 'Setting up the workspace',
        library: 'Arranging the library',
        car: 'Bringing in the car',
        storm: 'Letting the storm in',
        materials: 'Preparing materials',
        reflections: 'Capturing reflections',
      },
    },
    loadError: {
      title: "The garage couldn't open",
      body: 'Something went wrong while starting the 3D scene. You can try again, or read everything in the simple version.',
      retry: 'Try again',
      continue2d: 'Continue to the simple version',
    },
    welcomeLabel: 'Welcome note',
    enter: 'Enter',
    backToGarage: 'Back to the garage',
    skipIntro: 'Skip intro',
    language: 'Language',
    languageNames: { en: 'English', es: 'Español' },
    present: 'Present',
    pendingContent: 'Details coming soon.',
    reducedMotionNotice: 'Reduced motion is on: camera moves are shortened.',
    exploreHint: {
      mouse: 'Click the MacBook, the iPad, the car door or the bookshelf to explore.',
      touch: 'Tap the MacBook, the iPad, the car door or the bookshelf to explore.',
      keyboard: 'Press Tab to choose a place, then Enter to go there.',
    },
    placesLabel: 'Places in the garage',
    fallback: {
      title: "The Engineer's Garage",
      reasons: {
        unsupported: "Your browser or device can't run the 3D garage, so here's the essential content instead.",
        chosen: "You're viewing the simple version: the essential content, without the 3D garage.",
        failed: "The 3D garage couldn't load this time, so here's the essential content instead.",
      },
      viewAnyway: 'Try the 3D version anyway',
      open3D: 'Open the 3D garage',
      retry3D: 'Try the 3D garage again',
    },
    objects: {
      macbook: 'MacBook Pro — read the welcome note',
      ipad: 'iPad Pro — Apple platforms portfolio',
      desk: 'Desk',
      tesla: 'Workshop — Tesla Model 3',
      bookshelf: 'Bookshelf — personal library',
      teslaDoor: 'Tesla Model 3 driver door — automotive portfolio',
      carLaptop: 'Laptop on the driver seat — open the automotive portfolio',
    },
    shots: {
      macbookIntro: 'Welcome',
      overview: 'Garage overview',
      desk: 'Desk',
      macbook: 'MacBook',
      ipad: 'iPad',
      bookshelf: 'Bookshelf',
      tesla: 'Workshop',
      teslaInterior: 'Car interior',
      teslaLaptop: 'Automotive portfolio',
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
  macbook: {
    appName: 'Notes',
    folder: 'Javier',
    notes: {
      welcome: 'Welcome',
      about: 'About me',
      experience: 'Experience',
      skills: 'Skills',
      projects: 'Side projects',
    },
    labels: {
      sections: 'Portfolio sections',
      explore: 'Explore my portfolio',
      close: 'Close and return to the garage',
      backToWelcome: 'Back to the welcome note',
      backToProjects: 'All side projects',
      openLink: 'Open',
      opensInNewTab: 'opens in a new tab',
      status: 'Status',
      links: 'Links',
    },
    about: {
      heading: 'About me',
      combinesLabel: 'My profile combines',
      combines: [
        'iOS software engineering',
        'Automotive software engineering',
        'Technology and software architecture',
        'The Apple ecosystem',
      ],
      paragraphs: [
        'I started my career as a software engineer developing powertrain embedded software at companies like Nissan and SEAT.',
        'I then moved to software engineering for Apple platforms, working for companies such as Banc Sabadell, Banco Santander and Inditex.',
        'As a software engineer I am very focused on architecture, performance and security decisions. My job also involves conducting technical interviews, mentoring newcomers and serving as a technical reference.',
        'I have also worked with startups developing MVPs, and I like to work on my own side projects.',
      ],
    },
    experience: {
      heading: 'Professional experience',
      intro: 'Software development for Apple platforms.',
      timeline: 'Career timeline',
      role: 'Role',
      rolePending: 'Role details coming soon.',
      period: 'Period',
      description: 'Description',
      showDetails: 'Show details',
      hideDetails: 'Hide details',
    },
    skills: {
      heading: 'Technical skills',
      groups: {
        languages: { label: 'Languages & frameworks', items: ['Swift', 'Objective-C', 'UIKit', 'SwiftUI'] },
        architecture: { label: 'Architecture', items: ['MVC', 'MVVM', 'MVP', 'VIPER', 'MV', 'TCA'] },
        quality: {
          label: 'Quality & delivery',
          items: ['Unit testing', 'UI testing', 'End-to-end testing', 'Test coverage', 'App Store Connect', 'TestFlight', 'App Store releases'],
        },
        practices: {
          label: 'Engineering practices',
          items: ['Architecture and performance decisions', 'Security decisions', 'Technical interviews', 'Mentoring', 'iOS Technology Focal'],
        },
      },
    },
    projectsHeading: 'Side projects',
    projectsIntro: 'Things I build on my own time. Select a project to see its details.',
    // Project texts approved by the owner (incl. the PROOF beta-tester line and the Swift courses description).
    projects: {
      writingfree: {
        description:
          'A clean, focused and distraction-free place to write down your thoughts. An on-device AI model offers helpful insights about your writing.',
        status: null,
      },
      necktimer: {
        description:
          'An app that helps people become more aware of their back posture and prevent injuries, using AirPods accelerometer signals to detect posture.',
        status: null,
      },
      proof: {
        description:
          'Helps you know which images are trustworthy in a world where seeing is no longer believing. The beta-tester community is growing.',
        status: 'In development',
      },
      'swift-courses': {
        description: 'Learning resources for the developer community.',
        status: null,
      },
    },
  },
  ipad: {
    appName: 'Career',
    home: {
      eyebrow: 'iOS engineering',
      title: 'My evolution as an iOS engineer',
      subtitle: 'Explore the timeline, the technologies and patterns I work with, and my engineering and mentoring responsibilities.',
    },
    sections: {
      timeline: { title: 'Career Timeline', intro: 'Building for Apple platforms, from 2020 to today. Select a company to see the details.' },
      ios: { title: 'iOS Engineering', intro: 'The languages and UI frameworks I use to build for Apple platforms.' },
      architecture: { title: 'Architecture', intro: 'Architectural patterns I work with.' },
      practices: { title: 'Engineering Practices', intro: 'Testing and quality, app delivery and technical decisions.' },
      leadership: { title: 'Leadership & Mentoring', intro: 'Responsibilities documented in my professional experience.' },
    },
    labels: {
      sections: 'Career sections',
      overview: 'Overview',
      close: 'Close and return to the garage',
      role: 'Role',
      period: 'Period',
      selectHint: 'Select a company',
      closeDetail: 'Close details',
      generalOverview: 'General overview',
      generalNote: 'Short, general descriptions of each pattern — not tied to a specific company or project.',
      context: 'Context',
    },
    ios: { languages: 'Languages', uiFrameworks: 'UI frameworks' },
    architecture: {
      patterns: {
        mvc: { expansion: 'Model–View–Controller', summary: 'Separates data, presentation and the controller that coordinates them. The traditional UIKit pattern.' },
        mvvm: { expansion: 'Model–View–ViewModel', summary: 'A view model exposes presentation state that the view observes and renders.' },
        mvp: { expansion: 'Model–View–Presenter', summary: 'A presenter holds the presentation logic and drives a passive view.' },
        viper: { expansion: 'View–Interactor–Presenter–Entity–Router', summary: 'Splits each module into single-responsibility layers, including navigation.' },
        mv: { expansion: 'Model–View', summary: 'SwiftUI views observe models directly, without an intermediate layer.' },
        tca: { expansion: 'The Composable Architecture', summary: 'State, actions and reducers composed into a single, testable store.' },
      },
    },
    practices: {
      testing: { label: 'Testing and quality', items: ['Unit testing', 'UI testing', 'End-to-end testing', 'Test coverage'] },
      delivery: { label: 'App delivery', items: ['App Store Connect', 'TestFlight', 'App Store releases'] },
      technical: { label: 'Technical engineering', items: ['Architecture decisions', 'Performance decisions', 'Security decisions'] },
    },
    leadership: {
      items: {
        techReference: 'iOS technical reference',
        interviews: 'Technical interviews',
        mentoring: 'Mentoring new team members',
        guidance: 'Technical guidance',
        decisions: 'Engineering decisions',
      },
    },
  },
  windows: { start: 'Start', clock: '23:47' },
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
      // Owner-approved roles and descriptions (source of truth — do not edit wording).
      sabadell: {
        role: 'iOS Software Engineer',
        description:
          "Developed new features for the bank's iOS application. Also participated in technical interviews for engineering candidates and mentored new team members joining the team.",
      },
      misfits: {
        role: 'Founder & iOS Engineer',
        description:
          'Founded and lead Misfits Studio, managing and developing projects from the ground up for startups and small businesses. I take on both Product Manager and Software Engineer responsibilities, overseeing the product development process from initial concept to implementation.',
      },
      inditex: {
        role: 'iOS Engineer',
        description:
          "Developed new features for the company's iOS applications while acting as the iOS technical reference, providing technical guidance and supporting engineering decisions on the iOS side.",
      },
      santander: {
        role: 'iOS Software Engineer',
        description: "Developed new features for the bank's iOS application and mentored new team members joining the team.",
      },
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
      'nissan-etb-bcn': { title: 'Software Engineer – Powertrain ETB', location: 'Barcelona, Spain' },
      'nissan-etb-cranfield': { title: 'Software Engineer – Powertrain ETB', location: 'Cranfield, United Kingdom' },
      'nissan-performance': {
        title: 'Software Engineer – Powertrain Performance',
        location: 'Barcelona, Spain',
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
    portfolio: {
      sections: { overview: 'Overview', nissan: 'Nissan', seat: 'SEAT', rfea: 'RFEDA', technologies: 'Technologies' },
      overviewIntro: 'Powertrain software engineering and motorsport technical scrutineering, 2010–2019.',
      timeline: 'Career timeline',
      openCompany: 'Open',
      locations: 'Locations',
      events: 'Championships & events',
      positions: 'Positions',
      technologiesIntro: 'Technologies and practices recorded for my automotive roles.',
      techAt: 'At',
      closePortfolio: 'Close the portfolio',
      start: 'Start',
      navLabel: 'Portfolio sections',
      selectLaptop: 'Select the laptop to open the automotive portfolio.',
      venues: ['Circuito Ricardo Tormo', 'Valencia Street Circuit'],
    },
  },
  books: {
    heading: 'Library',
    byAuthor: 'by',
    close: 'Put the book back',
    coverPending: 'Cover image coming soon',
    selectHint: 'Select a book to take it off the shelf.',
    listLabel: 'Books on the shelf',
    firstPublished: 'First published',
    // Short factual summaries of each book's subject (see docs/OUTSTANDING.md — pending owner approval).
    descriptions: {
      sapiens: 'A history of humankind, from the emergence of Homo sapiens to the present day.',
      dinosaurs: 'A history of the dinosaurs, from their origins to their extinction, based on fossil evidence.',
      'emperor-maladies': 'A history of cancer, from its earliest descriptions to modern treatment and research.',
    },
  },
  contact: {
    heading: 'Contact',
    links: { linkedin: 'LinkedIn profile', github: 'GitHub profile' },
    website: 'Website',
    websiteOf: '{name} website',
  },
};

export default en;
