# Improvised Meal Guide: Design

Date: 2026-11-11
Status: Draft for review
Source: `PRD.md` plus the decisions below. Where this document and the PRD disagree, this document wins.

## 1. Purpose and audience

A personal offline PWA for the author and a few friends. A user walks through six fixed steps, picks options, and gets a generated meal (a name, the picks, and a tip or two per ingredient). It helps someone improvise an easy meal without brainstorming from scratch.

Success criteria:

- Installs to the home screen on iOS and Android from a browser.
- After install, every feature works in airplane mode, indefinitely.
- User-created data survives app restarts and can be backed up and restored from a local file.
- Built-in content (options, compatibility rules, tips) is easy to edit without touching code.

Non-goals: accounts, backend, sync, AI generation, recipes (no instructions, quantities, or cook times), ingredient inventory, sharing or merging data between users.

## 2. Decisions that differ from or extend the PRD

| Topic | Decision |
| :--- | :--- |
| Audience | Author and friends only. No public release. |
| Hosting | Free static host (GitHub Pages) stays up as a dormant fallback for installs, updates, and recovery. No other hosting. |
| Backup | Local JSON export/import. Import replaces local user data (with confirm). |
| Stack | React, TypeScript, Vite, vite-plugin-pwa, Dexie, Vitest, fake-indexeddb. |
| Flow | Six fixed steps. No meal templates or formats. |
| Selection | Per-step single or multi select. Every step is skippable. |
| Filtering | Exclusion rules only. Everything is available unless a rule hides it. |
| Tips | Each tip attaches to exactly one option. No combination tips. |
| Meal content | Name, picks grouped by step, tips inline under each pick. No "ingredients" or "instructions" fields. |
| Deletion | Any option can be soft-deleted and restored. Saved meals can be hard-deleted behind a confirm. |
| Saved meal sort | Favorites first, then newest first. No other sort options. |

## 3. The meal-building flow

Steps, in order:

| # | Step | Selection |
| :-- | :--- | :--- |
| 1 | Starch/Base | single |
| 2 | Greens | multi |
| 3 | Protein | single |
| 4 | Filler Veggies | multi |
| 5 | Sauces | multi |
| 6 | Garnish/Texture | multi |

Every step can be skipped (no picks). After step 6 the app validates the meal.

### 3.1 Meal validation ("too thin")

A meal is acceptable only if both hold:

1. At least one pick comes from Starch/Base, Greens, or Protein.
2. Picks come from at least two different steps.

If not acceptable, show this message and reset the builder to step 1 with no picks kept:

> You've got to eat something and I know you can do better than that <3 Give it another try!

Coverage of the original conditions: no picks fails both; picks in one step fails rule 2; picks only from Filler Veggies, Sauces, and Garnish/Texture (any mix) fails rule 1. Greens + Sauces passes. This is a hard-coded function, not configuration.

### 3.2 Option filtering

`availableOptions(step, picks)` returns the options for a step, excluding:

- options the user soft-deleted,
- options that have a compatibility pair with any option already picked (in earlier steps, or earlier in the same multi-select step).

A pair is symmetric: it stores two option ids and applies in whichever order the options are encountered. If filtering leaves a step with no options, the step shows "Nothing fits with your picks, skip ahead" and Next still works.

### 3.3 Meal generation

`buildMeal(picks)` returns:

- **name**: see 3.4,
- **groups**: for each step with picks, the picked options in order, each with its tips (text only, ordered by tip order).

No other content is generated.

### 3.4 Auto-generated name

Pure string assembly from option names:

- Let `list` be the picked Protein, then Greens, then Filler Veggies (in that order). Sauces and Garnish/Texture never appear in the name.
- Join rules: one item `A`; two `A and B`; three `A, B, and C`; more than three: the first three followed by `& more` (`A, B, C & more`).
- With a Starch/Base pick: `{Starch} Meal with {list}`, or `{Starch} Meal` if `list` is empty.
- Without a Starch/Base pick: `{list} Meal`.

