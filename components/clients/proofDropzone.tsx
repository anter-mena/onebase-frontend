"use client";

import { useRef, useState, type DragEvent } from "react";
import { CloudUpload, FileText, ImageIcon, Sheet, X } from "lucide-react";
import { cn } from "cn";

import { MAX_PROOF_FILES, PROOF_ACCEPT, addProofFiles, fileSize, proofFormat } from "@/lib/clients/proofUpload";

const PICTURES = new Set(["JPG", "PNG", "WebP", "HEIC", "AVIF", "GIF", "TIFF", "BMP"]);
const SHEETS = new Set(["Excel", "CSV"]);

function FormatIcon({ format }: { format: string | null }) {
  const Icon = format && PICTURES.has(format) ? ImageIcon : format && SHEETS.has(format) ? Sheet : FileText;
  return <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />;
}

/**
 * The proof of payment, dropped or picked (2026-10-28): one place to drop files
 * onto, or to click for the file picker, and the files chosen under it, each with
 * a way to take it out again.
 */
export function ProofDropzone({ files, onChange }: { files: File[]; onChange: (files: File[]) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [refused, setRefused] = useState<string[]>([]);
  // dragenter/dragleave fire for every child crossed; counting them is the
  // reliable way to know when the pointer has really left the zone.
  const depth = useRef(0);

  function take(incoming: File[]) {
    const result = addProofFiles(files, incoming);
    setRefused(result.refused);
    onChange(result.files);
  }

  function hasFiles(event: DragEvent) {
    return Array.from(event.dataTransfer.types).includes("Files");
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragEnter={(event) => {
          if (!hasFiles(event)) return;
          event.preventDefault();
          depth.current += 1;
          setDragging(true);
        }}
        onDragOver={(event) => {
          if (!hasFiles(event)) return;
          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
        }}
        onDragLeave={() => {
          depth.current = Math.max(0, depth.current - 1);
          if (depth.current === 0) setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          depth.current = 0;
          setDragging(false);
          take(Array.from(event.dataTransfer.files));
        }}
        disabled={files.length >= MAX_PROOF_FILES}
        aria-describedby="proof-formats"
        className={cn(
          "flex min-h-52 flex-1 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60",
          dragging ? "border-foreground/60 bg-muted" : "border-border bg-muted/30 hover:border-foreground/30 hover:bg-muted/60",
        )}
      >
        <span className={cn("flex size-10 items-center justify-center rounded-full bg-background shadow-sm transition-transform", dragging && "scale-110")}>
          <CloudUpload className="size-5 text-muted-foreground" aria-hidden />
        </span>
        <span className="text-xs font-medium">
          {dragging ? "Drop to add" : files.length >= MAX_PROOF_FILES ? `${MAX_PROOF_FILES} files added` : "Drop the proof here, or click to choose"}
        </span>
        <span id="proof-formats" className="max-w-sm text-[0.65rem] leading-relaxed text-muted-foreground">
          PDF, pictures (JPG, PNG, WebP, HEIC, GIF, TIFF, BMP), Word, Excel, OpenDocument, RTF, CSV, TXT, XML or email (EML, MSG).
          Up to {MAX_PROOF_FILES} files, 10 MB together.
        </span>
      </button>
      <input
        ref={input}
        type="file"
        multiple
        accept={PROOF_ACCEPT}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(event) => {
          take(Array.from(event.target.files ?? []));
          // The same file can be picked again after it was taken out.
          event.target.value = "";
        }}
      />

      {refused.length ? (
        <ul role="alert" className="flex flex-col gap-0.5 text-[0.65rem] text-destructive">
          {refused.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      ) : null}

      {files.length ? (
        <ul aria-label="Proof files" className="flex flex-col gap-1.5">
          {files.map((file, index) => (
            <li key={`${file.name}-${file.size}-${file.lastModified}`} className="flex items-center gap-2 rounded-lg border bg-card px-2.5 py-1.5">
              <FormatIcon format={proofFormat(file)} />
              <span className="min-w-0 flex-1 truncate text-xs">{file.name}</span>
              <span className="shrink-0 text-[0.65rem] text-muted-foreground tabular-nums">{fileSize(file.size)}</span>
              <button
                type="button"
                onClick={() => {
                  setRefused([]);
                  onChange(files.filter((_, at) => at !== index));
                }}
                className="flex size-5 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label={`Remove ${file.name}`}
              >
                <X className="size-3" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
