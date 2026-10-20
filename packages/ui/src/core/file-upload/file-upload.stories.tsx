import type { Meta, StoryObj } from "@storybook/react-vite";
import { RotateCwIcon } from "lucide-react";
import { useState } from "react";
import { expect, userEvent, waitFor } from "storybook/test";
import { Button } from "@/core/button/button";
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadError,
  type FileUploadI18n,
  FileUploadItem,
  FileUploadList,
} from "./file-upload";
import meta from "./meta.json";

const PT_BR: FileUploadI18n = {
  labels: {
    dropzone: "Arraste o arquivo para cá",
    dropzoneMultiple: "Arraste os arquivos para cá",
    browse: "Selecionar arquivo",
    browseMultiple: "Selecionar arquivos",
    remove: (name) => `Remover ${name}`,
    progress: (name) => `Enviando ${name}`,
  },
  messages: {
    fileInvalidType: (file) => `"${file.name}" não é um formato aceito.`,
    fileTooLarge: (file) => `"${file.name}" passa do tamanho máximo.`,
    tooManyFiles: (maxFiles) => `Envie no máximo ${maxFiles} arquivos.`,
  },
};

const componentMeta = {
  title: "ui/FileUpload",
  component: FileUpload,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: { description: { component: meta.description } },
  },
  args: { i18n: PT_BR },
} satisfies Meta<typeof FileUpload>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

const fileInput = (canvasElement: HTMLElement) => {
  const input = canvasElement.querySelector<HTMLInputElement>("input[type=file]");
  if (!input) throw new Error("file input not found");
  return input;
};

const fakeFile = (name: string, type = "", size = 2048) =>
  new File([new Uint8Array(size)], name, { type });

/** A real PNG, so the thumbnail renders. */
async function fakeImage(name: string, color: string) {
  const canvas = new OffscreenCanvas(64, 64);
  const context = canvas.getContext("2d");
  if (context) {
    context.fillStyle = color;
    context.fillRect(0, 0, 64, 64);
  }
  return new File([await canvas.convertToBlob()], name, { type: "image/png" });
}

/** One certificate file (A1): a new pick replaces it; other formats show an error. */
export const Default: Story = {
  args: { accept: ".pfx,.p12", maxSize: 5 * 1024 * 1024 },
  render: (args) => (
    <FileUpload {...args} className="w-96">
      <FileUploadDropzone description="PFX ou P12, até 5 MB" />
      <FileUploadError />
      <FileUploadList>{(file) => <FileUploadItem file={file} />}</FileUploadList>
    </FileUpload>
  ),
  play: async ({ canvas, canvasElement }) => {
    const user = userEvent.setup({ applyAccept: false });
    await user.upload(fileInput(canvasElement), fakeFile("certificado.pfx"));
    await expect(canvas.getByText("certificado.pfx")).toBeInTheDocument();
    await expect(canvas.getByText("2 KB")).toBeInTheDocument();

    await user.upload(fileInput(canvasElement), fakeFile("notas.txt", "text/plain"));
    await expect(canvas.getByRole("alert")).toHaveTextContent(
      '"notas.txt" não é um formato aceito.',
    );
    await expect(canvas.getByText("certificado.pfx")).toBeInTheDocument();

    await user.upload(fileInput(canvasElement), fakeFile("novo.p12"));
    await expect(canvas.queryByText("certificado.pfx")).not.toBeInTheDocument();
    await expect(canvas.queryByRole("alert")).not.toBeInTheDocument();

    await user.click(canvas.getByRole("button", { name: "Remover novo.p12" }));
    await expect(canvas.queryByText("novo.p12")).not.toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "Selecionar arquivo" })).toHaveFocus();
  },
};

