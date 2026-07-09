import { useEffect, useState } from "react";

/** Reads a Blob from IndexedDB (via loader) and returns an object URL. */
export function useBlobUrl(blob: Blob | undefined | null): string | undefined {
  const [url, setUrl] = useState<string | undefined>();
  useEffect(() => {
    if (!blob) {
      setUrl(undefined);
      return;
    }
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  return url;
}
