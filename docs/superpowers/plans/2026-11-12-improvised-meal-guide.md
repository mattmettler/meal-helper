# Improvised Meal Guide Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the offline-first PWA described in the spec: six fixed meal-building steps, exclusion-rule filtering, deterministic meal generation with per-option tips, user-managed options, saved meals, and JSON backup/restore.

**Architecture:** Three layers. Pure TypeScript logic (no UI or database imports), a Dexie storage layer for user data only, and thin React screens that receive a merged `Catalog` and callbacks as props. Built-in content is one bundled data file. A service worker precaches everything for offline use.

**Tech Stack:** React, TypeScript, Vite, vite-plugin-pwa, `@vite-pwa/assets-generator`, Dexie with `dexie-react-hooks`, Vitest with jsdom, React Testing Library, fake-indexeddb.

**Spec:** `docs/superpowers/specs/2026-11-11-improvised-meal-guide-design.md` (approved). Visual reference: `docs/mockups/mockup-v1.html` and `docs/mockups/mockup-v2.html`.

## Global Constraints

- The app works fully offline after install. No CDN, remote font, or other remote request at runtime.
- The thing the user makes is always called a "meal", never a "bowl" or "recipe". No instructions, quantities, or cook times anywhere.
- Steps in order: Starch/Base (single), Greens (multi), Protein (single), Filler Veggies (multi), Sauces (multi), Garnish/Texture (multi). Every step is skippable.
- Option notes are at most 40 characters.
- Saved meals store plain text and never change when options are hidden, deleted, or edited.
- Built-in tips and notes are fixed. Users add tips to any option and delete only their own. Users edit the note and clashes only on their own custom options.
- Rounded system font stack, no font files. Minimum tap target 44px. Light theme only.
- Colors exactly as in spec section 5.1.
- Vite `base` is `/meal-helper/` (the GitHub Pages repository name).
- The app icon is opaque (`assets/icon/icon-1024.png`, Starch yellow `#F6E3A1` background).
- Tests use real fake-indexeddb for storage. No mocks of the code under test.
- Work on a WIP branch, never directly on `main`. Commit after every task.

## Review Focus

Failure modes the spec implies that its own tests would not catch, most likely first. Each has a test in the task named in brackets.

1. A user adds a custom option with a blank name, a name already used in that step, or a note over 40 characters. They expect a gentle message and nothing saved. [Task 5, Task 13]
2. Picks that no longer make sense: the user goes Back and changes an earlier pick so a later pick now clashes, or an option vanishes (hidden, or replaced by an import). They expect the stale picks dropped, never a crash or a meal naming a missing option. [Task 3, Task 4]
3. A truncated, non-JSON, wrong-version, or duplicate-id backup file. They expect an error message and their existing data untouched. [Task 8, Task 15]
4. A browser without `navigator.storage.persist`. They expect the app to keep working. [Task 8]
5. A backup timestamp in the future (clock change) or no backup ever. They expect no nagging banner in the first case and a gentle one only after a meal is saved in the second. [Task 6]

## File Structure

```
src/logic/        types.ts steps.ts copy.ts validate.ts catalog.ts filtering.ts
                  inputRules.ts name.ts tips.ts meal.ts backupReminder.ts
src/content/      seed.ts                       (built-in options, pairs, tips)
src/storage/      db.ts userData.ts savedMeals.ts backup.ts settings.ts instance.ts
src/ui/           App.tsx TabBar.tsx theme.css stepTheme.ts useCatalog.ts readFileText.ts shareFile.ts
src/ui/screens/   Build.tsx Result.tsx Saved.tsx SavedDetail.tsx Options.tsx OptionAdd.tsx
                  Compatibility.tsx OptionDetail.tsx HiddenOptions.tsx BackupExport.tsx
                  BackupImport.tsx BackupReminder.tsx
src/test/         setup.ts
scripts/          verify-build.mjs              (existing: set-icon-background.py)
docs/             device-checklist.md
.github/workflows/deploy.yml
```

Each logic file has a matching `*.test.ts` beside it. Screens are presentational: they take a `Catalog` and callbacks as props, so screen tests need no database. `App.tsx` wires screens to storage.

---

