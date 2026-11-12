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
    { name: 'Jasmine rice', note: 'soft and fragrant', tips: ['Rinse until the water runs mostly clear so the grains stay separate.', 'Let it rest covered after cooking so it finishes steaming.'] },
    { name: 'Rice noodles', note: 'light and slippery', tips: ['Rinse in cold water after draining to stop them from clumping.'], doesntGoWith: ['Pesto', 'Salsa', 'Feta cheese'] },
    { name: 'Quinoa', note: 'light and a little crunchy', tips: ['Rinse well first to wash off the bitter coating.', 'Fluff with a fork once it is done so it does not pack down.'] },
    { name: 'Couscous', note: 'quick and fluffy', tips: ['Season the liquid it soaks in, because couscous takes on whatever flavor it is given.'], doesntGoWith: ['Peanut sauce'] },
    { name: 'Soba noodles', note: 'earthy buckwheat flavor', tips: ['Rinse under cold water after draining to remove surface starch.'], doesntGoWith: ['Pesto'] },
    { name: 'Sweet potato', note: 'sweet and soft', tips: ['Cut into even pieces so they all cook at the same pace.', 'Leave the skin on for extra fiber and texture.'] },
    { name: 'Farro', note: 'chewy with a nutty bite', tips: ['Cook it like pasta in plenty of salted water and drain when it is tender but still chewy.'] },
  ],
  greens: [
    { name: 'Spinach', tips: ['Wilt it at the very end, since it shrinks to almost nothing with heat.'] },
    { name: 'Kale', note: 'sturdy and slightly bitter', tips: ['Remove the tough stems and massage the leaves with a little oil to soften them.'] },
    { name: 'Arugula', note: 'peppery', tips: ['Add it last so it stays crisp and bright.'], doesntGoWith: ['Bok choy'] },
    { name: 'Romaine', note: 'crisp and mild', tips: ['Dry the leaves well so sauces cling instead of sliding off.'] },
    { name: 'Bok choy', note: 'juicy stems, tender leaves', tips: ['Separate the stems from the leaves, because the stems need longer to soften.'], doesntGoWith: ['Pesto', 'Feta cheese', 'Salsa'] },
    { name: 'Cabbage', note: 'crunchy and sweet', tips: ['Slice it thin so it is easy to eat.', 'Salt shredded cabbage and let it sit for a few minutes to soften it.'], doesntGoWith: ['Watercress'] },
    { name: 'Watercress', note: 'peppery and tender', tips: ['Keep the stems short, since the thick ones can be tough.'] },
    { name: 'Mixed baby greens', tips: ['Wash and dry them just before using, as they wilt quickly once wet.'] },
  ],
  protein: [
    { name: 'Chicken', tips: ['Pat it dry before cooking for better browning.', 'Let it rest after cooking so the juices stay in.'] },
    { name: 'Tofu', note: 'firm or extra firm works best', tips: ['Press out the water before using so it absorbs flavor and browns well.'] },
    { name: 'Eggs', tips: ['Take them out of the fridge a bit early so they cook evenly.'] },
    { name: 'Salmon', tips: ['Cook it skin side down first for a crisp skin.', 'Stop cooking when it just turns opaque, since it keeps cooking from its own heat.'], doesntGoWith: ['Feta cheese'] },
    { name: 'Shrimp', tips: ['Pat them dry before cooking so they sear instead of steam.', 'Pull them off the heat as soon as they curl into a loose C.'], doesntGoWith: ['Feta cheese'] },
    { name: 'Black beans', tips: ['Rinse canned beans to remove the salty liquid they sit in.'], doesntGoWith: ['Soy sauce'] },
    { name: 'Chickpeas', tips: ['Rinse and dry canned chickpeas well; dry ones get crispier when roasted.'] },
    { name: 'Ground beef', tips: ['Break it up in a hot pan and let it brown before stirring too much.'], doesntGoWith: ['Lemon vinaigrette'] },
  ],
  veggies: [
    { name: 'Carrots', note: 'sweet and crunchy', tips: ['Cut on an angle or shred them for more surface area and a quicker cook.'] },
    { name: 'Cucumber', note: 'cool and crisp', tips: ['Scoop out the watery seeds if the cucumber is large.'] },
    { name: 'Bell pepper', note: 'sweet and crisp', tips: ['Red, orange, and yellow peppers are sweeter than green ones.'] },
    { name: 'Broccoli', tips: ['Cut the florets small and peel the stalk, which is sweet and tender inside.'] },
    { name: 'Mushrooms', note: 'savory and meaty', tips: ['Wipe them clean instead of soaking, since they absorb water.', 'Give them space in the pan so they brown instead of steaming.'] },
    { name: 'Cherry tomatoes', note: 'juicy and sweet', tips: ['Halve them so they release their juices into the meal.'] },
    { name: 'Corn', note: 'sweet and juicy', tips: ['Frozen corn works well and needs only a quick warm-up.'] },
    { name: 'Edamame', note: 'soft and mildly sweet', tips: ['Buy it shelled and frozen to skip the work of popping out the beans.'], doesntGoWith: ['Pesto'] },
  ],
  sauces: [
    { name: 'Soy sauce', note: 'salty and savory', tips: ['A little goes a long way, so taste before adding more.'], doesntGoWith: ['Pesto', 'Salsa', 'Yogurt sauce'] },
    { name: 'Peanut sauce', note: 'rich, creamy, and nutty', tips: ['Thin it with a splash of warm water if it is too thick to drizzle.'], doesntGoWith: ['Salsa', 'Yogurt sauce'] },
    { name: 'Tahini', note: 'creamy and slightly bitter', tips: ['Stir the jar well first, because the oil separates and settles on top.'] },
    { name: 'Pesto', note: 'herby and garlicky', tips: ['Add it off the heat, since high heat dulls the fresh basil flavor.'], doesntGoWith: ['Salsa'] },
    { name: 'Salsa', note: 'fresh, tangy, a little spicy', tips: ['Drain off extra liquid if you want it to sit on top instead of pooling.'] },
    { name: 'Lemon vinaigrette', note: 'bright and tangy', tips: ['Whisk the oil in slowly so the dressing stays blended.'] },
    { name: 'Sriracha', note: 'hot, garlicky, and sweet', tips: ['Start with a small amount and build up, since the heat sneaks up on you.'] },
    { name: 'Yogurt sauce', note: 'cool, creamy, and tangy', tips: ['Use plain yogurt so the sauce stays savory.', 'Stir in a pinch of salt and a squeeze of lemon to wake it up.'] },
  ],
  garnish: [
    { name: 'Sesame seeds', note: 'adds texture and good fats', tips: ['Toast them in a dry pan until fragrant to bring out their flavor.'] },
    { name: 'Toasted almonds', note: 'crunchy and rich', tips: ['Chop them roughly so every bite gets a little crunch.'] },
    { name: 'Crushed peanuts', note: 'salty crunch', tips: ['Crush them coarsely, since fine dust disappears into the sauce.'], doesntGoWith: ['Pesto'] },
    { name: 'Cilantro', note: 'fresh and citrusy', tips: ['Use the tender stems too, as they have plenty of flavor.'] },
    { name: 'Scallions', note: 'mild onion bite', tips: ['Slice thinly on an angle and keep the green and white parts separate.'] },
    { name: 'Feta cheese', note: 'salty and tangy', tips: ['Crumble it by hand just before using so it stays moist.'] },
    { name: 'Avocado', note: 'creamy and cooling', tips: ['Slice it right before serving, because it browns quickly.', 'Press gently at the stem end to check ripeness.'] },
    { name: 'Lime wedge', note: 'a bright squeeze of acid', tips: ['Roll it on the counter before cutting to get more juice.'] },
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
