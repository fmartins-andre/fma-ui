import { BLOCKS, COMPONENTS, STORYBOOK_URL } from "./registry";

export interface NavLink {
  title: string;
  href: string;
  external?: boolean;
}

export interface NavSection {
  title: string;
  links: NavLink[];
}

export const MAIN_NAV: NavLink[] = [
  { title: "Docs", href: "/docs" },
  { title: "Components", href: "/components" },
  { title: "Blocks", href: "/blocks" },
  { title: "Themes", href: "/themes" },
  { title: "Storybook", href: STORYBOOK_URL, external: true },
];

export const DOCS_NAV: NavSection[] = [
  {
    title: "Getting started",
    links: [
      { title: "Introduction", href: "/docs" },
      { title: "Components", href: "/components" },
      { title: "Blocks", href: "/blocks" },
      { title: "Theme editor", href: "/themes" },
      { title: "Storybook", href: STORYBOOK_URL, external: true },
    ],
  },
  {
    title: "Components",
    links: COMPONENTS.map((item) => ({ title: item.title, href: `/components/${item.name}` })),
  },
  {
    title: "Blocks",
    links: BLOCKS.map((item) => ({ title: item.title, href: `/blocks/${item.name}` })),
  },
];
