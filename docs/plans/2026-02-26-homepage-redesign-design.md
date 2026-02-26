# Homepage Redesign Design

**Date:** 2026-02-26
**Status:** Approved

## Overview

Redesign the playground homepage from a plain bulleted list to an engaging animated card gallery that showcases interactive demos with programmatically generated preview animations.

## Goals

- Make the homepage visually engaging and fun
- Help visitors discover and explore demos effectively
- Showcase what each playground does without requiring clicks
- Match the playful "playground" brand personality
- Maintain ease of navigation

## User Requirements

- **Primary goal:** Discovery and exploration
- **Content:** Both visual previews and text descriptions
- **Layout:** Card grid layout
- **Visuals:** Programmatically generated previews
- **Personality:** Playful and fun

## Design Approach: Animated Card Gallery

A responsive grid of interactive cards with programmatically generated preview canvases. Each card shows a live mini-version or simplified animation representing the demo.

### Why This Approach

- Most engaging and true to "playground" spirit
- Previews are functional (simplified versions of real demos)
- No image maintenance - previews are code-based
- Shows off animation/interactivity capabilities immediately
- Balances complexity with maintainability

## Layout & Structure

### Hero Section

- Large heading "Playground" with subtle animated gradient or motion effect
- Updated tagline: "Interactive experiments with web technologies" (or similar)
- Optional: Subtle background animation or particle effect

### Card Grid

- Responsive breakpoints:
  - Mobile (< 640px): 1 column
  - Tablet (640px - 1024px): 2 columns
  - Desktop (> 1024px): 3 columns
- Max container width: `max-w-6xl` (maintains existing constraint)
- Grid gap: `gap-6` or `gap-8` for breathing room
- Each card is a clickable link wrapping the entire component

### Card Design

- Aspect ratio: ~16:10 or 4:3 for visual consistency
- Rounded corners: `rounded-xl` or `rounded-2xl`
- Shadow: `shadow-md` default, `shadow-xl` on hover
- White/light background
- Preview area: 60-70% of card height (top)
- Text area: 30-40% of card height (bottom)
  - Title: `font-bold text-lg`
  - Description: `text-sm text-gray-600` (1-2 sentences)

### Hover Interactions

- Transform: `scale-105`
- Shadow enhancement
- Preview animation intensifies or changes
- Smooth transitions: `transition-all duration-300`
- Optional: Slight tilt effect using Motion library

## Preview Animations

### Technical Implementation

- **Engine:** Canvas API for most previews (performance)
- **Animation:** RequestAnimationFrame for 60fps
- **Lifecycle:** React `useEffect` with proper cleanup
- **Visibility:** Intersection Observer to pause off-screen animations
- **Timing:** Most animations loop every 3-5 seconds

### Individual Preview Concepts

| Playground | Animation Concept |
|------------|-------------------|
| Spirograph | Animated drawing of spirograph pattern, continuous loop |
| Homer | Eyes following cursor (simplified) |
| Lights Out | Animated grid with lights toggling in pattern |
| Rock Paper Scissors | Rotating/cycling icons |
| Number Guesser | Animating numbers counting or shuffling |
| Unit Price | Animated bar chart or price comparison |
| Gradients | Shifting color gradients |
| Graphs | Animated node connections or data viz |
| Planets | Orbiting circles with trails |
| Food Analyzer | Icon animations or food-related graphics |
| Subgrid Cards | Mini version of card layout itself |
| Animate/Motion/Trees | Abstract animated shapes |

## Visual Design

### Color & Typography

- Font: Roboto Slab (existing)
- Palette: Vibrant, playful colors
- Option: Unique accent color per card or consistent palette
- Text: Dark on light for readability
- Preview backgrounds: Subtle gradients or solid colors

### Responsive Behavior

- Mobile: Full width cards, touch-friendly sizing
- Tablet: 2-column balanced layout
- Desktop: 3-column optimal scanning
- Animations adapt to smaller sizes if needed

## Component Architecture

### File Structure

```
src/app/page.tsx                          # Main homepage
src/app/_components/PlaygroundCard/
  ├── index.tsx                           # Barrel export
  ├── PlaygroundCard.tsx                  # Card wrapper component
  └── types.ts                            # TypeScript types

src/app/_components/PlaygroundPreviews/
  ├── index.tsx                           # Barrel export
  ├── SpirographPreview.tsx
  ├── HomerPreview.tsx
  ├── LightsOutPreview.tsx
  ├── RockPaperScissorsPreview.tsx
  ├── NumberGuesserPreview.tsx
  ├── UnitPricePreview.tsx
  ├── GradientsPreview.tsx
  ├── GraphsPreview.tsx
  ├── PlanetsPreview.tsx
  ├── FoodAnalyzerPreview.tsx
  ├── SubgridCardsPreview.tsx
  ├── AnimatePreview.tsx
  ├── MotionPreview.tsx
  ├── TreesPreview.tsx
  └── types.ts                            # Shared preview types
```

### Component Hierarchy

1. **page.tsx** - Maps over playground data array, renders grid
2. **PlaygroundCard** - Receives metadata, handles hover/linking
3. **Preview components** - Self-contained canvas/SVG animations

### Data Structure

```typescript
interface PlaygroundItem {
  id: string;
  title: string;
  description: string;
  href: string;
  preview: React.ComponentType;
  accentColor?: string;
}
```

Playground data array lives in homepage file, making it easy to add/remove/reorder.

## Implementation Details

### Performance Optimizations

- Use `next/dynamic` for lazy loading preview components
- Intersection Observer to only animate visible cards
- CSS transforms for hover effects (GPU accelerated)
- Lightweight canvas animations prioritizing smoothness

### Accessibility

- Semantic HTML with proper link elements
- Preview canvases: `aria-hidden="true"` (decorative)
- Clear focus indicators for keyboard navigation
- Sufficient color contrast for text

### Preview Animation Patterns

- `useEffect` with `requestAnimationFrame` loops
- Canvas refs with proper cleanup
- Pause animations when off-screen
- Consistent timing across previews

## Future Extensibility

- Add new playgrounds: add data entry + create preview component
- Preview components are independent and swappable
- Could add filtering, search, or categories later
- Data structure supports additional metadata (tags, dates, etc.)

## Content: Playground Descriptions

Descriptions will be written based on demo functionality, keeping them concise (1-2 sentences) and engaging.

## Success Criteria

- Homepage is visually engaging with personality
- Each demo is understandable at a glance
- Smooth animations on modern devices
- Responsive across all breakpoints
- Easy to add new playgrounds
- Maintains performance with all animations running
