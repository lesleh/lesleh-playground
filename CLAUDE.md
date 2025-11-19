# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 playground application showcasing various interactive experiments and demos using React 19, TypeScript, Tailwind CSS, and state machines (XState v5). The project uses pnpm as its package manager.

## Common Commands

### Development
```bash
pnpm dev          # Start development server with Turbo
pnpm build        # Build production bundle
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

### Testing
```bash
pnpm test         # Run all tests with Jest
pnpm test:watch   # Run tests in watch mode
```

To run a specific test file:
```bash
pnpm test <path-to-test-file>
```

## Architecture

### Next.js App Router Structure

The project uses Next.js App Router with the following structure:
- `src/app/` - App Router pages and layouts
- `src/app/page.tsx` - Homepage with links to all playground demos
- `src/app/playgrounds/[name]/page.tsx` - Individual playground demos
- `src/components/` - Shared components (Heading, Link, Paragraph)
- `src/lib/` - Utility functions

### Playground Organization

Each playground demo follows this pattern:
```
src/app/playgrounds/[name]/
├── page.tsx                    # Main page component
├── _components/                # Demo-specific components
│   └── [Component]/
│       ├── index.tsx          # Barrel export
│       └── [Component].tsx    # Component implementation
├── _hooks/                     # Demo-specific hooks
└── _machines/                  # XState state machines
    └── [name]Machine.ts
```

Examples of playgrounds:
- `number-guesser` - Number guessing game with XState
- `lights-out` - Lights Out puzzle with auto-solver using Gaussian elimination
- `homer` - Interactive Homer Simpson demo
- `rock-paper-scissors` - Rock Paper Scissors game
- `unit-price` - Unit price calculator
- `gradients` - Gradient experiments
- `graphs` - D3.js graph visualizations
- `planets` - Animated planets using Motion
- `animate` - React Markdown animation demo

### State Management with XState

The project extensively uses XState v5 for complex interactive state management. State machines are located in `_machines/` folders within each playground.

Key patterns:
- Machine definitions use `createMachine` with typed contexts and events
- Actions defined using `assign` for immutable state updates
- Guards for conditional transitions
- Integration with React using `@xstate/react`

Examples:
- `numberGuessingGameMachine.tsx` - Game state with guess tracking
- `lightsOutMachine.ts` - Complex puzzle solver with randomization and auto-solve

### Component Patterns

Components follow a barrel export pattern:
- `index.tsx` - Exports component and types
- `[Component].tsx` - Component implementation
- `types.ts` - TypeScript types (when needed)

Shared components in `src/components/`:
- `Heading` - Semantic heading levels with consistent styling
- `Link` - Next.js Link wrapper with consistent styling
- `Paragraph` - Styled paragraph component

### Styling

- Tailwind CSS for all styling
- Global styles in `src/styles/globals.css`
- Custom Tailwind plugins for utilities like `.drag-none`
- Roboto Slab font loaded via `next/font/google`
- Typography plugin for markdown content

### Testing

- Jest with `@testing-library/react` for component tests
- Happy DOM as Jest environment (`@happy-dom/jest-environment`)
- Custom matchers in `jest.setup.ts`
- Tests located alongside source files (`.test.ts`, `.spec.tsx`)

### Key Dependencies

- **React 19** - Latest React with concurrent features
- **Next.js 15** - App Router with Turbo mode
- **XState v5** - State machine management
- **Motion** (alpha) - Animation library for playgrounds
- **D3** - Data visualization (graphs playground)
- **canvas-confetti** - Victory animations
- **react-markdown** - Markdown rendering
- **@faker-js/faker** - Test data generation

## TypeScript Configuration

- Strict mode enabled
- Target ES2020
- Path aliases not configured - use relative imports
- Custom Jest matchers defined in `jest.d.ts`
