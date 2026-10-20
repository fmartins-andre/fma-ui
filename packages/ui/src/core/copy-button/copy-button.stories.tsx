import type { Meta, StoryObj } from "@storybook/react-vite";
import { MoreHorizontalIcon } from "lucide-react";
import { toast } from "sonner";
import { expect, spyOn, userEvent, waitFor, within } from "storybook/test";
import { Button } from "@/core/button/button";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/core/dropdown-menu/dropdown-menu";
import { Toaster } from "@/core/sonner/sonner";
import { Spinner } from "@/core/spinner/spinner";
import { CopyButton, useCopyToClipboard } from "./copy-button";
import meta from "./meta.json";

const componentMeta = {
  title: "ui/CopyButton",
  component: CopyButton,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: meta.description } },
  },
  args: {
    value: "PROT-2025-000184273",
  },
} satisfies Meta<typeof CopyButton>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

const ACCESS_KEY = "35250512345678000190550010000012341000012345";

/** The server returns the QR as an image; this placeholder stands in for it. */
const PIX_QR_CODE = `data:image/svg+xml,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='-2 -2 25 25'><path fill='white' d='M-2-2h25v25h-25z'/><path d='M0 0h7v1H0zM8 0h5v1H8zM14 0h7v1H14zM0 1h1v1H0zM6 1h1v1H6zM10 1h1v1H10zM12 1h1v1H12zM14 1h1v1H14zM20 1h1v1H20zM0 2h1v1H0zM2 2h3v1H2zM6 2h1v1H6zM9 2h2v1H9zM12 2h1v1H12zM14 2h1v1H14zM16 2h3v1H16zM20 2h1v1H20zM0 3h1v1H0zM2 3h3v1H2zM6 3h1v1H6zM12 3h1v1H12zM14 3h1v1H14zM16 3h3v1H16zM20 3h1v1H20zM0 4h1v1H0zM2 4h3v1H2zM6 4h1v1H6zM10 4h3v1H10zM14 4h1v1H14zM16 4h3v1H16zM20 4h1v1H20zM0 5h1v1H0zM6 5h1v1H6zM10 5h1v1H10zM14 5h1v1H14zM20 5h1v1H20zM0 6h7v1H0zM8 6h1v1H8zM11 6h2v1H11zM14 6h7v1H14zM8 7h1v1H8zM10 7h1v1H10zM0 8h2v1H0zM8 8h1v1H8zM10 8h5v1H10zM17 8h1v1H17zM0 9h5v1H0zM8 9h1v1H8zM11 9h1v1H11zM16 9h2v1H16zM19 9h1v1H19zM1 10h2v1H1zM5 10h3v1H5zM10 10h1v1H10zM14 10h1v1H14zM16 10h2v1H16zM1 11h1v1H1zM4 11h4v1H4zM9 11h3v1H9zM13 11h2v1H13zM17 11h1v1H17zM1 12h4v1H1zM6 12h2v1H6zM10 12h1v1H10zM14 12h1v1H14zM16 12h2v1H16zM9 13h1v1H9zM14 13h1v1H14zM18 13h3v1H18zM0 14h7v1H0zM9 14h1v1H9zM12 14h1v1H12zM14 14h2v1H14zM18 14h2v1H18zM0 15h1v1H0zM6 15h1v1H6zM8 15h1v1H8zM11 15h1v1H11zM15 15h3v1H15zM19 15h2v1H19zM0 16h1v1H0zM2 16h3v1H2zM6 16h1v1H6zM8 16h2v1H8zM11 16h2v1H11zM16 16h1v1H16zM18 16h1v1H18zM20 16h1v1H20zM0 17h1v1H0zM2 17h3v1H2zM6 17h1v1H6zM8 17h5v1H8zM14 17h1v1H14zM16 17h5v1H16zM0 18h1v1H0zM2 18h3v1H2zM6 18h1v1H6zM8 18h1v1H8zM10 18h1v1H10zM14 18h1v1H14zM18 18h3v1H18zM0 19h1v1H0zM6 19h1v1H6zM9 19h7v1H9zM19 19h1v1H19zM0 20h7v1H0zM8 20h8v1H8z'/></svg>",
)}`;

const PIX_CODE =
  "00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913EMPRESA LTDA6009SAO PAULO62070503***63041D3D";

/** A value too long to type, copied with one press. The outcome is announced. */
export const Default: Story = {
  play: async ({ canvas, args }) => {
    const writeText = spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    const button = canvas.getByRole("button", { name: "Copy" });
    await userEvent.click(button);
    await expect(writeText).toHaveBeenCalledWith(args.value);
    await expect(canvas.getByRole("status")).toHaveTextContent("Copied");
    // The name stays put: the live region carries the outcome.
    await expect(button).toHaveAccessibleName("Copy");
    await expect(button).toHaveAttribute("data-copied");
    writeText.mockRestore();
  },
};