Examples: Rice + Chicken + Spinach gives "Rice Meal with Chicken and Spinach". Chicken + Spinach gives "Chicken and Spinach Meal".

On the result screen the name is pre-filled in an editable field. The user can accept it or retype it before saving.

## 4. Architecture

Three layers.

1. **Content** (read-only, bundled): one data file (JSON or TypeScript) with the built-in steps, options, compatibility pairs, and tips. Built-in ids are stable strings that never change.
2. **Logic** (pure TypeScript, no UI or database imports): `availableOptions`, `validateMeal`, `buildMeal`, name generation, tip lookup. A merge function combines built-in and user data into one list so the logic never cares about an option's origin.
3. **UI and storage**: thin React screens and Dexie for user data.

### 4.1 User data (IndexedDB via Dexie)

| Table | Fields |
| :--- | :--- |
| customOptions | id (UUID), stepId, name, note (optional), deleted |
| hiddenBuiltIns | optionId (built-in options the user deleted) |
| userPairs | id, optionIdA, optionIdB |
| userTips | id, optionId, text, order |
| savedMeals | id, name, groups (step name, option names, tip texts as plain text), isFavorite, createdAt |

Every option, built-in or custom, has an optional `note`: a few words shown on the option's card in the build step to add context (for example Sesame Seeds: "adds texture and good fats"). The field exists on all options to keep the schema uniform. The built-in content will fill it mainly for Sauces and Garnish/Texture. Notes are limited to about 40 characters so they fit on two lines, appear only on the step screen (not on the result screen or in saved meals, where tips do that job), and are not editable on built-in options in the first release.

Saved meals store plain text so deleting or changing options never changes them. Deleting an option leaves its pairs and tips in place, so restoring it brings them back.

### 4.2 Custom option compatibility

When a user adds an option, a checklist follows: every other option grouped by step, with a checkbox for each one it does NOT go well with. Checked items become `userPairs`. The user can also attach a tip to any option (built-in or custom) from the Options screen.

## 5. Screens

Bottom tab bar: Build, Saved, Options.

