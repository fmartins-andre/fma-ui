import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/core/table/table";
import { checkContrast, type Theme, type ThemeMode } from "@/lib/theme/index";
import { COLOR_GROUPS } from "./colors-panel";
import { ContrastBadge } from "./fields";

export function Palette({ theme, mode }: { theme: Theme; mode: ThemeMode }) {
  const colors = theme[mode];
  const results = checkContrast(theme, mode);
  const failing = results.filter((result) => !result.passes);
  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-lg font-medium">Contrast ({mode})</h2>
          <p className="text-sm text-muted-foreground">
            {failing.length === 0
              ? "Every pair meets the bar curated themes must pass (4.5:1 for body text, 3:1 for the rest)."
              : `${failing.length} pair${failing.length > 1 ? "s" : ""} below the bar curated themes must pass.`}
          </p>
        </div>
        <Table aria-label="Contrast pairs">
          <TableHeader>
            <TableHead isRowHeader>Sample</TableHead>
            <TableHead>Text</TableHead>
            <TableHead>On</TableHead>
            <TableHead>Minimum</TableHead>
            <TableHead className="text-right">Ratio</TableHead>
          </TableHeader>
          <TableBody>
            {results.map(({ background: bg, foreground: fg, minimum, passes }) => {
              return (
                <TableRow
                  key={`${bg}/${fg}`}
                  id={`${bg}/${fg}`}
                  data-failing={!passes || undefined}
                >
                  <TableCell>
                    <span
                      className="inline-flex rounded-md px-2 py-1 text-sm font-medium ring-1 ring-foreground/10"
                      style={{ background: colors[bg], color: colors[fg] }}
                    >
                      Aa
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-xs">--{fg}</TableCell>
                  <TableCell className="font-mono text-xs">--{bg}</TableCell>
                  <TableCell className="text-xs">{minimum}:1</TableCell>
                  <TableCell className="text-right">
                    <ContrastBadge background={colors[bg]} foreground={colors[fg]} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </section>
      {COLOR_GROUPS.map((group) => (
        <section key={group.id} className="flex flex-col gap-3">
          <h2 className="font-heading text-sm font-medium text-muted-foreground">{group.title}</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {group.colors.map(({ token }) => (
              <div key={token} className="flex items-center gap-3">
                <div
                  className="size-10 shrink-0 rounded-md ring-1 ring-foreground/10"
                  style={{ background: colors[token] }}
                />
                <div className="flex min-w-0 flex-col">
                  <code className="truncate text-xs">--{token}</code>
                  <code className="truncate text-xs text-muted-foreground">{colors[token]}</code>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function TypographySample() {
  return (
    <article className="flex max-w-2xl flex-col gap-4">
      <h1 className="font-heading text-4xl font-semibold tracking-tight">
        The quick brown fox jumps over the lazy dog
      </h1>
      <p className="text-lg text-muted-foreground">
        A theme sets three families (<code className="font-mono">font-sans</code>,{" "}
        <code className="font-mono">font-serif</code>, <code className="font-mono">font-mono</code>
        ), the body letter spacing and the radius every component derives its corners from.
      </p>
      <h2 className="font-heading text-2xl font-semibold">Sans-serif</h2>
      <p className="leading-7">
        Interfaces mostly speak in the sans family: labels, buttons, tables and body text. Good sans
        faces stay legible at 12–14px and keep their rhythm in long paragraphs, which is why letter
        spacing is a theme setting rather than something each component decides.
      </p>
      <h2 className="font-heading text-2xl font-semibold">Serif</h2>
      <blockquote className="border-l-2 pl-4 font-serif text-lg italic">
        “Typography is what language looks like.” — Ellen Lupton
      </blockquote>
      <h2 className="font-heading text-2xl font-semibold">Monospace</h2>
      <pre className="overflow-x-auto rounded-lg border bg-muted p-4 font-mono text-sm">
        {
          "npx shadcn@latest add @fma-ui/theme-violet-bloom\n\nconst ratio = contrastRatio(bg, fg); // 4.5:1"
        }
      </pre>
      <div className="flex flex-wrap gap-4 text-sm">
        <span className="font-light">Light 300</span>
        <span className="font-normal">Regular 400</span>
        <span className="font-medium">Medium 500</span>
        <span className="font-semibold">Semibold 600</span>
        <span className="font-bold">Bold 700</span>
      </div>
    </article>
  );
}
