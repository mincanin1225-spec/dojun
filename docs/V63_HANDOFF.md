# v63 inventory workflow handoff

## Changes
- Replace v62 loader with meal-stock-v63.js and meal-workflow-v63.js; retain v62 file for history only.
- Actual mText/isDel determine planning; manually edited menus require confirmed quantities.
- Prepared bases, sides, complete meals and cubes allocated once across the seven-day planning window by grams. 잡곡무른죽 maps to 잡곡무른밥.
- Confirmed cooking consumes inputs, creates reusable dated portions. Repeated submission token is idempotent.
- Explicit feeding action on preparation/day screens consumes only cooked stock; reaction buttons do not imply stock usage. Feeding reversal supported, blocked if original lot cannot be identified.
- Partial portions retained as separately labelled residual lots. No silent rounding-up loss.
- Local journal rollback on storage errors. Raw sharing occurs only after successful local commit.
- Confirmed recipe quantities/steps can be stored per menu or component. Missing base quantity can expand to raw ingredients only when its recipe is supplied.
- One canonical version v63 and service worker cache updated together.

## Verification
- 29 active CI scripts pass locally, including engine and UI-handler VM integration tests.
- Engine: prepared 50g x10 allocation, cross-date allocation, cooking, exact leftovers, idempotency, feeding, undo, shortage, raw-feed rejection, invalid numbers, deleted lot, cumulative requirements, recipe expansion.
- UI handler: submit, feed, cancel, write-failure rollback, manual edits/deletes, saved recipe persistence.
- Three archived test scripts outside active CI (v26-entry, v27-entry, v49-ppeuni-verified) retain obsolete assumptions; not changed.
- Real browser/Android verification not performed: installed Playwright has no Chromium executable.

## Limits / next steps
- No verified per-menu original cooking instructions found in this repository. Generic fabricated v62 directions removed. Obtain original recipe pages before filling instructions or unknown ingredient quantities.
- Cooked stock and recipes remain device-local, as in v61. Not a family-sync transaction system.
- Existing v62 transactions cannot be reliably undone retrospectively because v62 did not retain complete consumption receipts. Preserve existing balances; reconcile with user if v62 was used.
- Full integrated visual/mobile acceptance remains required. Do not equate GitHub Pages deployment success with this acceptance.
- Legacy weekList remains in old views; management shop/prep use the new shared engine. Recipe weights outside confirmed stages remain unknown until saved.
