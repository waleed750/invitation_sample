import {readFile} from 'node:fs/promises';

const locales = ['ar', 'en'];
const problems = [];
function flatten(value, locale, path = '', result = new Map()) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const entries = Object.entries(value);
    if (!entries.length) problems.push(`${locale}: empty object at ${path || '<root>'}`);
    for (const [key, child] of entries) flatten(child, locale, path ? `${path}.${key}` : key, result);
  } else {
    result.set(path, value);
    if (typeof value !== 'string' || !value.trim()) problems.push(`${locale}: empty or non-string value at ${path}`);
  }
  return result;
}
try {
  const maps = await Promise.all(locales.map(async (locale) => flatten(
    JSON.parse(await readFile(new URL(`../messages/${locale}.json`, import.meta.url), 'utf8')), locale
  )));
  for (const key of new Set(maps.flatMap((map) => [...map.keys()]))) {
    maps.forEach((map, index) => { if (!map.has(key)) problems.push(`${locales[index]}: missing ${key}`); });
  }
  if (problems.length) {
    console.error(`i18n check failed:\n${problems.map((problem) => `- ${problem}`).join('\n')}`);
    process.exitCode = 1;
  } else console.log(`i18n check passed: ${maps[0].size} matching, non-empty keys in ar and en.`);
} catch (error) {
  console.error(`i18n check failed: ${error.message}`);
  process.exitCode = 1;
}