### Task 1: Scaffold, shared types, and steps

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig*.json`, `index.html`, `src/main.tsx`, `src/test/setup.ts`, `src/logic/types.ts`, `src/logic/steps.ts`
- Test: `src/logic/steps.test.ts`
- Modify: `.gitignore` (add `node_modules`, `dist`)

**Interfaces:**
- Produces (`src/logic/types.ts`, exact):

```ts
export type StepId = 'starch' | 'greens' | 'protein' | 'veggies' | 'sauces' | 'garnish'
export interface Step { id: StepId; name: string; multi: boolean }
export interface Option { id: string; stepId: StepId; name: string; note?: string; isCustom: boolean; hidden: boolean }
export interface Pair { a: string; b: string }
export interface Tip { id: string; optionId: string; text: string; order: number; isCustom: boolean }
export interface Catalog { options: Option[]; pairs: Pair[]; tips: Tip[] }
export type Picks = Record<StepId, string[]>          // option ids in pick order
export interface MealItem { optionName: string; tips: string[] }
export interface MealGroup { stepName: string; items: MealItem[] }
export interface Meal { name: string; groups: MealGroup[] }
export interface SavedMeal extends Meal { id: string; isFavorite: boolean; createdAt: number }
export interface Seed {
  options: Array<{ id: string; stepId: StepId; name: string; note?: string }>
  pairs: Pair[]
  tips: Array<{ id: string; optionId: string; text: string; order: number }>
}
export interface CustomOptionRow { id: string; stepId: StepId; name: string; note?: string; deleted: boolean }
export interface UserPairRow { id: string; optionIdA: string; optionIdB: string }
export interface UserTipRow { id: string; optionId: string; text: string; order: number }
export interface UserData {
  customOptions: CustomOptionRow[]; hiddenBuiltIns: string[]
  userPairs: UserPairRow[]; userTips: UserTipRow[]
}
```

- Produces (`src/logic/steps.ts`): `STEPS: Step[]` (the six steps, ids as in the `StepId` union) and `emptyPicks(): Picks`.

- [ ] **Step 1: Scaffold the toolchain.** Create a React + TypeScript Vite project in the scratchpad (`npm create vite@latest scaffold -- --template react-ts`), then copy `package.json`, `tsconfig*.json`, `vite.config.ts`, `index.html`, `eslint.config.js`, and `src/main.tsx` into the repo root and delete the template demo files (`App.css`, assets, counter code). Do not scaffold in the repo directory (the generator can overwrite files). Install `dexie dexie-react-hooks` and dev dependencies `vitest jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom fake-indexeddb`. Import `defineConfig` from `vitest/config`, and set `test: { environment: 'jsdom', globals: true, setupFiles: ['./src/test/setup.ts'] }` and `base: '/meal-helper/'`.
- [ ] **Step 2: Write `src/test/setup.ts`:** import `fake-indexeddb/auto` and `@testing-library/jest-dom/vitest`; if `globalThis.crypto.randomUUID` is undefined, assign Node's `webcrypto` to it.
- [ ] **Step 3: Write the failing test `src/logic/steps.test.ts`:**
  - `STEPS lists the six steps in order` asserts ids `['starch','greens','protein','veggies','sauces','garnish']` and names `['Starch/Base','Greens','Protein','Filler Veggies','Sauces','Garnish/Texture']`.
  - `only Starch/Base and Protein are single-select` asserts `multi` is `[false,true,false,true,true,true]`.
  - `emptyPicks has an empty array for every step`.
- [ ] **Step 4: Run `npx vitest run src/logic/steps.test.ts`.** Expected: FAIL (module not found).
- [ ] **Step 5: Create `types.ts` exactly as above and implement `steps.ts`.** Run the test again. Expected: PASS. Then run `npm run build`. Expected: succeeds.
- [ ] **Step 6: Commit** `chore: scaffold Vite, Vitest, and shared types`.

---

### Task 2: Meal validation and the "too thin" copy

**Files:**
- Create: `src/logic/validate.ts`, `src/logic/copy.ts`
- Test: `src/logic/validate.test.ts`

**Interfaces:**
- Consumes: `Picks`, `emptyPicks`, `StepId`.
- Produces: `validateMeal(picks: Picks): 'ok' | 'too-thin'`; `TOO_THIN_MESSAGE: string`.

- [ ] **Step 1: Write failing tests.** Helper `picksOf(partial)` builds `Picks` from `emptyPicks()` with ids `'x'` per step.
  - `TOO_THIN_MESSAGE is the exact approved copy`: equals `You've got to eat something and I know you can do better than that <3 Give it another try!`.
  - `no picks is too thin`.
  - `picks from a single step are too thin` for each of the six steps, plus `two greens only is too thin`.
  - `only filler veggies, sauces, and garnish is too thin` for veggies+sauces, sauces+garnish, veggies+garnish, and all three.
  - `ok cases`: greens+sauces, starch+protein, protein+garnish, greens+veggies, starch+greens+protein.
- [ ] **Step 2: Run `npx vitest run src/logic/validate.test.ts`.** Expected: FAIL.
- [ ] **Step 3: Implement.** A meal is `'ok'` only if at least one of starch, greens, protein has a pick and at least two steps have picks.
- [ ] **Step 4: Run the tests.** Expected: PASS.
- [ ] **Step 5: Commit** `feat: validate meals and add too-thin copy`.

---

### Task 3: Catalog merge, option filtering, and pick pruning

**Files:**
- Create: `src/logic/catalog.ts`, `src/logic/filtering.ts`
- Test: `src/logic/catalog.test.ts`, `src/logic/filtering.test.ts`

**Interfaces:**
- Consumes: `Seed`, `UserData`, `Catalog`, `Option`, `Picks`, `StepId`, `STEPS`.
- Produces:
  - `buildCatalog(seed: Seed, user: UserData): Catalog` — built-in options (`isCustom: false`) followed by custom options (`isCustom: true`) in input order. `hidden` is true for ids in `hiddenBuiltIns` and for custom rows with `deleted: true`. Pairs and tips from both sources are combined (user tips get `isCustom: true`).
  - `availableOptions(catalog: Catalog, stepId: StepId, picks: Picks): Option[]` — options of that step that are not hidden and have no pair with any option picked in an earlier step or earlier in the same step. Picks in later steps are ignored. Options already picked in this step stay available.
  - `prunePicks(catalog: Catalog, picks: Picks): Picks` — walks steps in order and keeps a pick only if its option exists, is not hidden, and is still available given the picks already kept.

