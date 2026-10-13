import { sameTheme, type Theme } from "@/lib/theme/index";
import { getTheme } from "@/themes/index";
import { SHADCN_ADD } from "../site/shadcn";

/**
 * How to install `theme` with the shadcn CLI. Only an unchanged curated theme is
 * hosted under /r/; anything else is installed from its downloaded registry item.
 */
export function themeInstall(theme: Theme) {
  const curated = getTheme(theme.name);
  const published = curated !== undefined && sameTheme(curated, theme);
  const itemName = `theme-${theme.name}`;
  const command = published
    ? `${SHADCN_ADD} @fma-ui/${itemName}`
    : `${SHADCN_ADD} ./${itemName}.json`;
  return { published, itemName, command };
}
