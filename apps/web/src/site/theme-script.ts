// Kept apart from site/theme.ts so the root route doesn't pull in the curated
// themes just for the inline script.

/** The editor's state: the theme being worn (and edited) and the one it was loaded from. */
export const THEME_STATE_KEY = "fma-ui:theme-editor";

/** What the inline script needs to style the page before React loads. */
export const THEME_SNAPSHOT_KEY = "fma-ui:site-theme";

export const THEME_STYLE_ID = "fma-ui-theme";

export interface ThemeSnapshot {
  /** The theme's CSS custom properties for both modes; empty for the default theme. */
  css: string;
  fonts: { family: string; href: string }[];
}

/**
 * Inline in <head>, after the stylesheets: puts the site theme's CSS (and font
 * links) in place before the first paint, so pages don't flash the default theme.
 */
export const THEME_SCRIPT = `try{var t=JSON.parse(localStorage.getItem("${THEME_SNAPSHOT_KEY}")||"null");if(t&&t.css){var s=document.createElement("style");s.id="${THEME_STYLE_ID}";s.textContent=t.css;document.head.appendChild(s);(t.fonts||[]).forEach(function(f){var l=document.createElement("link");l.rel="stylesheet";l.href=f.href;l.dataset.themeFont=f.family;document.head.appendChild(l)})}}catch(e){}`;