- [ ] **Step 1: Write failing tests in `catalog.test.ts`:** seed and custom options merge with correct `isCustom`; a built-in id in `hiddenBuiltIns` is `hidden`; a custom row with `deleted: true` is `hidden`; seed pairs and user pairs both appear as `Pair`s; seed and user tips both appear with `isCustom` false/true.
- [ ] **Step 2: Write failing tests in `filtering.test.ts`:** hidden options are excluded; a pair excludes the later option in either direction (`a`/`b` swapped); a pair with an option in the same multi step excludes the later one; a pair with a non-picked option changes nothing; picks in later steps are ignored; a step whose options are all excluded returns `[]`; an already-picked option stays available. `prunePicks`: drops a later pick that clashes after an earlier pick changes (Back-then-change case); drops an id missing from the catalog; drops a hidden option; keeps compatible picks in order.
- [ ] **Step 3: Run both files.** Expected: FAIL.
- [ ] **Step 4: Implement the three functions** with the signatures above.
- [ ] **Step 5: Run both files.** Expected: PASS.
- [ ] **Step 6: Commit** `feat: merge catalog, filter options, prune stale picks`.

---

### Task 4: Name generation, tips, and meal building

**Files:**
- Create: `src/logic/name.ts`, `src/logic/tips.ts`, `src/logic/meal.ts`
- Test: `src/logic/name.test.ts`, `src/logic/tips.test.ts`, `src/logic/meal.test.ts`

**Interfaces:**
- Consumes: `Catalog`, `Picks`, `Meal`, `Tip`, `STEPS`.
- Produces:
  - `buildMealName(catalog: Catalog, picks: Picks): string`
  - `tipsFor(catalog: Catalog, optionId: string): string[]` — built-in tips first (by `order`), then user tips (by `order`).
  - `buildMeal(catalog: Catalog, picks: Picks): Meal` — `name` from `buildMealName`; `groups` in step order, only steps with at least one known pick; `items` in pick order; ids missing from the catalog are skipped.

- [ ] **Step 1: Write failing tests in `name.test.ts`** (test catalog of readable names):
  - Rice + Chicken + Spinach → `Rice Meal with Chicken and Spinach`.
  - Chicken + Spinach, no starch → `Chicken and Spinach Meal`.
  - One item → `Chicken Meal`; three items → `Chicken, Spinach, and Peppers` style with the Oxford comma (`A, B, and C`); four items → `A, B, C & more`.
  - List order is Protein, then Greens, then Filler Veggies, regardless of pick time.
  - Sauces and garnish never appear in the name.
  - Starch with no list → `Rice Meal`; nothing nameable (no picks, or only sauces) → `Meal`.
- [ ] **Step 2: Write failing tests in `tips.test.ts` and `meal.test.ts`:** built-in tips precede user tips and each group is sorted by `order`; an option with no tips returns `[]`; `buildMeal` groups follow step order with `stepName` from `STEPS`; unknown ids are ignored and a step with only unknown ids is omitted; `buildMeal(...).name` equals `buildMealName(...)`.
- [ ] **Step 3: Run the three files.** Expected: FAIL.
- [ ] **Step 4: Implement** the three functions with the signatures above.
- [ ] **Step 5: Run the three files.** Expected: PASS.
- [ ] **Step 6: Commit** `feat: generate meal names, tips, and meals`.

---

### Task 5: Input rules for custom options and tips

**Files:**
- Create: `src/logic/inputRules.ts`
- Test: `src/logic/inputRules.test.ts`

**Interfaces:**
- Consumes: `Catalog`, `StepId`.
- Produces:
  - `NOTE_MAX_LENGTH = 40`
  - `validateOptionInput(catalog: Catalog, input: { stepId: StepId; name: string; note?: string }, editingOptionId?: string): string | null` — returns a user-facing message or `null`. Messages: blank (after trim) → `Give it a name`; same name (trimmed, case-insensitive) as another option in that step, hidden or not, other than `editingOptionId` → `That name is already in this step`; note over 40 characters (after trim) → `Keep the note to 40 characters or fewer`.
  - `validateTipText(text: string): string | null` — blank after trim → `Write a tip first`.

- [ ] **Step 1: Write failing tests:** blank and whitespace-only names rejected with the exact message; duplicate name differing only by case/whitespace rejected, including against a hidden option; the same name in a different step accepted; editing an option may keep its own name; a 40-character note passes and a 41-character note fails; a missing note passes; `validateTipText` rejects `''` and `'   '`, accepts text.
- [ ] **Step 2: Run `npx vitest run src/logic/inputRules.test.ts`.** Expected: FAIL.
- [ ] **Step 3: Implement** both functions.
- [ ] **Step 4: Run the test.** Expected: PASS.
- [ ] **Step 5: Commit** `feat: validate custom option and tip input`.

---

### Task 6: Backup reminder rule

**Files:**
- Create: `src/logic/backupReminder.ts`
- Test: `src/logic/backupReminder.test.ts`

