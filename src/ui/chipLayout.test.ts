import { declarationsFor, propertyOf, pxProperty } from '../test/cssRules'

// The selected check mark must not change a card's size, so it is drawn out of
// layout and always present, only fading in when the card is selected.
describe('option card check mark', () => {
  it('is out of layout and always rendered, so selecting a card cannot change its height', () => {
    expect(propertyOf('.chip', 'position')).toBe('relative')
    expect(propertyOf('.chip::before', 'position')).toBe('absolute')
    expect(propertyOf('.chip::before', 'content')).toBe('"\\2713"')
  })

  it('is invisible until the card is selected', () => {
    expect(propertyOf('.chip::before', 'opacity')).toBe('0')
    expect(propertyOf('.chip[aria-pressed="true"]::before, .chip.selected::before', 'opacity')).toBe('1')
    expect(declarationsFor('.chip[aria-pressed="true"]::before, .chip.selected::before')).not.toMatch(/content/)
  })

  it('has right padding on every card layout wide enough for the check', () => {
    const reserved = pxProperty('.chip::before', 'right') + pxProperty('.chip::before', 'font-size')
    for (const selector of ['.chip', '.chips.grid .chip']) {
      const sides = propertyOf(selector, 'padding')!.split(/\s+/).map(v => Number(v.replace('px', '')))
      const right = sides.length === 4 ? sides[1] : sides[1] ?? sides[0]
      expect(right, `${selector} right padding`).toBeGreaterThanOrEqual(reserved)
    }
  })
})
