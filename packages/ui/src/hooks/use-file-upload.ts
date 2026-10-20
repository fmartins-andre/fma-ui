"use client";

import * as React from "react";

/** A file that is already stored somewhere (an existing attachment, a saved certificate). */
type FileMetadata = {
  id: string;
  name: string;
  size: number;
  type: string;
  /** Where it can be fetched; an image `url` doubles as its preview. */
  url?: string;
};

type FileUploadEntry = {
  id: string;
  file: File | FileMetadata;
};

type FileUploadErrorCode = "file-invalid-type" | "file-too-large" | "too-many-files";

type FileUploadError = {
  code: FileUploadErrorCode;
  message: string;
  /** The rejected file; absent on `too-many-files`, which rejects the whole batch. */
  file?: File;
};

type FileUploadMessages = {
  fileInvalidType: (file: File, accept: string) => string;
  fileTooLarge: (file: File, maxSize: number) => string;
  tooManyFiles: (maxFiles: number) => string;
};

type UseFileUploadOptions = {
  /** Comma-separated extensions and MIME types, as in `<input accept>` (`.pfx,.p12`, `image/*`). */
  accept?: string;
  /** In bytes. */
  maxSize?: number;
  /** Only with `multiple`. A batch that would go over it is rejected whole. */
  maxFiles?: number;
  /** Off by default: a new file replaces the current one. */
  multiple?: boolean;
  /** Controlled list. */
  value?: FileUploadEntry[];
  defaultValue?: FileUploadEntry[];
  onChange?: (files: FileUploadEntry[]) => void;
  /** Only the files that passed validation in this batch. */
  onFilesAdded?: (files: FileUploadEntry[]) => void;
  onError?: (errors: FileUploadError[]) => void;
  isDisabled?: boolean;
  /** Overrides the error messages (i18n). */
  messages?: Partial<FileUploadMessages>;
};

type FileUploadController = {
  files: FileUploadEntry[];
  /** Errors from the last batch; cleared on the next one, on remove and on clear. */
  errors: FileUploadError[];
  accept: string;
  multiple: boolean;
  isDisabled: boolean;
  addFiles: (files: FileList | Iterable<File>) => void;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  clearErrors: () => void;
};

/** `1536` → `"1.5 KB"`. */
function formatBytes(bytes: number, decimals = 2): string {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = Number.parseFloat((bytes / 1024 ** exponent).toFixed(Math.max(decimals, 0)));
  return `${value} ${units[exponent]}`;
}

/** Whether a file matches an `<input accept>` string. */
function matchesAccept(file: Pick<File, "name" | "type">, accept: string): boolean {
  const types = accept
    .split(",")
    .map((type) => type.trim().toLowerCase())
    .filter(Boolean);
  if (types.length === 0 || types.includes("*") || types.includes("*/*")) return true;
  const name = file.name.toLowerCase();
  const mime = file.type.toLowerCase();
  return types.some((type) => {
    if (type.startsWith(".")) return name.endsWith(type);
    if (type.endsWith("/*")) return mime.startsWith(type.slice(0, -1));
    return mime === type;
  });
}

const defaultMessages: FileUploadMessages = {
  fileInvalidType: (file) => `"${file.name}" isn't an accepted file type.`,
  fileTooLarge: (file, maxSize) => `"${file.name}" is larger than ${formatBytes(maxSize)}.`,
  tooManyFiles: (maxFiles) => `You can add up to ${maxFiles} files.`,
};

let lastId = 0;
const createId = () => `file-${Date.now().toString(36)}-${(lastId++).toString(36)}`;

const isSameFile = (entry: FileUploadEntry, file: File) =>
  entry.file.name === file.name && entry.file.size === file.size;

/**
 * Headless state for picking files: validation (type, size, count, duplicates),
 * single or multiple selection, controlled or not. It doesn't upload: progress
 * and retries stay with the caller, per file id. Feed it from a react-aria
 * `DropZone`/`FileTrigger` (as `file-upload` does) or any `<input type="file">`.
 *
 * Based on reui's `use-file-upload` (MIT).
 */
function useFileUpload({
  accept = "*",
  maxSize = Number.POSITIVE_INFINITY,
  maxFiles = Number.POSITIVE_INFINITY,
  multiple = false,
  value,
  defaultValue,
  onChange,
  onFilesAdded,
  onError,
  isDisabled = false,
  messages: messageOverrides,
}: UseFileUploadOptions = {}): FileUploadController {
  const isControlled = value !== undefined;
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue ?? []);
  const [errors, setErrors] = React.useState<FileUploadError[]>([]);
  const files = value ?? uncontrolled;

  // Batches that land before the next render see each other's files.
  const filesRef = React.useRef(files);
  filesRef.current = files;

  const callbacksRef = React.useRef({ onChange, onFilesAdded, onError, messageOverrides });
  callbacksRef.current = { onChange, onFilesAdded, onError, messageOverrides };

  const commit = React.useCallback(
    (next: FileUploadEntry[]) => {
      filesRef.current = next;
      if (!isControlled) setUncontrolled(next);
      callbacksRef.current.onChange?.(next);
    },
    [isControlled],
  );

  const addFiles = React.useCallback(
    (list: FileList | Iterable<File>) => {
      if (isDisabled) return;
      const incoming = Array.from(list);
      if (incoming.length === 0) return;

      const { onFilesAdded, onError, messageOverrides } = callbacksRef.current;
      const messages = { ...defaultMessages, ...messageOverrides };
      const current = filesRef.current;
      let rejected: FileUploadError[] = [];
      let accepted: FileUploadEntry[] = [];

      for (const file of multiple ? incoming : incoming.slice(0, 1)) {
        // Dropping the same file again is a no-op, not an error.
        if (multiple && [...current, ...accepted].some((entry) => isSameFile(entry, file))) {
          continue;
        }
        if (!matchesAccept(file, accept)) {
          rejected.push({
            code: "file-invalid-type",
            message: messages.fileInvalidType(file, accept),
            file,
          });
        } else if (file.size > maxSize) {
          rejected.push({
            code: "file-too-large",
            message: messages.fileTooLarge(file, maxSize),
            file,
          });
        } else {
          accepted.push({ id: createId(), file });
        }
      }

      if (multiple && current.length + accepted.length > maxFiles) {
        rejected = [{ code: "too-many-files", message: messages.tooManyFiles(maxFiles) }];
        accepted = [];
      }

      setErrors(rejected);
      if (rejected.length > 0) onError?.(rejected);
      if (accepted.length > 0) {
        commit(multiple ? [...current, ...accepted] : accepted);
        onFilesAdded?.(accepted);
      }
    },
    [accept, commit, isDisabled, maxFiles, maxSize, multiple],
  );

  const removeFile = React.useCallback(
    (id: string) => {
      setErrors([]);
      commit(filesRef.current.filter((entry) => entry.id !== id));
    },
    [commit],
  );

  const clearFiles = React.useCallback(() => {
    setErrors([]);
    commit([]);
  }, [commit]);

  const clearErrors = React.useCallback(() => setErrors([]), []);

  return {
    files,
    errors,
    accept,
    multiple,
    isDisabled,
    addFiles,
    removeFile,
    clearFiles,
    clearErrors,
  };
}

export type {
  FileMetadata,
  FileUploadController,
  FileUploadEntry,
  FileUploadError,
  FileUploadErrorCode,
  FileUploadMessages,
  UseFileUploadOptions,
};
export { formatBytes, matchesAccept, useFileUpload };
