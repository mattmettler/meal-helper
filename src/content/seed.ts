import type { Pair, Seed, StepId } from '../logic/types'

interface SeedEntry {
  name: string
  note?: string
  tips: string[]
  doesntGoWith?: string[]
}

const ENTRIES: Record<StepId, SeedEntry[]> = {
  starch: [
    { name: 'Brown rice', note: 'nutty and chewy', tips: ['Toast the dry grains in the pot for a minute before adding water for a nuttier flavor.'] },
    { name: 'Jasmine rice', note: 'soft and fragrant', tips: ['Jasmine is stickier than long-grain white rice.', 'Rinsed grains stay more separate than unrinsed ones.'] },
    { name: 'Rice noodles', note: 'light and slippery', tips: ['Thin rice noodles are more delicate than the flat wide kind.'], doesntGoWith: ['Pesto', 'Salsa', 'Feta cheese'] },
    { name: 'Quinoa', note: 'light and a little crunchy', tips: ['Rinsed quinoa tastes less bitter than unrinsed.', 'Red and black quinoa stay firmer than white.'] },
    { name: 'Couscous', note: 'quick and fluffy', tips: ['Pearl couscous is chewier than the fine kind.'], doesntGoWith: ['Peanut sauce'] },
    { name: 'Soba noodles', note: 'earthy buckwheat flavor', tips: ['Soba with a high share of buckwheat is more flavorful but more fragile.'], doesntGoWith: ['Pesto'] },
    { name: 'Sweet potato', note: 'sweet and soft', tips: ['Orange varieties are sweeter and softer than white or purple ones.', 'The skin is edible and adds fiber.'] },
    { name: 'Farro', note: 'chewy with a nutty bite', tips: ['Pearled farro is quicker to prepare than whole farro.'] },
  ],
  greens: [
    { name: 'Spinach', tips: ['Baby spinach is tender enough to eat raw.'] },
    { name: 'Kale', note: 'sturdy and slightly bitter', tips: ['Lacinato kale is more tender than curly kale.'] },
    { name: 'Arugula', note: 'peppery', tips: ['Young arugula is milder than mature leaves.'], doesntGoWith: ['Bok choy'] },
    { name: 'Romaine', note: 'crisp and mild', tips: ['The inner hearts are sweeter and crunchier than the outer leaves.'] },
    { name: 'Bok choy', note: 'juicy stems, tender leaves', tips: ['Baby bok choy is milder and more tender than full-size.'], doesntGoWith: ['Pesto', 'Feta cheese', 'Salsa'] },
    { name: 'Cabbage', note: 'crunchy and sweet', tips: ['Savoy cabbage is more tender than green cabbage.', 'Thin shreds are easier to eat than thick wedges.'], doesntGoWith: ['Watercress'] },
    { name: 'Watercress', note: 'peppery and tender', tips: ['Choose bunches with slim stems, since thick stems can be tough.'] },
    { name: 'Mixed baby greens', tips: ['Pre-washed mixes are convenient but spoil faster once opened.'] },
  ],
  protein: [
    { name: 'Chicken', tips: ['Thighs stay juicier than breasts.', 'Skinless boneless cuts are the quickest to prepare.'] },
    { name: 'Tofu', note: 'firm or extra firm works best', tips: ['Extra-firm tofu holds its shape best.'] },
    { name: 'Eggs', tips: ['Fresh eggs have firm whites and rounded yolks.'] },
    { name: 'Salmon', tips: ['Skin-on fillets hold together better.', 'Look for firm, bright flesh without a strong fishy smell.'], doesntGoWith: ['Feta cheese'] },
    { name: 'Shrimp', tips: ['Frozen shrimp are often fresher than the thawed ones at the counter.', 'Shell-on shrimp keep more flavor, while peeled ones save time.'], doesntGoWith: ['Feta cheese'] },
    { name: 'Black beans', tips: ['Canned beans are convenient, while dried ones taste fuller.'], doesntGoWith: ['Soy sauce'] },
    { name: 'Chickpeas', tips: ['Canned chickpeas are ready to use, while dried ones are firmer.'] },
    { name: 'Ground beef', tips: ['Leaner blends are drier, so some fat keeps it tender.'], doesntGoWith: ['Lemon vinaigrette'] },
  ],
  veggies: [
    { name: 'Carrots', note: 'sweet and crunchy', tips: ['Thin carrots are sweeter than thick ones.'] },
    { name: 'Cucumber', note: 'cool and crisp', tips: ['Smaller cucumbers have fewer seeds and are less watery.'] },
    { name: 'Bell pepper', note: 'sweet and crisp', tips: ['Red, orange, and yellow peppers are sweeter than green ones.'] },
    { name: 'Broccoli', tips: ['The peeled stalk is sweet and tender inside.'] },
    { name: 'Mushrooms', note: 'savory and meaty', tips: ['Cremini have more flavor than white button mushrooms.', 'Avoid ones that look slimy or wet.'] },
    { name: 'Cherry tomatoes', note: 'juicy and sweet', tips: ['Ripe ones smell fragrant at the stem end.'] },
    { name: 'Corn', note: 'sweet and juicy', tips: ['Frozen corn is picked at peak sweetness.'] },
    { name: 'Edamame', note: 'soft and mildly sweet', tips: ['Shelled frozen edamame saves time over pods.'], doesntGoWith: ['Pesto'] },
  ],
  sauces: [
    { name: 'Soy sauce', note: 'salty and savory', tips: ['Low-sodium versions let other flavors come through.'], doesntGoWith: ['Pesto', 'Salsa', 'Yogurt sauce'] },
    { name: 'Peanut sauce', note: 'rich, creamy, and nutty', tips: ['Versions made with natural peanut butter taste more of peanuts but can separate.'], doesntGoWith: ['Salsa', 'Yogurt sauce'] },
    { name: 'Tahini', note: 'creamy and slightly bitter', tips: ['Natural tahini separates in the jar, which is normal.'] },
    { name: 'Pesto', note: 'herby and garlicky', tips: ['Refrigerated basil pesto tastes brighter than shelf-stable jars.'], doesntGoWith: ['Salsa'] },
    { name: 'Salsa', note: 'fresh, tangy, a little spicy', tips: ['Fresh salsa is brighter, while jarred is smoother and more cooked.'] },
    { name: 'Lemon vinaigrette', note: 'bright and tangy', tips: ['Fresh lemon juice tastes brighter than bottled.'] },
    { name: 'Sriracha', note: 'hot, garlicky, and sweet', tips: ['The heat builds slowly, so go light on it.'] },
    { name: 'Yogurt sauce', note: 'cool, creamy, and tangy', tips: ['Plain yogurt keeps the sauce savory, since flavored ones are sweet.', 'Greek yogurt makes a thicker sauce than regular yogurt.'] },
  ],
  garnish: [
    { name: 'Sesame seeds', note: 'adds texture and good fats', tips: ['Toasted sesame seeds taste nuttier than raw ones.'] },
    { name: 'Toasted almonds', note: 'crunchy and rich', tips: ['Raw almonds are mild, while toasted ones are richer.'] },
    { name: 'Crushed peanuts', note: 'salty crunch', tips: ['Unsalted peanuts let the sauce control the saltiness.'], doesntGoWith: ['Pesto'] },
    { name: 'Cilantro', note: 'fresh and citrusy', tips: ['The tender stems are full of flavor.'] },
    { name: 'Scallions', note: 'mild onion bite', tips: ['The green tops are milder than the white bulbs.'] },
    { name: 'Feta cheese', note: 'salty and tangy', tips: ['Block feta in brine is creamier than pre-crumbled.'] },
    { name: 'Avocado', note: 'creamy and cooling', tips: ['Ripe ones give slightly when pressed at the stem end.', 'Cut avocado browns quickly.'] },
    { name: 'Lime wedge', note: 'a bright squeeze of acid', tips: ['Heavy limes tend to be juicier.'] },
  ],
}

