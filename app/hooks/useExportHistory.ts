import { useState, useCallback, useEffect } from "react";
import axios from "axios";

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

  useEffect(() => {
    void fetchHistory();
  }, [fetchHistory]);

  return { items, loading, refetch: fetchHistory };
}