**Interfaces:**
- Produces: `backupReminder(input: { lastBackupAt: number | null; now: number; savedMealCount: number }): boolean` — true when never backed up and at least one saved meal, or when the last backup is more than 30 days old.

- [ ] **Step 1: Write failing tests:** never backed up with 0 meals → false; never with 1 meal → true; 29 days ago → false; exactly 30 days → false; 31 days → true; `lastBackupAt` in the future → false.
- [ ] **Step 2: Run `npx vitest run src/logic/backupReminder.test.ts`.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run the test.** Expected: PASS.
- [ ] **Step 5: Commit** `feat: decide when to remind about backups`.

---

### Task 7: Database and user-data storage

**Files:**
- Create: `src/storage/db.ts`, `src/storage/userData.ts`, `src/storage/instance.ts`
- Test: `src/storage/userData.test.ts`

**Interfaces:**
- Consumes: row types from `types.ts`, `SavedMeal`, `StepId`.
- Produces:
  - `class MealGuideDb extends Dexie` with tables `customOptions` (`'id, stepId'`), `hiddenBuiltIns` (`'optionId'`), `userPairs` (`'id, optionIdA, optionIdB'`), `userTips` (`'id, optionId'`), `savedMeals` (`'id, createdAt'`), `settings` (`'key'`, rows `{ key: string; value: unknown }`).
  - `createDb(name?: string): MealGuideDb` (default name `'meal-guide'`); `instance.ts` exports `db = createDb()`.
  - `loadUserData(db): Promise<UserData>`
  - `addCustomOption(db, input: { stepId: StepId; name: string; note?: string }): Promise<string>` — trims, stores `deleted: false`, returns a UUID.
  - `updateCustomOptionNote(db, optionId: string, note?: string): Promise<void>`
  - `setOptionHidden(db, option: Option, hidden: boolean): Promise<void>` — custom: toggles `deleted`; built-in: adds or removes the `hiddenBuiltIns` row.
  - `setClashes(db, optionId: string, otherIds: string[]): Promise<void>` — replaces every `userPairs` row involving `optionId` with one row per distinct id in `otherIds` (ignoring `optionId` itself).
  - `addUserTip(db, optionId: string, text: string): Promise<void>` — trims, `order` = highest existing user order for that option plus one (starting at 1).
  - `deleteUserTip(db, tipId: string): Promise<void>`

- [ ] **Step 1: Write failing tests** (each opens `createDb(uniqueName)`, and persistence tests close and reopen the same name): added custom option persists across reopen; `updateCustomOptionNote` persists and clears with `undefined`; hiding a built-in persists and unhiding removes the row; hiding then restoring a custom option toggles `deleted`; `setClashes` replaces earlier pairs involving the option, keeps pairs not involving it, dedupes, and ignores the option's own id; tips get increasing `order` and `deleteUserTip` removes only that tip; hiding an option leaves its pairs and tips in place.
- [ ] **Step 2: Run `npx vitest run src/storage/userData.test.ts`.** Expected: FAIL.
- [ ] **Step 3: Implement** `db.ts`, `userData.ts`, `instance.ts`.
- [ ] **Step 4: Run the test.** Expected: PASS.
- [ ] **Step 5: Commit** `feat: add Dexie database and user data storage`.

---

### Task 8: Saved meals, settings, and backup

**Files:**
- Create: `src/storage/savedMeals.ts`, `src/storage/settings.ts`, `src/storage/backup.ts`
- Test: `src/storage/savedMeals.test.ts`, `src/storage/settings.test.ts`, `src/storage/backup.test.ts`

**Interfaces:**
- Consumes: `MealGuideDb`, `Meal`, `SavedMeal`, `UserData`.
- Produces:
  - `saveMeal(db, meal: Meal, now = Date.now()): Promise<string>` (returns UUID; `isFavorite: false`); `listSavedMeals(db): Promise<SavedMeal[]>` (favorites first, then newest first); `setFavorite(db, id: string, isFavorite: boolean)`; `deleteSavedMeal(db, id: string)`.
  - `getLastBackupAt(db): Promise<number | null>`; `recordBackupExport(db, now = Date.now()): Promise<void>`; `requestPersistence(db, storage: Pick<StorageManager, 'persist'> | undefined = navigator.storage): Promise<'granted' | 'denied' | 'unsupported'>` (records the result under settings key `persistGranted`; `unsupported` when `storage?.persist` is missing).
  - `BACKUP_APP = 'improvised-meal-guide'`, `BACKUP_FORMAT_VERSION = 1`.
  - `interface BackupFile { app: string; formatVersion: number; exportedAt: number; data: { customOptions: CustomOptionRow[]; hiddenBuiltIns: Array<{ optionId: string }>; userPairs: UserPairRow[]; userTips: UserTipRow[]; savedMeals: SavedMeal[] } }`
  - `exportBackup(db, now = Date.now()): Promise<BackupFile>` (never includes `settings` or built-in content); `serializeBackup(file: BackupFile): string`; `parseBackup(text: string): { ok: true; file: BackupFile } | { ok: false; error: string }`; `summarizeBackup(file: BackupFile): { customOptions: number; tips: number; clashes: number; hiddenOptions: number; savedMeals: number }`; `importBackup(db, file: BackupFile): Promise<void>` (one transaction that clears the five tables then inserts).