/** Several images or PDFs, up to four; images show a thumbnail. */
export const Multiple: Story = {
  args: { multiple: true, maxFiles: 4, accept: "image/*,.pdf" },
  render: (args) => (
    <FileUpload {...args} className="w-96">
      <FileUploadDropzone description="Imagens ou PDF, até 4 arquivos" />
      <FileUploadError />
      <FileUploadList>{(file) => <FileUploadItem file={file} />}</FileUploadList>
    </FileUpload>
  ),
  play: async ({ canvas, canvasElement }) => {
    await userEvent.upload(fileInput(canvasElement), [
      fakeFile("comprovante.pdf", "application/pdf"),
      await fakeImage("foto.png", "#60a5fa"),
    ]);
    await expect(canvas.getAllByRole("listitem")).toHaveLength(2);

    await userEvent.upload(fileInput(canvasElement), [
      fakeFile("a.png", "image/png"),
      fakeFile("b.png", "image/png"),
      fakeFile("c.png", "image/png"),
    ]);
    await expect(canvas.getByRole("alert")).toHaveTextContent("Envie no máximo 4 arquivos.");
    await expect(canvas.getAllByRole("listitem")).toHaveLength(2);

    await userEvent.click(canvas.getByRole("button", { name: "Remover comprovante.pdf" }));
    await expect(canvas.getAllByRole("listitem")).toHaveLength(1);
    await expect(canvas.getByRole("button", { name: "Remover foto.png" })).toHaveFocus();
  },
};

/** Simulates a request that reports progress; in the app, use your upload's own events. */
function simulateUpload(onProgress: (value: number) => void) {
  let value = 0;
  const timer = setInterval(() => {
    value = Math.min(value + 25, 100);
    onProgress(value);
    if (value === 100) clearInterval(timer);
  }, 400);
}

/** The app uploads on `onFilesAdded` and passes each file's progress by id. */
export const WithProgress: Story = {
  args: { multiple: true },
  render: (args) => {
    const [progress, setProgress] = useState<Record<string, number>>({});
    return (
      <FileUpload
        {...args}
        className="w-96"
        onFilesAdded={(files) => {
          for (const { id } of files) {
            simulateUpload((value) => setProgress((current) => ({ ...current, [id]: value })));
          }
        }}
      >
        <FileUploadDropzone />
        <FileUploadList>
          {(file) => {
            const value = progress[file.id] ?? 0;
            return value < 100 ? (
              <FileUploadItem file={file} progress={value} description="Enviando…" />
            ) : (
              <FileUploadItem file={file} description="Enviado" />
            );
          }}
        </FileUploadList>
      </FileUpload>
    );
  },
  play: async ({ canvas, canvasElement }) => {
    await userEvent.upload(fileInput(canvasElement), fakeFile("relatorio.pdf"));
    await expect(canvas.getByRole("progressbar", { name: "Enviando relatorio.pdf" })).toBeVisible();
    await waitFor(() => expect(canvas.getByText("Enviado")).toBeInTheDocument(), {
      timeout: 3000,
    });
    await expect(canvas.queryByRole("progressbar")).not.toBeInTheDocument();
  },
};

const STORED_FILES = [
  {
    id: "contrato",
    file: { id: "contrato", name: "contrato-social.pdf", size: 482_000, type: "application/pdf" },
  },
  {
    id: "planilha",
    file: { id: "planilha", name: "faturamento-2026.xlsx", size: 96_500, type: "" },
  },
  {
    id: "logo",
    file: { id: "logo", name: "logo-empresa.svg", size: 12_300, type: "image/svg+xml" },
  },
];

/**
 * Files already stored (`FileMetadata`) next to the item states: uploading,
 * done, and failed with a retry action.
 */
export const ItemStates: Story = {
  args: { multiple: true, defaultValue: STORED_FILES },
  render: (args) => (
    <FileUpload {...args} className="w-96">
      <FileUploadList>
        {(file) =>
          file.id === "contrato" ? (
            <FileUploadItem file={file} description="Enviado em 12/10/2026" />
          ) : file.id === "planilha" ? (
            <FileUploadItem file={file} progress={60} description="Enviando… 60%" />
          ) : (
            <FileUploadItem
              file={file}
              error="Não foi possível enviar."
              actions={
                <Button variant="ghost" size="icon-sm" aria-label="Tentar de novo">
                  <RotateCwIcon />
                </Button>
              }
            />
          )
        }
      </FileUploadList>
    </FileUpload>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole("listitem")).toHaveLength(3);
    await expect(canvas.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "60");
    await expect(canvas.getByText("Não foi possível enviar.")).toBeInTheDocument();
  },
};

export const Disabled: Story = {
  args: { isDisabled: true, accept: ".pfx,.p12" },
  render: (args) => (
    <FileUpload {...args} className="w-96">
      <FileUploadDropzone description="PFX ou P12, até 5 MB" />
    </FileUpload>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: "Selecionar arquivo" })).toBeDisabled();
  },
};
