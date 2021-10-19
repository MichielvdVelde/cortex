import { join } from 'path'

export type Provide = 'api' | 'storage' | 'processor'
export type Manifest = {
  provides: Provide | Provide[] | null,
  dependencies?: string[],
}

function deduplicate<T>(...arrays: T[][]) {
  const result: T[] = []
  for (const array of arrays) {
    for (const value of array) {
      if (!result.includes(value)) {
        result.push(value)
      }
    }
  }
  return result
}

export const requiredMods = ['cortex/mods/core']
export const enabledMods = process.env.ENABLED_MODS
  ? deduplicate(requiredMods, process.env.ENABLED_MODS.split(','))
  : requiredMods

// Resolve module dependencies in a hopefully deterministic order
const mods: {
  provides: Provide[];
  url: URL;
}[] = [];
const stack: string[] = [];
const resolved = new Set<string>();
const baseUrl = new URL(`file://${join(process.cwd(), `./dist/mods`)}`);
async function resolve(specifiers: string[]) {
  const imports = await Promise.all([...specifiers].sort().map(async specifier => {
    const url = await import.meta.resolve!(specifier, `${baseUrl}`);
    return {
      manifest: (await import(url)).manifest as Manifest,
      specifier,
      url,
    };
  }));
  for (const { manifest, specifier, url } of imports) {
    if (resolved.has(specifier)) {
      continue;
    } else if (stack.includes(specifier)) {
      throw new Error(`Detected cyclic dependency: ${stack.join(' -> ')} -> ${specifier}`);
    } else {
      stack.push(specifier);
      await resolve(manifest.dependencies ?? []);
      stack.pop();
      mods.push({
        provides: Array.isArray(manifest.provides) ? manifest.provides :
          manifest.provides === null ? [] as never : [manifest.provides],
        url: new URL(url),
      });
      resolved.add(specifier);
    }
  }
}
await resolve(enabledMods);

export { mods }
export async function importMods(provides: Provide) {
  for (const mod of mods) {
    if (mod.provides.includes(provides)) {
      await import(await import.meta.resolve!(`./${provides}`, `${mod.url}`));
    }
  }
}