- [ ] **Step 1: Write failing tests.**
  - Saved meals: saving stores the snapshot text; hiding a custom option or deleting a user tip afterwards leaves the saved meal unchanged; list order is favorites first then newest (two favorites and two non-favorites with explicit `now`); favorite persists across close/reopen; delete removes only that meal.
  - Settings: `getLastBackupAt` is `null` initially and returns the recorded time; `requestPersistence` returns `granted`/`denied` from a stub object with a `persist()` method, records it, and returns `unsupported` for `undefined` and for `{}`.
  - Backup: export then import into a fresh db round-trips every table; export has no `settings` content; import replaces data (rows only in the old db are gone); `parseBackup` returns `ok: false` with the message `That doesn't look like a backup from this app` for invalid JSON, truncated JSON, `null`, an array, the wrong `app`, a missing table, a non-array table, and a row with a wrong field type (`savedMeals[0].groups` not an array); for `formatVersion: 2` it returns `ok: false` with `This backup is from a newer version of the app`; duplicate ids within one table return `ok: false`; `importBackup` of a file with duplicate ids (bypassing `parseBackup`) rejects and leaves the existing data intact; `summarizeBackup` counts match.
- [ ] **Step 2: Run the three files.** Expected: FAIL.
- [ ] **Step 3: Implement.** `parseBackup` validates by hand (no schema library) and never touches the database.
- [ ] **Step 4: Run the three files.** Expected: PASS.
- [ ] **Step 5: Commit** `feat: add saved meals, settings, and backup storage`.

---

### Task 9: Seed content

**Files:**
- Create: `src/content/seed.ts`
- Test: `src/content/seed.test.ts`

**Interfaces:**
- Consumes: `Seed`, `STEPS`, `availableOptions`, `buildCatalog`, `emptyPicks`.
- Produces: `SEED: Seed`. Option ids look like `starch.brown-rice` (step id, dot, kebab-case name) and never change once shipped. Pair, tip, and note rules are in the test.

- [ ] **Step 1: Write the integrity test first.**
  - ids are unique and each option id starts with its step id plus `.`.
  - every step has 6 to 10 options.
  - every pair references two different existing options, with no duplicate pairs (either order).
  - every tip references an existing option, and every option has 1 or 2 tips with non-empty text.
  - every note is at most 40 characters; every Sauces and Garnish/Texture option has a note.
  - no option name, note, or tip contains the whole words "bowl" or "recipe" (case-insensitive).
  - for every single built-in option picked on its own, every later step still has at least one available option (no one pick empties a step).
- [ ] **Step 2: Run `npx vitest run src/content/seed.test.ts`.** Expected: FAIL.
- [ ] **Step 3: Draft `seed.ts`.** Roughly 6 to 10 options per step, sensible clashes between options in different steps (and a few within multi-select steps), notes on every sauce and garnish (for example Sesame Seeds: `adds texture and good fats`), and one or two practical component tips per option (for example Brown rice: `Toast the dry grains in the pot for a minute before adding water for a nuttier flavor.`). Tips are component advice, never instructions. Matt will replace the lists later, so keep everything in this one file.
- [ ] **Step 4: Run the test.** Expected: PASS.
- [ ] **Step 5: Commit** `feat: add starter seed content`. Tell Matt the draft needs his review.

---

### Task 10: App shell, theme, and catalog hook

**Files:**
- Create: `src/ui/theme.css`, `src/ui/stepTheme.ts`, `src/ui/TabBar.tsx`, `src/ui/useCatalog.ts`, `src/ui/App.tsx`
- Modify: `src/main.tsx`, `index.html` (title `Improvised Meal Guide`, viewport with `viewport-fit=cover`)
- Test: `src/ui/theme.test.ts`, `src/ui/useCatalog.test.tsx`, `src/ui/App.test.tsx`

**Interfaces:**
- Consumes: `SEED`, `buildCatalog`, `loadUserData`, `db`/`MealGuideDb`.
- Produces:
  - `useCatalog(db?: MealGuideDb): Catalog | undefined` — `undefined` until loaded, then re-renders when any user-data table changes (`useLiveQuery`).
  - `stepClass(stepId: StepId): string` returning `step-<id>` (CSS classes set `--c` and `--cd` per step).
  - `<TabBar tab onChange />` with tabs Build, Saved, Options (labels exactly these, 🥣 💛 🌿).
  - `<App />` holds the current tab in state, builds the catalog, and renders the screens from Tasks 11 to 15.

- [ ] **Step 1: Write failing tests.** `theme.test.ts`: reads `theme.css` text and asserts it contains every color token and step fill/shade value from spec section 5.1 (`#FBF6EE`, `#4A4458`, `#8A8497`, `#EDE4D6`, and the six fill and six shade values). `useCatalog.test.tsx`: `renderHook` with a fresh `createDb` returns `undefined` then a catalog containing seed options; after `addCustomOption` the hook returns a catalog that includes the new option. `App.test.tsx`: renders the three tab labels; clicking Saved and Options switches the visible heading; no visible text contains "bowl".
- [ ] **Step 2: Run the three files.** Expected: FAIL.
- [ ] **Step 3: Implement.** Port the visual styles from `docs/mockups/mockup-v1.html` and `mockup-v2.html` into `theme.css` (tokens on `:root`, rounded system font stack, 44px minimum tap targets, safe-area padding for the tab bar). No external fonts or URLs. `App.tsx` shows a plain loading state while the catalog is `undefined`. Navigation is plain state in each tab, no router library.
- [ ] **Step 4: Run the three files.** Expected: PASS. Run `npm run dev` and check the shell in a mobile-width browser window.
- [ ] **Step 5: Commit** `feat: add app shell, theme, and catalog hook`.

