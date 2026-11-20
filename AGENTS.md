# Working on Learning Compass

Learning Compass is an inquiry-based companion for families with children aged 3–9. The first prototype is designed around a parent exploring with a six-year-old. Help families notice, wonder, make, and reflect together through ordinary experiences.

## Before implementing a feature

Read all four project documents. Use the roadmap to understand the current priorities and the decisions log to understand the reasoning behind existing choices.

- [Product vision](docs/PRODUCT_VISION.md)
- [Pedagogy](docs/PEDAGOGY.md)
- [Roadmap](docs/ROADMAP.md)
- [Decisions](docs/DECISIONS.md)

## Learning and design principles

- Use **Experience → Observe → Wonder → Explore → Understand → Create → Reflect** as a pedagogical reference. Offer one optional invitation at a time and let families change approach, save, or stop. Give the child time to observe and form a question before offering an explanation.
- Keep prompts open-ended, concrete, and short. Suggest things families can try with ordinary materials or outdoors. Give children room to pause, make a guess, change their minds, or choose another question.
- Connect sensory observation with making, emotional awareness, and quiet reflection. Make the activity itself the focus of the experience.
- Use warm ivory, terracotta, sage, and muted earth tones. Favor restrained editorial typography, whitespace, organic shapes, and occasional natural texture. Use the visual language of a field journal. Avoid classroom worksheets, rewards, streaks, and chat-first layouts.
- Design for phones and desktops. Use semantic controls, labeled fields, visible focus, and clear feedback when something is saved or needs attention.

## Technical conventions

- Keep the Vite, React, and TypeScript setup simple. Use the shared styles in `src/style.css` and reuse existing components and patterns where they fit.
- Keep journal record types and browser persistence behind the adapter in `src/journal.ts`. Preserve existing entries and observation–question–exploration links when changing the data model. Plan and verify a compatible migration before changing the storage format.
- Keep adaptive recommendations behind the suggestion engine interface. Explain why a routine was suggested and let a parent override it. Any future external service needs explicit parent consent and control over what leaves the browser.
- Keep notes, photos, and drawings browser-local under the current prototype scope. Treat account creation, shared storage, and AI as future product decisions.
- Keep changes scoped to the feature and follow the existing naming and formatting where practical. Document meaningful architectural or product tradeoffs.

## Development workflow

1. Read the project documents, inspect the relevant code, and check the working tree.
2. Identify the family activity or journal flow the change supports. Implement it through the app’s normal navigation and preserve existing behavior outside the requested scope.
3. Use Node.js 22 or later. Run `npm install` when setting up the checkout, `npm run dev` for local development, and `npm run build` to check types and generate the production files.
4. Verify the affected flow and report any verification gaps. For journal changes, save and revisit records after a reload. For interface changes, check both phone and desktop layouts when browser access is available.
5. After a significant change, update [ROADMAP.md](docs/ROADMAP.md) with what shipped and what remains, and update [DECISIONS.md](docs/DECISIONS.md) with the decision, rationale, and consequences. Update the vision or pedagogy when the change revises those principles.