- **Build**: one step at a time, progress indicator ("Step 3 of 6"), tappable option cards in a two-column grid (bold name, with the option's optional note in smaller text underneath), Back keeps picks, Next doubles as Skip when nothing is picked. After step 6, validate. Failure shows the message and resets. Success goes to Result. Build state is in memory only.
- **Result**: name, picks grouped by step with tips inline under each option, editable name field (pre-filled), Save, Discard.
- **Saved**: list ordered favorites first then newest. Heart toggle per row. Tapping a row opens a read-only view of the snapshot with a Delete button behind a confirm.
- **Options**: options grouped by step. Add option (name and an optional short note, then the compatibility checklist), add tip to any option, delete (hide) any option, "Hidden options" list to restore, Export, Import, and a "last backed up N days ago" note.

### 5.1 Visual design

Mood: calm, gentle, cute, with muted but playful colors, in the spirit of apps built to be friendly to people with ADHD. Reference: `docs/mockups/mockup-v1.html` (approved direction, six screens).

**Colors** (CSS custom properties on `:root`):

| Token | Value | Use |
| :--- | :--- | :--- |
| `--bg` | `#FBF6EE` | App background (warm cream) |
| `--card` | `#FFFFFF` | Cards, chips, inputs |
| `--ink` | `#4A4458` | Primary text |
| `--ink-soft` | `#8A8497` | Secondary text |
| `--line` | `#EDE4D6` | Borders, unfilled progress |

Each step owns one soft color (fill) and a deeper shade (borders, tip rules). The color appears in the step header, the progress bar, selected chips, result cards, and the Options screen:

| Step | Fill | Deeper shade |
| :--- | :--- | :--- |
| Starch/Base | `#F6E3A1` | `#E9CB6B` |
| Greens | `#BCD7B1` | `#8FBC82` |
| Protein | `#F4BFA9` | `#E89A7B` |
| Filler Veggies | `#B5D5E3` | `#86B9D0` |
| Sauces | `#D3C3E8` | `#B09BD3` |
| Garnish/Texture | `#F2C4D3` | `#E29AB3` |

**Shape and type:**

- Pill-shaped buttons. Option cards on the step screens use the same rounded look, laid out two per row with the same layout on every step (cards without a note are just shorter). 20px card radius, soft low-contrast shadows, no hard edges.
- Minimum tap target 44px high.
- Rounded system font stack (`ui-rounded`, `SF Pro Rounded`, `Nunito`, `Segoe UI`, `system-ui`). No font files or remote fonts, per the offline requirement.
- Selected option cards fill with the step color, show a check mark, and darken their border.

**Brand:** the kestrel icon sits in each screen header. A larger version appears on the "too thin" message screen. Source art is in `assets/icon/`. Generated app icons need a solid background color (iOS fills transparent areas with black) and the artwork inside the central 80% of the canvas.

**Copy:** the thing the user makes is always called a "meal", never a "bowl" or "recipe".

**Mockup placeholders:** the tab bar icons and favorite hearts are emoji in the mockup. Emoji render differently on iOS and Android, so confirm they look acceptable on real devices or replace them with inline SVG. Option names, tips, and meal names in the mockup are invented and are not seed content.

## 6. Offline, install, and storage resilience

- `vite-plugin-pwa` generates the manifest and a service worker that precaches all built assets (HTML, JS, CSS, icons, content). Cache-first. No runtime CDN, font, or other remote requests.
- Hosted on GitHub Pages. The Vite `base` path must match the repository name.
- Updates reach a phone when the app is opened online and the new service worker activates.
- On first launch call `navigator.storage.persist()` and record the result. iOS behavior for home-screen apps must be verified on a real device before relying on it.
- Export writes one JSON file with the five user-data tables and a format version. Import validates version and shape before wiping anything, then replaces local user data after a confirm.
- The app shows a gentle reminder when no backup exists and a meal is saved, or when the last backup is over 30 days old.
- Residual risk: if iOS evicts the service worker cache itself, the app cannot reload offline until reinstalled from the fallback host. Backups protect data, not the app.

## 7. Seed content

The implementer drafts a starter set: roughly 6 to 10 options per step, sensible compatibility pairs, and one or two tips per option, stored in the content file. The author will replace or extend it with their own lists later. Replacing content must not require code changes.

## 8. Testing

Test-first throughout.

- **Logic (Vitest)**: filtering with pairs and hidden options, every validation case in 3.1, name generation (skipped steps, join rules, the "& more" cap, no-starch case), tip lookup, merge of built-in and user data.
- **Storage (Vitest + fake-indexeddb, no mocks)**: persistence of each table, deleting an option does not change saved meals, favorites persist, export/import round trip, import rejects a malformed or wrong-version file without touching existing data.
- **Manual checklist**: install on real iOS and Android devices, launch from the home-screen icon, airplane-mode use of every feature, data persists after restart, `storage.persist()` result on iOS.

## 9. Out of scope for the first release

The PRD section 9 enhancements stay out: editing option names, reordering, option favorites, Surprise Me, substitutions, serving adjustments, cooking mode, search, meal editing or duplication, imagery, and import merging. Combination tips and meal templates are dropped, not deferred.

## 10. Open items

- Verify `navigator.storage.persist()` and home-screen eviction behavior on a real iOS device.
- Author supplies final content lists after the app works.
- Mockups not yet drawn: the add-option compatibility checklist, the add-tip screen, and the saved-meal detail view.
- Dark mode is undecided. The first release ships light only unless the author asks for it.
- Choose the solid background color for the generated app icons.