const STEP_ORDER: StepId[] = ['starch', 'greens', 'protein', 'veggies', 'sauces', 'garnish']

const kebab = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

function buildSeed(): Seed {
  const seed: Seed = { options: [], pairs: [], tips: [] }
  const idByName = new Map<string, string>()
  for (const stepId of STEP_ORDER) {
    for (const entry of ENTRIES[stepId]) {
      const id = `${stepId}.${kebab(entry.name)}`
      idByName.set(entry.name, id)
      seed.options.push({ id, stepId, name: entry.name, ...(entry.note ? { note: entry.note } : {}) })
      entry.tips.forEach((text, i) => seed.tips.push({ id: `${id}#${i + 1}`, optionId: id, text }))
    }
  }
  const idFor = (name: string) => {
    const id = idByName.get(name)
    if (!id) throw new Error(`Seed clash names unknown option "${name}"`)
    return id
  }
  const seen = new Set<string>()
  for (const stepId of STEP_ORDER) {
    for (const entry of ENTRIES[stepId]) {
      for (const other of entry.doesntGoWith ?? []) {
        const pair: Pair = { a: idFor(entry.name), b: idFor(other) }
        const key = [pair.a, pair.b].sort().join('|')
        if (!seen.has(key)) {
          seen.add(key)
          seed.pairs.push(pair)
        }
      }
    }
  }
  return seed
}

export const SEED: Seed = buildSeed()
