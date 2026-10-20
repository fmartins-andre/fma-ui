"use client";

import { cn } from "cn";
import { UploadIcon, XIcon } from "lucide-react";
import * as React from "react";
import { DropZone, FileTrigger, Text } from "react-aria-components";
import { Button } from "@/core/button/button";
import { FieldError } from "@/core/field/field";
import { FileType, getFileType } from "@/core/file-type/file-type";
import { IconTile } from "@/core/icon-tile/icon-tile";
import { Progress } from "@/core/progress/progress";
import {
  type FileUploadController,
  type FileUploadEntry,
  type FileUploadMessages,
  formatBytes,
  type UseFileUploadOptions,
  useFileUpload,
} from "@/hooks/use-file-upload";

type FileUploadLabels = {
  /** The drop zone's name, also its visible title. */
  dropzone: string;
  dropzoneMultiple: string;
  browse: string;
  browseMultiple: string;
  remove: (name: string) => string;
  progress: (name: string) => string;
};

type FileUploadI18n = {
  labels?: Partial<FileUploadLabels>;
  /** The validation errors (see `use-file-upload`). */
  messages?: Partial<FileUploadMessages>;
};

const defaultFileUploadLabels: FileUploadLabels = {
  dropzone: "Drag and drop a file here",
  dropzoneMultiple: "Drag and drop files here",
  browse: "Choose file",
  browseMultiple: "Choose files",
  remove: (name) => `Remove ${name}`,
  progress: (name) => `Uploading ${name}`,
};

type FileUploadContextValue = FileUploadController & {
  labels: FileUploadLabels;
  rootRef: React.RefObject<HTMLDivElement | null>;
};

const FileUploadContext = React.createContext<FileUploadContextValue | null>(null);

function useFileUploadContext() {
  const context = React.useContext(FileUploadContext);
  if (!context) throw new Error("FileUpload parts must be used within a FileUpload.");
  return context;
}

type FileUploadProps = Omit<UseFileUploadOptions, "messages" | "onChange"> &
  Omit<React.ComponentProps<"div">, "defaultValue" | "onChange" | "onError"> & {
    onChange?: (files: FileUploadEntry[]) => void;
    i18n?: FileUploadI18n;
  };

/**
 * Picks files by dropping, pasting or browsing, and lists them. Holds the
 * `use-file-upload` state; the parts inside (`FileUploadDropzone`,
 * `FileUploadTrigger`, `FileUploadList`, `FileUploadError`) read it.
 */
function FileUpload({
  accept,
  maxSize,
  maxFiles,
  multiple,
  value,
  defaultValue,
  onChange,
  onFilesAdded,
  onError,
  isDisabled,
  i18n,
  className,
  ...props
}: FileUploadProps) {
  const upload = useFileUpload({
    accept,
    maxSize,
    maxFiles,
    multiple,
    value,
    defaultValue,
    onChange,
    onFilesAdded,
    onError,
    isDisabled,
    messages: i18n?.messages,
  });
  const rootRef = React.useRef<HTMLDivElement>(null);
  const labelOverrides = i18n?.labels;
  const labels = React.useMemo(
    () => ({ ...defaultFileUploadLabels, ...labelOverrides }),
    [labelOverrides],
  );
  const context = { ...upload, labels, rootRef };

  return (
    <FileUploadContext.Provider value={context}>
      <div
        ref={rootRef}
        data-slot="file-upload"
        data-invalid={upload.errors.length > 0 || undefined}
        data-disabled={upload.isDisabled || undefined}
        className={cn("group/file-upload flex w-full min-w-0 flex-col gap-3", className)}
        {...props}
      />
    </FileUploadContext.Provider>
  );
}

const acceptedTypes = (accept: string) =>
  accept === "*"
    ? undefined
    : accept
        .split(",")
        .map((type) => type.trim())
        .filter(Boolean);

