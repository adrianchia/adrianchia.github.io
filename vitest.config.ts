/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';

// getViteConfig lets tests import modules that use Astro virtual modules such as astro:content.
export default getViteConfig({
  test: { include: ['tests/**/*.test.ts'] },
});
