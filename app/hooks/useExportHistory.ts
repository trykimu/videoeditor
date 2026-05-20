import { useState, useCallback, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";

export interface ExportHistoryItem {
  id: string;
  fileName: string;
  codec: string;
  width: number;
  height: number;
  createdAt: string;
  thumbnailUrl: string | null;
  previewUrl: string;
  downloadUrl: string;
}

export function useExportHistory(projectId: string | undefined) {
  const [items, setItems] = useState<ExportHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!projectId) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.get<{ renders: ExportHistoryItem[] }>(
        `/renderer/projects/${encodeURIComponent(projectId)}/renders`,
        { withCredentials: true },
      );
      setItems(data.renders ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const deleteExport = useCallback(
    async (renderId: string): Promise<boolean> => {
      if (!projectId) return false;
      setDeletingId(renderId);
      try {
        await axios.delete(
          `/renderer/projects/${encodeURIComponent(projectId)}/renders/${encodeURIComponent(renderId)}`,
          { withCredentials: true },
        );
        setItems((prev) => prev.filter((item) => item.id !== renderId));
        toast.success("Export deleted");
        return true;
      } catch {
        toast.error("Failed to delete export");
        return false;
      } finally {
        setDeletingId(null);
      }
    },
    [projectId],
  );

  useEffect(() => {
    void fetchHistory();
  }, [fetchHistory]);

  return { items, loading, deletingId, refetch: fetchHistory, deleteExport };
}
