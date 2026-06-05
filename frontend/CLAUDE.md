# Frontend Design Patterns

## Visual direction
- Treat `Crear un login` only as a temporary visual reference; do not import, depend on, or link code to that folder.
- Use a high-contrast, editorial look: dark hero areas, light content surfaces, and a warm gold accent.
- Favor layered backgrounds with glow shapes, subtle borders, and soft shadows instead of flat single-color screens.
- Keep the interface compact and readable on mobile, but let key screens feel more expansive on tablet or web.

## Login pattern
- Use a split feeling even on a single screen: a branded hero area first, then a focused form card.
- Make the hero section expressive with short microcopy, bold title text, and small supporting stats.
- Use a gold primary action button, neutral inputs, and clear feedback states for loading, success, and error.
- Keep the form simple and avoid extra login distractions unless they support the core flow.

## Dashboard pattern
- Start the dashboard with a premium hero panel that summarizes the current role and next action.
- Present modules as cards with a compact icon block, strong title, supporting description, and a clear affordance.
- Use one dominant accent color for highlights, callouts, and active controls.
- Prefer stacked sections over dense grids when the content is operational rather than decorative.

## Implementation rules
- Reuse existing themed primitives, spacing tokens, and safe-area wrappers where possible.
- Keep layout logic in the screen file unless a reusable pattern clearly belongs in a shared component.
- Match the tone of the example design: cinematic, confident, and polished, but still practical for a school app.
- Do not hard link styles or components to the temporary example folder, because it will be removed.
