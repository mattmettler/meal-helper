import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const css = readFileSync(resolve(__dirname, 'theme.css'), 'utf8');

function declarationsFor(selector: string): string {
  for (const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (match[1].trim() === selector) return match[2];
  }
  throw new Error(`theme.css has no rule for ${selector}`);
}

function pxProperty(selector: string, property: string): number {
  const match = declarationsFor(selector).match(
    new RegExp(`(?:^|[;\\s])${property}\\s*:\\s*(\\d+(?:\\.\\d+)?)px`),
  );
  if (!match) throw new Error(`${selector} has no ${property} in px`);
  return Number(match[1]);
}

describe('screen header height', () => {
  it('is at least as tall as the Back button and the logo so it never changes between screens', () => {
    const top = pxProperty('.top', 'min-height');
    const back = pxProperty('.back', 'min-height');
    const logo = pxProperty('.logo', 'height');
    expect(
      top,
      `.top min-height ${top}px must be >= .back min-height ${back}px and .logo height ${logo}px`,
    ).toBeGreaterThanOrEqual(Math.max(back, logo));
  });
});
