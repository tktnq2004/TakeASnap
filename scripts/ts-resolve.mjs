/**
 * Cho script Node (type stripping) import được code của app: `import … from './features'`
 * (không đuôi, như Metro / tsc cho phép) thì thử thêm `.ts` / `.tsx`.
 *
 *   node --import ./scripts/ts-resolve.mjs scripts/<script>.mts
 */
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { fileURLToPath } from 'node:url';

registerHooks({
  resolve(specifier, context, nextResolve) {
    const relative = specifier.startsWith('./') || specifier.startsWith('../');
    if (relative && !/\.\w+$/.test(specifier) && context.parentURL?.startsWith('file:')) {
      for (const ext of ['.ts', '.tsx']) {
        const url = new URL(specifier + ext, context.parentURL);
        if (existsSync(fileURLToPath(url))) return nextResolve(url.href, context);
      }
    }
    return nextResolve(specifier, context);
  },
});