---

### Task 11: Build and Result screens

**Files:**
- Create: `src/ui/screens/Build.tsx`, `src/ui/screens/Result.tsx`
- Modify: `src/ui/App.tsx`
- Test: `src/ui/screens/Build.test.tsx`

**Interfaces:**
- Consumes: `Catalog`, `STEPS`, `availableOptions`, `prunePicks`, `validateMeal`, `buildMeal`, `buildMealName`, `TOO_THIN_MESSAGE`, `emptyPicks`, `saveMeal`.
- Produces: `<Build catalog onSave={(meal: Meal) => void} />` — owns the in-memory build state (current step, picks, phase) and renders Result and the too-thin screen itself. Build state is lost on app restart and survives tab switches only if `App` keeps `Build` mounted (keep it mounted).

- [ ] **Step 1: Write failing tests** with a small hand-built `Catalog` (no seed dependency):
  - shows `Step 1 of 6` and the step name; option cards show the note under the name when present and only the name otherwise.
  - single-select: tapping a second option replaces the first; multi-select: two options stay selected (`aria-pressed`).
  - the primary button reads `Skip` with no picks and `Next` with picks on steps 1 to 5, and `Finish` on step 6 whether or not anything is picked.
  - options that clash with an earlier pick are not shown; a step with no available options shows `Nothing fits with your picks, skip ahead` and the button still advances.
  - Back keeps picks; changing an earlier pick removes a later pick that now clashes.
  - finishing with too-thin picks shows `TOO_THIN_MESSAGE` and a `Start over` button that returns to `Step 1 of 6` with nothing selected.
  - finishing with valid picks shows the auto name prefilled in the name field and each picked option with its tips directly beneath it.
  - editing the name then `Save this meal` calls `onSave` with the edited name; clearing the name saves the auto name; `Discard` returns to step 1 with nothing selected.
- [ ] **Step 2: Run `npx vitest run src/ui/screens/Build.test.tsx`.** Expected: FAIL.
- [ ] **Step 3: Implement** `Build.tsx` and `Result.tsx` following mockup-v1 (progress bar in step colors, two-column option cards). Wire `onSave` in `App` to `saveMeal`, then show the Saved tab.
- [ ] **Step 4: Run the test.** Expected: PASS.
- [ ] **Step 5: Commit** `feat: add guided build and result screens`.

---

### Task 12: Saved meals screens

**Files:**
- Create: `src/ui/screens/Saved.tsx`, `src/ui/screens/SavedDetail.tsx`, `src/ui/screens/BackupReminder.tsx`
- Modify: `src/ui/App.tsx`
- Test: `src/ui/screens/Saved.test.tsx`, `src/ui/screens/BackupReminder.test.tsx`

**Interfaces:**
- Consumes: `SavedMeal`, `listSavedMeals`, `setFavorite`, `deleteSavedMeal`, `backupReminder`, `getLastBackupAt`.
- Produces:
  - `interface ReminderState { show: boolean; lastBackupAt: number | null }` (exported from `BackupReminder.tsx`; `App` computes it from `backupReminder` and `getLastBackupAt`).
  - `<BackupReminder reminder: ReminderState />` — renders nothing when `show` is false; otherwise `No backup yet` when `lastBackupAt` is null, else `It's been a while since your last backup`.
  - `<Saved meals onToggleFavorite={(id, isFavorite) => void} onOpen={(id) => void} reminder: ReminderState />` (renders `<BackupReminder>` above the list); `<SavedDetail meal onDelete={(id) => void} onBack />`. `meals` arrives already sorted by `listSavedMeals`.

- [ ] **Step 1: Write failing tests:** rows render under `Favorites` and `Everything else` headings; an empty list shows `No saved meals yet`; the heart calls `onToggleFavorite(id, true)` for a non-favorite and `(id, false)` for a favorite; tapping a row calls `onOpen`; the detail view shows the groups with tips inline; `Delete` asks for confirmation, cancel does nothing, confirm calls `onDelete(id)`. `BackupReminder`: renders nothing when `show` is false; shows `No backup yet` when `lastBackupAt` is null; shows `It's been a while since your last backup` otherwise.
- [ ] **Step 2: Run `npx vitest run src/ui/screens/Saved.test.tsx`.** Expected: FAIL.
- [ ] **Step 3: Implement** both screens per mockup-v1. `App` loads meals with `useLiveQuery` over `listSavedMeals`.
- [ ] **Step 4: Run the test.** Expected: PASS.
- [ ] **Step 5: Commit** `feat: add saved meals screens`.

---

### Task 13: Options home, add option, and compatibility checklist

