# Couples Timer - Web Application

## Project Overview

The Couples Timer is a React/TypeScript web application designed to facilitate structured couple conversations based on the Moeller method. It provides a neutral, "unbendable" framework that strictly controls speaking times, order, and breaks, allowing couples to focus on content and relationship rather than timing or meta-discussions.

### Key Features

- **Four Session Modes**: Maintain, Commitment, Listening, and Custom modes with predefined phase sequences
- **Timer-Based Structure**: Countdown timers with digital display and visual progress indicators
- **Audio Signals**: Six Klangschalen (singing bowl) sounds triggered at specific events (session start, slot end, transition end, etc.)
- **Guidance Tips**: Contextual tips displayed during preparation, transition, and cooldown phases
- **Custom Sequence Builder**: Allows creating and saving custom session sequences
- **High Visual Quality**: Calm, therapeutic UI with smooth transitions and professional aesthetics
- **Localization**: Full DE/EN language support
- **Participant Personalization**: Custom names and colors for each participant (Phase 11)
- **Full-Screen Focus Mode**: Distraction-free session experience

### Architecture

The application follows a clean architecture with clear separation of concerns:

- **Domain Layer**: Pure TypeScript domain models and the SessionEngine state machine
- **Service Layer**: Browser-specific APIs (Audio, Storage, Timer) and business logic services
- **View Model Layer**: Connects domain state to UI components
- **UI Layer**: React components using Tailwind CSS and Framer Motion
- **Context Layer**: React Context for state management and sharing

## Building and Running

### Prerequisites
- Node.js 20+ 
- npm or pnpm

### Installation & Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Run linter
npm run lint

# Run formatter
npm run format

# Deploy (builds and deploys to gh-pages)
npm run deploy
```

### Available Scripts
- `dev`: Starts development server with hot module replacement
- `build`: Compiles TypeScript and builds production bundle
- `lint`: Checks code for linting issues
- `preview`: Locally preview production build
- `test`: Runs unit and component tests with watch mode
- `test:run`: Runs tests once without watch mode
- `test:e2e`: Runs Playwright end-to-end tests
- `format`: Formats code using Prettier
- `deploy`: Builds and deploys to GitHub Pages

## Development Conventions

### Code Style
- TypeScript 5+ with strict typing
- ESLint configured with recommended rules
- Prettier for consistent formatting
- React hooks with exhaustive dependency arrays
- Functional components with TypeScript interfaces

### Testing
- Vitest for unit tests
- React Testing Library for component tests
- Playwright for end-to-end tests
- Minimum 80% test coverage for domain models and SessionEngine
- Comprehensive integration tests for UI flows

### UI/UX Guidelines
- Calm, therapeutic color palette with blues and soft violets
- High contrast for accessibility (WCAG 2.1 AA compliance)
- Smooth animations using Framer Motion
- Responsive design for 320px to 1440px viewports
- Focus on visual quality and clarity
- Minimal controls per screen to maintain focus

### Project Structure
```
src/
├── assets/              # Static assets
├── components/          # UI components
├── contexts/            # React Context providers
├── domain/              # Core business logic (TypeScript only)
├── i18n/                # Internationalization files
├── pages/               # Top-level page components
├── services/            # Service layer (Audio, Storage, Timer)
├── test/                # Test utilities
├── viewModel/           # View model layer (deprecated folder - see viewmodels)
├── viewmodels/          # View model layer (replaces viewModel)
├── App.tsx              # Main application component
├── index.css            # Global styles
└── main.tsx             # Application entry point
```

### Key Types and Concepts
- **SessionEngine**: Central state machine controlling session flow, timing, and audio
- **SessionMode**: Predefined session configurations (Maintain, Commitment, Listening, Custom)
- **PhaseType**: Different phases (prep, slotA, slotB, transition, closing, cooldown)
- **Speaker**: Represents the active speaker (A, B, or None)
- **GuidanceLevel**: Controls when tips are shown (minimal, moderate, high)
- **SessionState**: Current session status (idle, running, paused, finished)

### Domain Model Flow
1. User selects a session mode
2. SessionEngine initializes with the mode and participant configuration
3. Internal timer tracks elapsed time and triggers phase transitions
4. Audio events are triggered at specific transition points
5. UI components subscribe to state changes and update accordingly
6. Session ends automatically when all phases are completed

### Accessibility
- All UI components should meet WCAG 2.1 AA standards
- Proper contrast ratios (minimum 4.5:1) for text on backgrounds
- Semantic HTML elements
- Proper ARIA attributes where needed
- Keyboard navigation support
- Screen reader compatibility

### Internationalization
- All user-facing strings must be localized using i18next
- Support for both German (DE) and English (EN)
- Language can be switched dynamically and persists in localStorage
- Placeholders in strings should be properly handled for translations