/** Beside a truncated value: the label names what is copied, the tooltip shows the outcome. */
export const WithValue: Story = {
  render: () => (
    <div className="flex w-full max-w-xs items-center gap-1 rounded-md border ps-3">
      <span className="min-w-0 flex-1 truncate font-mono text-xs" title={ACCESS_KEY}>
        {ACCESS_KEY}
      </span>
      <CopyButton
        value={ACCESS_KEY}
        tooltip
        labels={{
          copy: "Copiar chave de acesso",
          copied: "Chave de acesso copiada",
          failed: "Não foi possível copiar",
        }}
      />
    </div>
  ),
  play: async ({ canvas }) => {
    const writeText = spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    await userEvent.click(canvas.getByRole("button", { name: "Copiar chave de acesso" }));
    await expect(writeText).toHaveBeenCalledWith(ACCESS_KEY);
    await expect(canvas.getByRole("status")).toHaveTextContent("Chave de acesso copiada");
    writeText.mockRestore();
  },
};

/** A text button: `children` replaces the icon and names the button. */
export const WithText: Story = {
  render: () => (
    <CopyButton value="AB12-CD34-EF56" variant="outline" size="sm">
      Copiar token de ativação
    </CopyButton>
  ),
};

/** A denied clipboard shows a cross and announces the failure. */
export const ShouldAnnounceFailure: Story = {
  tags: ["!autodocs"],
  play: async ({ canvas, args }) => {
    const writeText = spyOn(navigator.clipboard, "writeText").mockRejectedValue(
      new DOMException("Denied", "NotAllowedError"),
    );
    await userEvent.click(canvas.getByRole("button", { name: "Copy" }));
    await expect(writeText).toHaveBeenCalledWith(args.value);
    await expect(canvas.getByRole("status")).toHaveTextContent("Couldn't copy");
    await expect(canvas.getByRole("button", { name: "Copy" })).toHaveAttribute("data-copy-failed");
    writeText.mockRestore();
  },
};

/** The outcome clears after `timeout`, and the timer is reset on every copy. */
export const ShouldResetAfterTimeout: Story = {
  tags: ["!autodocs"],
  args: { timeout: 300 },
  play: async ({ canvas }) => {
    const writeText = spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    const button = canvas.getByRole("button", { name: "Copy" });
    await userEvent.click(button);
    await expect(button).toHaveAttribute("data-copied");
    await waitFor(() => expect(button).not.toHaveAttribute("data-copied"));
    await expect(canvas.getByRole("status")).toBeEmptyDOMElement();
    writeText.mockRestore();
  },
};

/**
 * Pix: the server returns the QR image and the copy-and-paste code. The image
 * has an `alt`, the code copies with one press and the wait is a status.
 */
export const QrCode: Story = {
  render: () => (
    <div className="flex w-full max-w-xs flex-col items-center gap-4 rounded-xl border p-6">
      <img src={PIX_QR_CODE} alt="QR Code do Pix" className="size-44 rounded-md border" />
      <div className="flex w-full flex-col gap-1.5">
        <span className="text-sm font-medium">Pix copia e cola</span>
        <div className="flex items-center gap-1 rounded-md border ps-3">
          <span className="min-w-0 flex-1 truncate font-mono text-xs">{PIX_CODE}</span>
          <CopyButton
            value={PIX_CODE}
            tooltip
            labels={{
              copy: "Copiar código Pix",
              copied: "Código Pix copiado",
              failed: "Não foi possível copiar",
            }}
          />
        </div>
      </div>
      <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner aria-hidden="true" />
        Aguardando o pagamento
      </p>
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("img", { name: "QR Code do Pix" })).toBeInTheDocument();
    const writeText = spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    await userEvent.click(canvas.getByRole("button", { name: "Copiar código Pix" }));
    await expect(writeText).toHaveBeenCalledWith(PIX_CODE);
    await expect(canvas.getByText("Código Pix copiado")).toHaveAttribute("role", "status");
    writeText.mockRestore();
  },
};

function CopyAccessKeyMenu() {
  const { copy } = useCopyToClipboard({
    onCopy: () => toast.success("Chave de acesso copiada"),
    onCopyError: () => toast.error("Não foi possível copiar a chave de acesso"),
  });

  return (
    <DropdownMenuTrigger>
      <Button variant="ghost" size="icon-sm" aria-label="Ações da nota">
        <MoreHorizontalIcon />
      </Button>
      <DropdownMenu
        className="w-52"
        onAction={(key) => {
          if (key === "copy-key") void copy(ACCESS_KEY);
        }}
      >
        <DropdownMenuItem id="copy-key">Copiar chave de acesso</DropdownMenuItem>
        <DropdownMenuItem id="download">Baixar XML</DropdownMenuItem>
      </DropdownMenu>
    </DropdownMenuTrigger>
  );
}

/**
 * Other triggers use the hook. The menu closes on the action, so the outcome
 * goes to a toast, which is announced.
 */
export const WithMenuItem: Story = {
  decorators: [
    (Story) => (
      <>
        <Story />
        <Toaster />
      </>
    ),
  ],
  render: () => <CopyAccessKeyMenu />,
  play: async ({ canvas, canvasElement }) => {
    const writeText = spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    await userEvent.click(canvas.getByRole("button", { name: "Ações da nota" }));
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await body.findByRole("menuitem", { name: "Copiar chave de acesso" }));
    await expect(writeText).toHaveBeenCalledWith(ACCESS_KEY);
    await expect(await body.findByText("Chave de acesso copiada")).toBeInTheDocument();
    writeText.mockRestore();
  },
};
