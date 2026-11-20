# Decisions

Record significant product and technical choices here. For each entry, add the date, what was decided, why, and what it means for future work. When a decision changes, add a new entry and link it from the earlier one.

## 2026-11-20 · Start with a family journal

The prototype centers on five screens that take families from noticing to revisiting. A six-year-old and a parent are the first use case within the broader 3–9 age range. This gives us a concrete way to evaluate language, pacing, and how much support a parent needs.

## 2026-11-20 · Use authored inquiry prompts for v0.1

Daily prompts and exploration questions are written into the app. This lets us test the inquiry sequence and its language directly. If AI is introduced, its first role should be helping the family decide what to notice or try next.

## 2026-11-20 · Use a static React and TypeScript app

Vite provides the development server and production build. A shared stylesheet handles the responsive journal interface, and hash-based navigation supports direct links without server routing. The private static preview uses the hosting service’s sign-in gate. The journal app itself uses no account setup.

## 2026-11-20 · Keep journal data on the device for the first prototype

The versioned browser storage adapter saves observations, questions, explorations, and resized attachments. This keeps the prototype usable without a journal backend. Entries are specific to the browser and site URL, and clearing site data removes them. A future storage change needs a migration path for existing journals.

## 2026-11-20 · Keep project guidance in the repository

Start feature work by reading the root guidance and the four project documents. Update the roadmap and decisions log after significant changes so future work starts from the project’s actual state and the reasoning behind it.
