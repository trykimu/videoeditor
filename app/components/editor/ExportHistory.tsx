import React, { useMemo, useState } from "react";
import { Download, Play, Loader2, Film, ArrowDownAZ, Trash2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { type ExportHistoryItem } from "~/hooks/useExportHistory";

export type ExportHistorySort = "newest" | "oldest" | "name-asc" | "name-desc";

function formatRenderDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function sortHistoryItems(items: ExportHistoryItem[], sort: ExportHistorySort): ExportHistoryItem[] {
  const copy = [...items];
  switch (sort) {
    case "oldest":
      return copy.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    case "name-asc":
      return copy.sort((a, b) => a.fileName.localeCompare(b.fileName, undefined, { sensitivity: "base" }));
    case "name-desc":
      return copy.sort((a, b) => b.fileName.localeCompare(a.fileName, undefined, { sensitivity: "base" }));
    case "newest":
    default:
      return copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}

interface ExportHistoryProps {
  items: ExportHistoryItem[];
  loading: boolean;
  deletingId: string | null;
  onDelete: (renderId: string) => Promise<boolean>;
}

export function ExportHistory({ items, loading, deletingId, onDelete }: ExportHistoryProps) {
  const [preview, setPreview] = useState<ExportHistoryItem | null>(null);
  const [sort, setSort] = useState<ExportHistorySort>("newest");

  const sortedItems = useMemo(() => sortHistoryItems(items, sort), [items, sort]);

  const handleDelete = async (item: ExportHistoryItem) => {
    const confirmed = window.confirm(
      `Delete "${item.fileName}"? This removes the file from storage and cannot be undone.`,
    );
    if (!confirmed) return;
    const ok = await onDelete(item.id);
    if (ok && preview?.id === item.id) {
      setPreview(null);
    }
  };

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            Export history
          </div>
          {!loading && items.length > 1 && (
            <Select value={sort} onValueChange={(v) => setSort(v as ExportHistorySort)}>
              <SelectTrigger size="sm" className="h-6 w-[108px] text-[9px] px-1.5 gap-1">
                <ArrowDownAZ className="h-2.5 w-2.5 shrink-0 opacity-60" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest" className="text-xs">
                  Newest first
                </SelectItem>
                <SelectItem value="oldest" className="text-xs">
                  Oldest first
                </SelectItem>
                <SelectItem value="name-asc" className="text-xs">
                  Name A–Z
                </SelectItem>
                <SelectItem value="name-desc" className="text-xs">
                  Name Z–A
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground py-4 justify-center">
            <Loader2 className="h-3 w-3 animate-spin" />
            Loading…
          </div>
        )}

        {!loading && items.length === 0 && (
          <p className="text-[10px] text-muted-foreground py-2">
            No exports yet. Your completed renders will appear here.
          </p>
        )}

        {!loading && sortedItems.length > 0 && (
          <ul className="space-y-2 max-h-[280px] overflow-y-auto pr-0.5">
            {sortedItems.map((item) => {
              const isDeleting = deletingId === item.id;
              return (
                <li
                  key={item.id}
                  className="flex gap-2 rounded-md border border-border/50 bg-muted/20 p-1.5 hover:bg-muted/40 transition-colors">
                  <button
                    type="button"
                    className="relative shrink-0 w-20 h-11 rounded overflow-hidden bg-black/40 border border-border/40 group"
                    onClick={() => setPreview(item)}
                    title="Preview"
                    disabled={isDeleting}>
                    {item.thumbnailUrl ? (
                      <img
                        src={item.thumbnailUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <Film className="h-4 w-4" />
                      </span>
                    )}
                    <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="h-4 w-4 text-white fill-white" />
                    </span>
                  </button>

                  <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                    <span className="text-[10px] font-medium truncate" title={item.fileName}>
                      {item.fileName}
                    </span>
                    <span className="text-[9px] text-muted-foreground">
                      {formatRenderDate(item.createdAt)}
                    </span>
                    <span className="text-[9px] text-muted-foreground font-mono">
                      {item.width}×{item.height} · {item.codec.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1 shrink-0 justify-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      title="Download"
                      disabled={isDeleting}
                      onClick={() => {
                        const a = document.createElement("a");
                        a.href = item.downloadUrl;
                        a.setAttribute("download", item.fileName);
                        a.click();
                      }}>
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      title="Delete export"
                      disabled={isDeleting || deletingId !== null}
                      onClick={() => void handleDelete(item)}>
                      {isDeleting ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {preview && (
        <div className="fixed inset-0 z-[9998]">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setPreview(null)}
          />
          <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
            <div className="pointer-events-auto w-full max-w-2xl rounded-lg border border-border bg-background shadow-xl overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{preview.fileName}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatRenderDate(preview.createdAt)}
                  </p>
                </div>
                <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setPreview(null)}>
                  Close
                </Button>
              </div>
              <video
                src={preview.previewUrl}
                controls
                autoPlay
                className="w-full max-h-[60vh] bg-black"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
