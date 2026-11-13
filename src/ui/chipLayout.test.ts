import { propertyOf, pxProperty } from '../test/cssRules'

// The selected check mark must not change a card's size, so it is a real element drawn
// out of layout and always present, only fading in when the card is selected.
const SELECTED = '.chip[aria-pressed="true"] .check, .chip.selected .check'

// Right padding from a 1 to 4 value `padding` shorthand (top, right, bottom, left order).
function rightPadding(selector: string): number {
  const values = propertyOf(selector, 'padding')!.split(/\s+/).map(v => Number(v.replace('px', '')))
  return values[1] ?? values[0]
}

describe('option card check mark', () => {
  it('is out of layout and always rendered, so selecting a card cannot change its height', () => {
    expect(propertyOf('.chip', 'position')).toBe('relative')
    expect(propertyOf('.chip .check', 'position')).toBe('absolute')
  })

  it('is invisible until the card is selected', () => {
    expect(propertyOf('.chip .check', 'opacity')).toBe('0')
    expect(propertyOf(SELECTED, 'opacity')).toBe('1')
  })

  it('has right padding on every card layout wide enough for the check', () => {
    const reserved = pxProperty('.chip .check', 'right') + pxProperty('.chip .check', 'font-size')
    for (const selector of ['.chip', '.chips.grid .chip']) {
      expect(rightPadding(selector), `${selector} right padding`).toBeGreaterThanOrEqual(reserved)
    }
  })

  it('no longer draws the check as generated content, which would join the accessible name', () => {
    expect(() => propertyOf('.chip::before', 'content')).toThrow()
  })
})
