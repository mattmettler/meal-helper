import { pxProperty } from '../test/cssRules'

describe('screen header height', () => {
  it('is at least as tall as the Back button and the logo so it never changes between screens', () => {
    const top = pxProperty('.top', 'min-height')
    const back = pxProperty('.back', 'min-height')
    const logo = pxProperty('.logo', 'height')
    expect(
      top,
      `.top min-height ${top}px must be >= .back min-height ${back}px and .logo height ${logo}px`,
    ).toBeGreaterThanOrEqual(Math.max(back, logo))
  })
})
