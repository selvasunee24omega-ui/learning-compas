# Roadmap

This roadmap records current scope and proposed work. Order the next changes using evidence from family use.

## Version 0.1 shipped

- Responsive Today, Observe, Wonder, Explore, and Discovery Library screens.
- Rotating daily observation prompts, ordinary-material activities, and sample entries.
- Browser-local records, linked questions, inquiry notes, and optional image attachments.
- Production build passed. Automated checks covered creating and revisiting entries, discovery filtering, and persistence on a fresh load.
- The private preview is deployed. Live mobile layout and photo upload still need hands-on verification.

## v0.1 journal improvements in review

- Guided Explore presents one prompt at a time, supports skipping and revisiting steps, and resumes a saved draft at the same prompt.
- Observe can save one sentence and an optional image immediately. Location, date, sensory details, surprises, and related questions are available under optional details.
- The library supports editing existing entries and downloading an image-inclusive JSON copy of the journal.
- The production build and Chromium checks at 390 px and 1280 px passed for keyboard navigation, quick capture, attachments, editing, legacy links, save and resume after reload, and export. Family use remains the next validation.

- Review follow-up adds direct prompt navigation when editing, guards against stale exploration saves, and explains the export’s restore limit. The browser regression script covers two-tab finishing, image processing and removal, storage quota recovery, and legacy records.

## v0.2 adaptive inquiry in review

- Offer a single optional invitation after a noticing or question. Families can change approaches, skip, save, or stop. Reported words can change the next suggestion.
- Save and revisit inquiry moments, including photos and drawings. Older eight-note explorations and their saved drafts remain available in the journal.
- Use deterministic recommendations in the browser. Test the rules with families before considering a service.

## Next validation

- Try a short observation and exploration with a parent and six-year-old. Note which prompts lead to looking, talking, making, or a follow-up question.
- Run the journal flow on a phone and desktop, including choosing a photo or drawing, saving it, and reopening the entry.
- Use that feedback to decide which prompt, screen, or step to simplify first.

## Later candidates

- Evaluate whether families need to restore a downloaded journal or move it to another device.
- Revisit accounts, database storage, and cross-device access if families need them. Plan how existing browser-local journals would move before changing storage.
- Explore optional AI-assisted inquiry after identifying where families need more help choosing what to observe or try.

After significant work, record the actual status and verification here and add the corresponding decision to [DECISIONS.md](DECISIONS.md).