/** A button that opens the file picker; defaults to an outline "Choose file" button. */
function FileUploadTrigger({
  variant = "outline",
  size = "sm",
  children,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { accept, multiple, isDisabled, addFiles, labels } = useFileUploadContext();
  const inputRef = React.useRef<HTMLInputElement>(null);

  return (
    <FileTrigger
      ref={inputRef}
      acceptedFileTypes={acceptedTypes(accept)}
      allowsMultiple={multiple}
      onSelect={(list) => {
        if (list) addFiles(list);
        // Picking the same file again must still fire a change.
        if (inputRef.current) inputRef.current.value = "";
      }}
    >
      <Button
        data-slot="file-upload-trigger"
        variant={variant}
        size={size}
        isDisabled={isDisabled}
        {...props}
      >
        {children ?? (
          <>
            <UploadIcon data-icon="inline-start" />
            {multiple ? labels.browseMultiple : labels.browse}
          </>
        )}
      </Button>
    </FileTrigger>
  );
}

/**
 * The drop target: drag files onto it, paste them while it has focus, or use
 * its trigger. Without children it shows an icon, the title, `description`
 * (accepted types, size limit) and a `FileUploadTrigger`.
 */
function FileUploadDropzone({
  description,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<typeof DropZone>, "className" | "children"> & {
  description?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) {
  const { multiple, isDisabled, addFiles, labels } = useFileUploadContext();

  return (
    <DropZone
      data-slot="file-upload-dropzone"
      isDisabled={isDisabled}
      onDrop={async (event) => {
        const items = event.items.filter((item) => item.kind === "file");
        addFiles(await Promise.all(items.map((item) => item.getFile())));
      }}
      className={cn(
        "flex min-w-0 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-input p-6 text-center text-sm transition-colors outline-none",
        "data-drop-target:border-primary data-drop-target:bg-accent data-drop-target:text-accent-foreground",
        "data-focus-visible:border-ring data-focus-visible:ring-3 data-focus-visible:ring-ring/50",
        "data-disabled:opacity-50 group-data-invalid/file-upload:border-destructive",
        className,
      )}
      {...props}
    >
      {children ?? (
        <>
          <IconTile variant="outline">
            <UploadIcon />
          </IconTile>
          <div className="flex flex-col gap-1">
            <Text slot="label" className="font-medium">
              {multiple ? labels.dropzoneMultiple : labels.dropzone}
            </Text>
            {description && <p className="text-muted-foreground">{description}</p>}
          </div>
          <FileUploadTrigger />
        </>
      )}
    </DropZone>
  );
}

/**
 * The picked files. Pass a function to render each one (usually a
 * `FileUploadItem`); renders nothing while the list is empty.
 */
function FileUploadList({
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"ul">, "children"> & {
  children: (file: FileUploadEntry) => React.ReactNode;
}) {
  const { files } = useFileUploadContext();
  if (files.length === 0) return null;

  return (
    <ul data-slot="file-upload-list" className={cn("flex flex-col gap-2", className)} {...props}>
      {files.map((file) => (
        <React.Fragment key={file.id}>{children(file)}</React.Fragment>
      ))}
    </ul>
  );
}

const isImage = (file: FileUploadEntry["file"]) => file.type.startsWith("image/");

function useObjectUrl(file: File | undefined) {
  const [url, setUrl] = React.useState<string>();
  React.useEffect(() => {
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
      setUrl(undefined);
    };
  }, [file]);
  return url;
}

function FileUploadItemMedia({
  file,
  preview,
}: {
  file: FileUploadEntry["file"];
  preview: boolean;
}) {
  const showImage = preview && isImage(file);
  const objectUrl = useObjectUrl(showImage && file instanceof File ? file : undefined);
  const src = showImage ? (file instanceof File ? objectUrl : file.url) : undefined;

  if (src) {
    return (
      <span className="size-10 shrink-0 overflow-hidden rounded-md border bg-muted">
        <img src={src} alt="" className="size-full object-cover" />
      </span>
    );
  }
  return <FileType type={getFileType(file.name)} variant="light" size="default" />;
}

/**
 * One picked file: icon or image preview, name, size, an optional upload
 * `progress` (0–100) and a remove button. `error` replaces the size with a
 * message (a failed upload); `actions` adds buttons before remove (retry).
 */
function FileUploadItem({
  file: entry,
  progress,
  error,
  description,
  actions,
  preview = true,
  className,
  ...props
}: Omit<React.ComponentProps<"li">, "children"> & {
  file: FileUploadEntry;
  progress?: number;
  error?: React.ReactNode;
  /** Replaces the size line. */
  description?: React.ReactNode;
  actions?: React.ReactNode;
  /** Show images as a thumbnail instead of the file-type icon. */
  preview?: boolean;
}) {
  const { removeFile, isDisabled, labels, rootRef } = useFileUploadContext();
  const itemRef = React.useRef<HTMLLIElement>(null);
  const { file } = entry;

  function remove() {
    // Keep focus in the widget: the next item, the previous one, or the trigger.
    const item = itemRef.current;
    const sibling = item?.nextElementSibling ?? item?.previousElementSibling;
    const target =
      sibling?.querySelector<HTMLElement>("[data-slot=file-upload-remove]") ??
      rootRef.current?.querySelector<HTMLElement>("[data-slot=file-upload-trigger]");
    removeFile(entry.id);
    target?.focus();
  }

  return (
    <li
      ref={itemRef}
      data-slot="file-upload-item"
      data-invalid={error ? true : undefined}
      className={cn(
        "flex min-w-0 flex-col gap-2.5 rounded-lg border px-3 py-2.5 text-sm data-invalid:border-destructive/40",
        className,
      )}
      {...props}
    >
      <div className="flex min-w-0 items-center gap-3">
        <FileUploadItemMedia file={file} preview={preview} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate font-medium" title={file.name}>
            {file.name}
          </span>
          <span
            data-slot="file-upload-item-description"
            className={cn("text-xs text-muted-foreground", error && "text-destructive")}
          >
            {error ?? description ?? formatBytes(file.size)}
          </span>
        </div>
        {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
        <Button
          data-slot="file-upload-remove"
          variant="ghost"
          size="icon-sm"
          aria-label={labels.remove(file.name)}
          isDisabled={isDisabled}
          onPress={remove}
        >
          <XIcon />
        </Button>
      </div>
      {progress !== undefined && (
        <Progress value={progress} aria-label={labels.progress(file.name)} />
      )}
    </li>
  );
}

/** The last batch's validation errors, in a `FieldError` (`role="alert"`). */
function FileUploadError(props: Omit<React.ComponentProps<typeof FieldError>, "errors">) {
  const { errors } = useFileUploadContext();
  return <FieldError errors={errors.map(({ message }) => ({ message }))} {...props} />;
}

export type { FileUploadI18n, FileUploadLabels, FileUploadProps };
export {
  FileUpload,
  FileUploadDropzone,
  FileUploadError,
  FileUploadItem,
  FileUploadList,
  FileUploadTrigger,
};