**Files:**
- Create: `src/ui/screens/Options.tsx`, `src/ui/screens/OptionAdd.tsx`, `src/ui/screens/Compatibility.tsx`
- Modify: `src/ui/App.tsx`
- Test: `src/ui/screens/OptionAdd.test.tsx`, `src/ui/screens/Options.test.tsx`

**Interfaces:**
- Consumes: `Catalog`, `validateOptionInput`, `NOTE_MAX_LENGTH`, `addCustomOption`, `setClashes`.
- Produces:
  - `<Options catalog onOpenOption={(id) => void} onAdd onOpenHidden onOpenBackup reminder: ReminderState />` — options grouped by step, add link per step, `Hidden options (N)` link, a backup entry showing `Last backed up N days ago` (or `Never backed up`) with the `BackupReminder` banner above it, and the credit text.
  - `<OptionAdd catalog onNext={(input: { stepId: StepId; name: string; note?: string }) => void} onBack />`
  - `<Compatibility catalog optionName stepId initialChecked={string[]} excludeOptionId? onSave={(checkedIds: string[]) => void} onBack />` — every other option grouped by step with checkboxes.

- [ ] **Step 1: Write failing tests.** `OptionAdd`: blank name shows `Give it a name` and does not call `onNext`; a duplicate name in the chosen step shows `That name is already in this step`; a 41-character note shows `Keep the note to 40 characters or fewer`; the counter reads `15 / 40` for a 15-character note; the preview card shows the typed name and note; a valid form calls `onNext` with the trimmed name. `Compatibility`: initial checks reflect `initialChecked`; toggling updates the label `Save option (N checked)`; `Save` calls `onSave` with the checked ids; the option being edited is not listed. `Options`: groups render per step; a custom option has the `your own` marker; the backup entry shows `Last backed up 12 days ago` for a timestamp 12 days old and `Never backed up` for `null`; credit text shows exactly `Icon image from vecteezy.com` and `Made by Matt for kestrel <3` as two separate lines at the bottom.
- [ ] **Step 2: Run the two files.** Expected: FAIL.
- [ ] **Step 3: Implement** the three screens per mockup-v1 and mockup-v2. `App` chains add → compatibility → save: `addCustomOption` then `setClashes`.
- [ ] **Step 4: Run the two files.** Expected: PASS.
- [ ] **Step 5: Commit** `feat: add options home, add option, and compatibility screens`.

---

### Task 14: Option detail, tips, and hidden options

**Files:**
- Create: `src/ui/screens/OptionDetail.tsx`, `src/ui/screens/HiddenOptions.tsx`
- Modify: `src/ui/App.tsx`
- Test: `src/ui/screens/OptionDetail.test.tsx`, `src/ui/screens/HiddenOptions.test.tsx`

**Interfaces:**
- Consumes: `Catalog`, `Option`, `validateOptionInput`, `validateTipText`, `updateCustomOptionNote`, `setClashes`, `addUserTip`, `deleteUserTip`, `setOptionHidden`.
- Produces:
  - `<OptionDetail catalog optionId onSaveNote={(note?: string) => void} onEditClashes onAddTip={(text: string) => void} onDeleteTip={(tipId: string) => void} onHide onBack />`
  - `<HiddenOptions catalog onRestore={(optionId: string) => void} onBack />`

- [ ] **Step 1: Write failing tests.** Custom option: note is editable and shows the counter; an over-length note shows the message and does not call `onSaveNote`; `Doesn't go with` lists current clashes with an Edit control calling `onEditClashes`; user tips show a delete control calling `onDeleteTip`. Built-in option: the note is plain text with no input, built-in tips are locked (no delete control), user tips are deletable, and there is no clash editor. Both: blank tip shows `Write a tip first` and does not call `onAddTip`; a valid tip calls `onAddTip` with trimmed text; `Hide this option` calls `onHide`. `HiddenOptions`: lists hidden options with their step name; `Restore` calls `onRestore(id)`; empty list shows a friendly empty message.
- [ ] **Step 2: Run the two files.** Expected: FAIL.
- [ ] **Step 3: Implement** both screens per mockup-v2, and wire all callbacks in `App` to the storage functions.
- [ ] **Step 4: Run the two files.** Expected: PASS.
- [ ] **Step 5: Commit** `feat: add option detail, tips, and hidden options screens`.

---

### Task 15: Backup export, import, and reminder screens

**Files:**
- Create: `src/ui/screens/BackupExport.tsx`, `src/ui/screens/BackupImport.tsx`, `src/ui/readFileText.ts`, `src/ui/shareFile.ts`
- Modify: `src/ui/App.tsx`, `src/main.tsx` (call `requestPersistence(db)` once at startup, ignoring the result in the UI)
- Test: `src/ui/screens/BackupExport.test.tsx`, `src/ui/screens/BackupImport.test.tsx`

**Interfaces:**
- Consumes: `exportBackup`, `serializeBackup`, `parseBackup`, `summarizeBackup`, `importBackup`, `recordBackupExport`, `getLastBackupAt`.
- Produces:
  - `readFileText(file: Blob): Promise<string>` (via `FileReader`).
  - `shareFile(file: File): Promise<boolean>` — uses `navigator.share({ files })` when `navigator.canShare?.({ files })` is true, otherwise downloads through an anchor. Returns false if the user cancels.
  - `<BackupExport summary lastBackupAt fileName onSave={() => Promise<void>} onBack />`; `<BackupImport currentSummary onReplace={(file: BackupFile) => Promise<void>} onBack />`.
  - Backup file name: `meal-guide-backup-YYYY-MM-DD.json`.

