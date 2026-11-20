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

## 2026-11-20 · Resume guided exploration from the saved prompt

Show one authored prompt at a time so families can pause between observations. Save for later records the current prompt and all notes on the exploration itself. Finishing updates the same record and can add a follow-up question. Existing explorations retain their original eight note positions and are treated as complete.

## 2026-11-20 · Make details optional and preserve links during edits

Quick capture needs one sentence and can include an image. Families can expand details when they want to capture more. Edits keep original record IDs and existing links. A linked question is a journal entry in its own right, so clearing a note keeps the question entry. New exploration follow-ups have an explicit link. Adding a follow-up to a previously empty prompt creates a linked question. Older unlinked follow-up text has no reliable identity to match automatically, so editing it keeps it in the exploration.

## 2026-11-20 · Offer a browser-local journal export

Keep the existing storage key and add draft metadata as optional fields. Export a versioned JSON snapshot with all records, relationships, and stored images. The file is a portable copy. The library explains that this version cannot restore the file. Import and cross-device sync remain future decisions.

## 2026-11-20 · Protect exploration drafts across tabs

Use a browser storage lock where Web Locks is available to serialize journal writes. An exploration form keeps the version it opened with so a save can detect a change made in another tab. If a save conflicts or storage fills up, keep the edits on screen and show a message. Completed explorations can jump directly to a prompt and save all notes from any step.
