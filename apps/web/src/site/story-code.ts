/**
 * One story's code, cut out of its stories file: from `export const Name` to the
 * next top-level `export` (or the end of the file). Pure, so the llms.txt build
 * step shares it with the docs pages.
 */
export function storyCode(file: string, exportName: string) {
  const start = file.search(new RegExp(`^export const ${exportName}\\b`, "m"));
  if (start < 0) return "";
  const rest = file.slice(start + 1);
  const end = rest.search(/^(export |\/\*\*|\/\/ |function |const |let |type )/m);
  return file.slice(start, end < 0 ? undefined : start + 1 + end).trim();
}
