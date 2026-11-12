# Built-in content template

Fill this in with the options you want built into the app, then hand it to Claude to convert into `src/content/seed.ts`. Edit this file directly or copy it. You don't need to worry about ids, file formats, or code.

## How to fill it in

Each step has a list of options. Each option is a short block:

```
### Option name
- Note: a few words shown on the option's card (max 40 characters)
- Tips:
  - One practical tip about this ingredient.
  - A second tip (optional).
- Doesn't go with: Option name, Another option name
```

Rules:

- **Option names** must be written the same way everywhere. Claude matches them by name when it connects clashes.
- **Every option name must be unique across ALL steps.** Clashes match by name, so a repeated name is ambiguous. If the same ingredient fits two steps, give the two options different names, for example "Avocado slices" and "Avocado".
- **Note:** at most 40 characters. Required for every Sauces and Garnish/Texture option. Optional for the other steps (leave the line out for none).
- **Tips:** one or two per option. A tip is advice about that one ingredient (how to handle it, when to add it, what to watch for). Don't write cooking instructions, quantities, or times.
- **Doesn't go with:** the names of options that clash with this one, from any step (including this one). You only need to list a clash once, on either option, because it works both ways. Leave the line out if nothing clashes.
- **How many options:** 6 to 10 per step.
- **Word choice:** call what the user makes a "meal". Don't use "bowl" or "recipe" anywhere.
- **Each step is optional for the user.** Try not to write clashes so strict that picking one option leaves a later step with nothing to choose.

Delete the example block below when you're done.

---

## Starch/Base (pick one)

### Example: Brown rice
- Note: nutty and chewy
- Tips:
  - Toast the dry grains in the pot for a minute before adding water for a nuttier flavor.
- Doesn't go with: Example sauce name

(add your options here)

---

## Greens (pick any)

(add your options here)

---

## Protein (pick one)

(add your options here)

---

## Filler Veggies (pick any)

(add your options here)

---

## Sauces (pick any)

(add your options here)

---

## Garnish/Texture (pick any)

(add your options here)

---

## Notes for Claude

- Option ids default to the step plus the kebab-cased name, for example `starch.brown-rice`. Once friends have the app, an option's id must never change. Renaming the displayed name is safe only if the entry keeps its old id by setting an explicit `id` on its entry in `seed.ts`.
- When this content is converted, run the seed integrity tests and report anything they flag.
