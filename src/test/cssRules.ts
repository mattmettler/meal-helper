import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const css = readFileSync(resolve(__dirname, '../ui/theme.css'), 'utf8')

export function declarationsFor(selector: string): string {
  for (const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (match[1].trim() === selector) return match[2]
  }
  throw new Error(`theme.css has no rule for ${selector}`)
}

export function propertyOf(selector: string, property: string): string | undefined {
  const match = declarationsFor(selector).match(new RegExp(`(?:^|[;\\s])${property}\\s*:\\s*([^;]+)`))
  return match?.[1].trim()
}

export function pxProperty(selector: string, property: string): number {
  const match = propertyOf(selector, property)?.match(/^(\d+(?:\.\d+)?)px$/)
  if (!match) throw new Error(`${selector} has no ${property} in px`)
  return Number(match[1])
}
