import { createFileRoute, notFound } from "@tanstack/react-router";
import { ItemPage } from "../../../site/item-page";
import { getItem } from "../../../site/registry";

export const Route = createFileRoute("/_site/_docs/blocks/$name")({
  loader: ({ params }) => {
    const item = getItem("blocks", params.name);
    if (!item) throw notFound();
    return item;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.title} · fma-ui` },
          { name: "description", content: loaderData.description },
        ]
      : [],
  }),
  component: BlockPage,
});

function BlockPage() {
  const item = Route.useLoaderData();
  return <ItemPage key={item.name} kind="blocks" item={item} />;
}
