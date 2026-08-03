---
name: Pique Design System
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#ccc3d8'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#958da1'
  outline-variant: '#4a4455'
  surface-tint: '#d2bbff'
  primary: '#d2bbff'
  on-primary: '#3f008e'
  primary-container: '#7c3aed'
  on-primary-container: '#ede0ff'
  inverse-primary: '#732ee4'
  secondary: '#bcff5f'
  on-secondary: '#203600'
  secondary-container: '#95e400'
  on-secondary-container: '#3d6200'
  tertiary: '#ffb3b0'
  on-tertiary: '#68000f'
  tertiary-container: '#b9383c'
  on-tertiary-container: '#ffdfdd'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#eaddff'
  primary-fixed-dim: '#d2bbff'
  on-primary-fixed: '#25005a'
  on-primary-fixed-variant: '#5a00c6'
  secondary-fixed: '#a8f928'
  secondary-fixed-dim: '#8fdb00'
  on-secondary-fixed: '#112000'
  on-secondary-fixed-variant: '#314f00'
  tertiary-fixed: '#ffdad8'
  tertiary-fixed-dim: '#ffb3b0'
  on-tertiary-fixed: '#410006'
  on-tertiary-fixed-variant: '#8c1520'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  headline-lg:
    fontFamily: Sora
    fontSize: 32px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Sora
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-sm:
    fontFamily: Sora
    fontSize: 20px
    fontWeight: '700'
    lineHeight: '1.2'
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Space Grotesk
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.05em
  stat-number:
    fontFamily: Sora
    fontSize: 28px
    fontWeight: '800'
    lineHeight: '1'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 32px
  xl: 48px
  container-margin: 20px
  gutter: 16px
---

## Brand & Style

This design system is built for a high-energy social gaming environment focused on competition and mutual accountability. The aesthetic blends **Modern Minimalism** with **Vibrant Cyberpunk** influences to create a "social gaming" atmosphere that feels urgent yet premium.

The visual language relies on deep dark backgrounds to allow high-vibrancy accent colors to "pop," mimicking the intensity of a gaming interface. It evokes a sense of momentum, achievement, and playful rivalry through the use of aggressive typography and soft, tactile surfaces.

**Key Principles:**
- **Kinetic Energy:** Use of saturated neons against deep blacks to direct focus.
- **Friendly Rivalry:** Softened corners (24px+) to keep the social aspect approachable despite the competitive nature.
- **Immediate Feedback:** Clear, large-scale interactive elements that respond instantly to user input.

## Colors

The palette is optimized for OLED screens and high-contrast environments.

- **Primary (Electric Violet):** Used for primary actions, progress indicators, and brand identity.
- **Success/Leadership (Lime Green):** Reserved for winning states, "Hecho" (Done) buttons, and leaderboards.
- **Urgency/Error (Coral):** Used for expiring challenges, missed streaks, or destructive actions.
- **Neutral/Background:** A deep #0A0A0A black for the base, with #1A1A1E used for secondary surfaces (cards, inputs) to create depth without relying on heavy shadows.

## Typography

The typography system prioritizes impact for headlines and utility for body text.

- **Headlines (Sora):** High-weight, geometric sans-serif for maximum "punch." Headlines should use tight tracking to feel more compact and competitive.
- **Body (Inter):** Highly legible, neutral font for challenge descriptions and rules.
- **Labels (Space Grotesk):** A technical, monospaced-leaning font used for status indicators, categories, and "Step" markers to reinforce the gaming aesthetic.

## Layout & Spacing

The system follows a **Mobile-First** approach (390px base width) with a focus on thumb-driven interaction.

- **Grid Model:** 4-column fluid grid for mobile.
- **Spacing Rhythm:** Based on an 8px scale. Generous vertical spacing (24px - 32px) is used between sections to prevent the dark UI from feeling claustrophobic.
- **Interaction Zones:** All primary buttons and navigation elements must maintain a minimum 56px height for accessibility and ease of use during active movement (e.g., while at the gym).

## Elevation & Depth

In this dark-mode design system, depth is communicated through **Tonal Layers** rather than traditional shadows.

- **Level 0 (Background):** Pure #0A0A0A.
- **Level 1 (Cards/Containers):** #1A1A1E. Use this for the main content blocks.
- **Level 2 (Inputs/Floating elements):** #27272A. Use for interactive fields inside Level 1 containers.
- **Accents:** Use semi-transparent Primary/Secondary glows (10-15% opacity) behind active cards to signify "current focus" or "winning status."

## Shapes

The shape language is characterized by exaggerated roundness to balance the aggressive color palette.

- **Primary Cards:** 24px corner radius creates a friendly, "app-like" container feel.
- **Buttons:** 16px radius. Large enough to feel tactile but distinct from the container shapes.
- **Avatars:** Always circular, featuring a 2px outer ring that reflects the user's current status (Primary color for active, Lime Green for leader).

## Components

### Buttons
- **Primary:** Electric Violet background, White text. Use a subtle glow effect on hover/press.
- **Success:** Lime Green background, Dark Grey (#1A1A1E) text for maximum legibility.
- **Ghost:** Transparent background with a 1px border of #27272A.

### Inputs
- Background: #1A1A1E.
- Border: 1px #27272A, changing to Primary on focus.
- Placeholder text: #71717A.

### Cards
- Always use the 24px radius. 
- Headers inside cards should use `label-caps` for metadata (e.g., "HOY · 10 PT").

### Navigation
- **Bottom Bar:** Blurred background (Glassmorphism) with 80% opacity #0A0A0A. 
- **Center Action:** The "plus" button should have a Primary color glow and be slightly elevated.

### Avatars & Status
- Avatars use progress rings to show challenge completion percentage.
- Streaks are represented by a Flame icon with the Coral color gradient.