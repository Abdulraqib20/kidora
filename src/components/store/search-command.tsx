"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatNaira } from "@/lib/money";

type SearchResult = {
  id: string;
  name: string;
  brand: string | null;
  category: string;
  image: string | null;
  minPrice: number;
  unitsSold: number;
};

export function SearchCommand() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Debounced search-as-you-type; stale requests are aborted.
  useEffect(() => {
    const query = q.trim();
    if (query.length < 2) {
      setResults([]);
      setOpen(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        setResults(data.results ?? []);
        setOpen(true);
      } catch {
        // aborted or offline — keep previous results
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [q]);

  // Close on outside click.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const goTo = (href: string) => {
    setOpen(false);
    setQ("");
    router.push(href);
  };

  return (
    <div ref={rootRef} className="relative w-full sm:max-w-md">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => q.trim().length >= 2 && setOpen(true)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        placeholder="Search products, brands, serials…"
        className="pl-9"
        aria-label="Search products"
      />
      {loading && (
        <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
      )}

      {open && q.trim().length >= 2 && (
        <div className="absolute top-full left-0 z-50 mt-2 w-full overflow-hidden rounded-xl border bg-popover shadow-lg">
          {results.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              No matches for “{q.trim()}”.
            </p>
          ) : (
            <>
              {results.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => goTo(`/products/${r.id}`)}
                  className="flex w-full items-center gap-3 border-b px-3 py-2 text-left last:border-0 hover:bg-muted"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                    {r.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Search className="size-4 text-muted-foreground" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{r.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {r.brand ?? r.category}
                      {r.unitsSold > 0 ? ` · ${r.unitsSold} sold` : ""}
                    </span>
                  </span>
                  <span className="text-sm font-semibold">{formatNaira(r.minPrice)}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => goTo(`/?q=${encodeURIComponent(q.trim())}`)}
                className="block w-full bg-muted/50 px-3 py-2.5 text-center text-sm font-medium hover:bg-muted"
              >
                See all results for “{q.trim()}”
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
