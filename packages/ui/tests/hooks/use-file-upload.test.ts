// @vitest-environment happy-dom
import { act, createElement, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  type FileUploadController,
  type FileUploadEntry,
  formatBytes,
  matchesAccept,
  type UseFileUploadOptions,
  useFileUpload,
} from "@/hooks/use-file-upload";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | undefined;
let upload: FileUploadController;

function render(options: UseFileUploadOptions = {}, strict = false) {
  function Harness(props: UseFileUploadOptions) {
    upload = useFileUpload(props);
    return null;
  }
  root ??= createRoot(document.createElement("div"));
  const element = createElement(Harness, options);
  act(() => root?.render(strict ? createElement(StrictMode, null, element) : element));
}

afterEach(() => {
  act(() => root?.unmount());
  root = undefined;
});

const file = (name: string, size = 10, type = "") =>
  new File([new Uint8Array(size)], name, { type });

const names = (files: FileUploadEntry[]) => files.map((entry) => entry.file.name);

describe("formatBytes", () => {
  it("formats in binary units", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5 MB");
  });
});

describe("matchesAccept", () => {
  it("matches extensions, wildcards and exact MIME types", () => {
    expect(matchesAccept(file("cert.PFX"), ".pfx,.p12")).toBe(true);
    expect(matchesAccept(file("cert.pem"), ".pfx, .p12")).toBe(false);
    expect(matchesAccept(file("a.png", 1, "image/png"), "image/*")).toBe(true);
    expect(matchesAccept(file("a.pdf", 1, "application/pdf"), "image/*")).toBe(false);
    expect(matchesAccept(file("a.pdf", 1, "application/pdf"), "application/pdf")).toBe(true);
    expect(matchesAccept(file("anything"), "*")).toBe(true);
    expect(matchesAccept(file("anything"), "")).toBe(true);
  });
});

describe("useFileUpload", () => {
  it("replaces the file in single mode and keeps it when the new one is invalid", () => {
    render({ accept: ".pfx" });
    act(() => upload.addFiles([file("a.pfx"), file("b.pfx")]));
    expect(names(upload.files)).toEqual(["a.pfx"]);

    act(() => upload.addFiles([file("c.pfx")]));
    expect(names(upload.files)).toEqual(["c.pfx"]);

    act(() => upload.addFiles([file("d.txt")]));
    expect(names(upload.files)).toEqual(["c.pfx"]);
    expect(upload.errors).toEqual([
      expect.objectContaining({ code: "file-invalid-type", file: expect.any(File) }),
    ]);
  });

  it("validates size once per file and keeps the valid ones of a batch", () => {
    const onError = vi.fn();
    render({ multiple: true, maxSize: 100, onError });
    act(() => upload.addFiles([file("big.bin", 200), file("ok.bin", 50)]));
    expect(names(upload.files)).toEqual(["ok.bin"]);
    expect(upload.errors).toEqual([
      {
        code: "file-too-large",
        message: '"big.bin" is larger than 100 B.',
        file: expect.any(File),
      },
    ]);
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it("skips duplicates without dropping the rest of the batch", () => {
    render({ multiple: true });
    act(() => upload.addFiles([file("a.txt")]));
    act(() => upload.addFiles([file("a.txt"), file("b.txt"), file("b.txt")]));
    expect(names(upload.files)).toEqual(["a.txt", "b.txt"]);
    expect(upload.errors).toEqual([]);
  });

  it("sees files from a batch added in the same tick", () => {
    render({ multiple: true, maxFiles: 2 });
    act(() => {
      upload.addFiles([file("a.txt")]);
      upload.addFiles([file("a.txt"), file("b.txt")]);
      upload.addFiles([file("c.txt")]);
    });
    expect(names(upload.files)).toEqual(["a.txt", "b.txt"]);
    expect(upload.errors).toEqual([
      { code: "too-many-files", message: "You can add up to 2 files." },
    ]);
  });

  it("calls onChange and onFilesAdded once per batch under StrictMode", () => {
    const onChange = vi.fn();
    const onFilesAdded = vi.fn();
    render({ multiple: true, onChange, onFilesAdded }, true);
    act(() => upload.addFiles([file("a.txt"), file("b.txt")]));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(names(onChange.mock.calls[0]?.[0])).toEqual(["a.txt", "b.txt"]);
    expect(onFilesAdded).toHaveBeenCalledTimes(1);
  });

  it("works controlled", () => {
    const onChange = vi.fn();
    const stored: FileUploadEntry = {
      id: "saved",
      file: { id: "saved", name: "cert.pfx", size: 2048, type: "application/x-pkcs12" },
    };
    render({ value: [stored], multiple: true, onChange });
    act(() => upload.addFiles([file("new.pfx")]));
    expect(names(onChange.mock.calls[0]?.[0])).toEqual(["cert.pfx", "new.pfx"]);
    // The parent didn't take the change.
    expect(names(upload.files)).toEqual(["cert.pfx"]);

    act(() => upload.removeFile("saved"));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it("removes, clears and resets errors", () => {
    render({ multiple: true, defaultValue: [], accept: ".txt" });
    act(() => upload.addFiles([file("a.txt"), file("b.txt"), file("c.png")]));
    expect(upload.errors).toHaveLength(1);
    const first = upload.files[0];
    act(() => upload.removeFile(first?.id ?? ""));
    expect(names(upload.files)).toEqual(["b.txt"]);
    expect(upload.errors).toEqual([]);

    act(() => upload.addFiles([file("d.png")]));
    act(() => upload.clearErrors());
    expect(upload.errors).toEqual([]);

    act(() => upload.clearFiles());
    expect(upload.files).toEqual([]);
  });

  it("ignores files while disabled", () => {
    render({ isDisabled: true });
    act(() => upload.addFiles([file("a.txt")]));
    expect(upload.files).toEqual([]);
  });

  it("translates messages", () => {
    render({
      accept: ".pfx",
      messages: { fileInvalidType: (rejected) => `${rejected.name}: formato não aceito.` },
    });
    act(() => upload.addFiles([file("a.txt")]));
    expect(upload.errors[0]?.message).toBe("a.txt: formato não aceito.");
  });
});
