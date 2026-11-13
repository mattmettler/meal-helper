import { propertyOf } from '../test/cssRules'

// The tab panels do not scroll themselves. Each screen scrolls inside .panel-scroll,
// which ends above the pinned button row, so cards are never hidden behind it.
describe('screen scrolling layout', () => {
  it('scrolls inside .panel-scroll, which can shrink below its content', () => {
    expect(propertyOf('.panel-scroll', 'overflow-y')).toBe('auto')
    expect(propertyOf('.panel-scroll', 'min-height')).toBe('0')
    expect(propertyOf('.panel-scroll', 'flex')).toBe('1')
  })

  it('does not scroll the main area or the tab panels themselves', () => {
    expect(propertyOf('.screen', 'overflow-y')).toBeUndefined()
    expect(propertyOf('.panel', 'overflow-y')).toBeUndefined()
    expect(propertyOf('.panel', 'min-height')).toBe('0')
    expect(propertyOf('.panel', 'flex-direction')).toBe('column')
  })

  it('pins the button row in place rather than sticking it inside the scrolling content', () => {
    expect(propertyOf('.footer.pinned', 'position')).toBe('static')
  })
})
