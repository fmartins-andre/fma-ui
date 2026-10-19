import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Button } from "@/core/button/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/core/card/card";
import { LoadingOverlay, LoadingScreen } from "./loading-overlay";
import meta from "./meta.json";

const componentMeta = {
  title: "ui/LoadingOverlay",
  component: LoadingOverlay,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: { description: { component: meta.description } },
  },
  args: { isLoading: true, label: "Salvando alterações…", children: null },
} satisfies Meta<typeof LoadingOverlay>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

/** Over a card: the content stays visible but can't be used until it finishes. */
export const Default: Story = {
  render: (args) => (
    <LoadingOverlay {...args} className="w-80 rounded-xl">
      <Card>
        <CardHeader>
          <CardTitle>Módulos do cliente</CardTitle>
          <CardDescription>Emissor de notas e radar de notas.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button>Salvar alterações</Button>
        </CardContent>
      </Card>
    </LoadingOverlay>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("status")).toHaveTextContent("Salvando alterações…");
    const region = canvasElement.querySelector("[data-slot=loading-overlay]");
    await expect(region).toHaveAttribute("aria-busy", "true");
    const button = canvas.getByRole("button", { name: "Salvar alterações" });
    await expect(button.closest("[inert]")).not.toBeNull();
  },
};

/** The whole app waits: a non-dismissable modal until the operation ends. */
export const Screen: Story = {
  render: function ScreenExample() {
    const [isLoading, setIsLoading] = useState(false);

    function handleSave() {
      setIsLoading(true);
      setTimeout(() => setIsLoading(false), 1500);
    }

    return (
      <>
        <Button onPress={handleSave}>Bloquear cliente</Button>
        <LoadingScreen isLoading={isLoading} label="Alterando status do cliente…" />
      </>
    );
  },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Bloquear cliente" }));
    const body = within(document.body);
    const dialog = await body.findByRole("dialog", { name: "Alterando status do cliente…" });
    await userEvent.keyboard("{Escape}");
    await expect(dialog).toBeInTheDocument();
    await waitFor(() => expect(body.queryByRole("dialog")).not.toBeInTheDocument(), {
      timeout: 3000,
    });
  },
};