- [ ] **Step 1: Write failing tests.** `BackupExport`: shows the five counts, the file name, and `Last backed up N days ago` (or `Never backed up`); `Save backup file` calls `onSave`. `BackupImport`: picking a valid backup file shows its counts and the warning naming what will be replaced; `Replace my data` calls `onReplace` with the parsed file and then shows `All restored!`; `Cancel` calls nothing; picking non-JSON, truncated JSON, and a wrong-version file each shows the error text and calls nothing (`Hmm, that doesn't look like one of my backups.` for the first two, the newer-version message for the third).
- [ ] **Step 2: Run the two files.** Expected: FAIL.
- [ ] **Step 3: Implement** the screens per mockup-v2. `shareFile` is thin browser glue and has no automated test (real share and download behavior is covered by the device checklist in Task 17). After a successful `shareFile`, `App` calls `recordBackupExport`. After `importBackup` succeeds, `App` resets the in-progress build state.
- [ ] **Step 4: Run the two files.** Expected: PASS.
- [ ] **Step 5: Commit** `feat: add backup export and import screens`.

---

### Task 16: PWA manifest, icons, and offline build verification

**Files:**
- Create: `pwa-assets.config.ts`, `scripts/verify-build.mjs`, generated icons in `public/`
- Modify: `vite.config.ts`, `index.html`, `package.json` (scripts `verify:build`, `generate:icons`)
- Test: `scripts/verify-build.mjs` (run against `dist/`)

**Interfaces:**
- Consumes: `assets/icon/icon-1024.png`.
- Produces: `dist/` with `manifest.webmanifest`, `sw.js`, and icons; `npm run verify:build` builds and checks it.

- [ ] **Step 1: Write `scripts/verify-build.mjs` first.** It exits non-zero with a readable message unless all hold: `dist/sw.js` and `dist/manifest.webmanifest` exist; the manifest has `display: "standalone"`, `start_url` and `scope` beginning `/meal-helper/`, a 192 and a 512 icon, and a maskable icon; the icon files named in the manifest exist; `dist/index.html` and every `dist/**/*.css` contain no remote `src`, `href`, or `url(...)` pointing at `http(s)://` hosts; `dist/index.html` links an Apple touch icon.
- [ ] **Step 2: Run `node scripts/verify-build.mjs` before any PWA config.** Expected: FAIL (no service worker).
- [ ] **Step 3: Configure.** Install `vite-plugin-pwa` and `@vite-pwa/assets-generator`, add `VitePWA` to `vite.config.ts` with `registerType: 'autoUpdate'`, manifest `name` `Improvised Meal Guide`, `short_name` `Meal Guide`, `display` `standalone`, `background_color` `#FBF6EE`, `theme_color` `#F6E3A1`, and precache `js,css,html,png,svg,ico,webmanifest`. Generate icons with the assets generator from `assets/icon/icon-1024.png` (check the tool's documentation for the current command and preset, and set the maskable background to `#F6E3A1`, not white or transparent). Add the Apple touch icon link and `theme-color` meta to `index.html`.
- [ ] **Step 4: Run `npm run verify:build`.** Expected: PASS. Then open the generated maskable icon and confirm the padding is yellow.
- [ ] **Step 5: Check offline behavior locally.** Run `npm run preview`, open it in Chrome, confirm in DevTools Application that the manifest is valid and the service worker is activated, switch DevTools to Offline, reload, and walk the Build flow.
- [ ] **Step 6: Commit** `feat: add PWA manifest, icons, and offline build check`.

---

### Task 17: Deployment and device checklist

**Files:**
- Create: `.github/workflows/deploy.yml`, `docs/device-checklist.md`

- [ ] **Step 1: Write `docs/device-checklist.md`** from spec section 8 and the open items: install on a real iOS device and a real Android device; launch from the home-screen icon in standalone mode; airplane-mode use of every feature (build, save, favorite, add option, add tip, hide, export, import); data persists after fully closing and reopening; the `storage.persist()` result on iOS; export and import through the real share sheet or download on both platforms (`shareFile`); emoji tab icons and hearts look acceptable on both platforms; icon looks right on both home screens; the app works when the host is unreachable after install.
- [ ] **Step 2: Write `.github/workflows/deploy.yml`** that on push to `main` installs dependencies, runs `npm test` and `npm run verify:build`, and publishes `dist/` to GitHub Pages using the official Pages actions. Check each action's current major version before pinning.
- [ ] **Step 3: Stop and ask Matt before pushing the workflow or enabling Pages.** Publishing makes the app reachable on the internet, and Pages on a private repository may need a paid plan. Matt sets Pages "Source" to "GitHub Actions" in the repository settings.
- [ ] **Step 4: After Matt approves and enables Pages, push, and confirm** the workflow run is green and the site loads at its Pages URL with the service worker registering.
- [ ] **Step 5: Commit** `ci: deploy to GitHub Pages and add device checklist`.
