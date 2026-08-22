"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatNaira } from "@/lib/money";
import type { SizeOptionWithUsage } from "@/lib/queries";

type Props = {
  categories: string[];
  sizeOptions: SizeOptionWithUsage[];
};

/** Filter controls for categories, size groups, and min/max price thresholds. */
export function ProductFilters({ categories, sizeOptions }: Props) {

  const router = useRouter();
  const sp = useSearchParams();

  const q = sp?.get("q") ?? "";
  const category = sp?.get("category") ?? "";
  const size = sp?.get("size") ?? "";
  const minPrice = sp?.get("minPrice") ?? "";
  const maxPrice = sp?.get("maxPrice") ?? "";

  const [minInput, setMinInput] = useState(minPrice);
  const [maxInput, setMaxInput] = useState(maxPrice);

  useEffect(() => {
    setMinInput(minPrice);
    setMaxInput(maxPrice);
  }, [minPrice, maxPrice]);

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(sp?.toString() ?? "");
    for (const [k, v] of Object.entries(updates)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    router.push(params.size > 0 ? `/?${params}#catalog` : "/#catalog");
  };

  const clearAll = () => {
    router.push("/#catalog");
  };

  const byCategory = new Map<string, SizeOptionWithUsage[]>();
  for (const opt of sizeOptions) {
    const list = byCategory.get(opt.category) ?? [];
    list.push(opt);
    byCategory.set(opt.category, list);
  }
  const categoryLabels: Record<string, string> = {
    age_range: "Age group",
    shoe_size: "Shoe size",
    kids_shoe_size: "Kids shoe size",
    free_size: "One size",
  };

  const hasActiveFilters = Boolean(q || category || size || minPrice || maxPrice);

  const priceLabel = (() => {
    if (minPrice && maxPrice) return `${formatNaira(minPrice)} – ${formatNaira(maxPrice)}`;
    if (minPrice) return `From ${formatNaira(minPrice)}`;
    if (maxPrice) return `Up to ${formatNaira(maxPrice)}`;
    return null;
  })();

  return (
    <div className="space-y-3">
      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-2.5">
        <Select
          value={category}
          onValueChange={(v) => updateParams({ category: v && v !== "all" ? v : null })}
        >
          <SelectTrigger className="w-[160px] bg-background">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={size}
          onValueChange={(v) => updateParams({ size: v && v !== "all" ? v : null })}
        >
          <SelectTrigger className="w-[180px] bg-background">
            <SelectValue placeholder="Any size / age" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any size / age</SelectItem>
            {[...byCategory.entries()].map(([cat, opts]) => (
              <div key={cat}>
                <p className="px-2 pt-2 pb-1 text-xs font-medium text-muted-foreground">
                  {categoryLabels[cat] ?? cat}
                </p>
                {opts.map((o) => (
                  <SelectItem key={o.id} value={o.label}>
                    {o.label}
                  </SelectItem>
                ))}
              </div>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1.5 rounded-lg border bg-background px-2.5 py-1 text-sm shadow-2xs">
          <span className="text-xs font-medium text-muted-foreground">₦</span>
          <input
            type="number"
            min={0}
            placeholder="Min"
            value={minInput}
            onChange={(e) => setMinInput(e.target.value)}
            onBlur={() => updateParams({ minPrice: minInput || null })}
            onKeyDown={(e) => {
              if (e.key === "Enter") updateParams({ minPrice: minInput || null });
            }}
            className="w-16 bg-transparent text-sm outline-hidden placeholder:text-muted-foreground/60"
          />
          <span className="text-muted-foreground/50">–</span>
          <input
            type="number"
            min={0}
            placeholder="Max"
            value={maxInput}
            onChange={(e) => setMaxInput(e.target.value)}
            onBlur={() => updateParams({ maxPrice: maxInput || null })}
            onKeyDown={(e) => {
              if (e.key === "Enter") updateParams({ maxPrice: maxInput || null });
            }}
            className="w-16 bg-transparent text-sm outline-hidden placeholder:text-muted-foreground/60"
          />
        </div>
      </div>

      {/* Active filters chips bar */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          <span className="text-xs font-medium text-muted-foreground">Active filters:</span>

          {q && (
            <button
              type="button"
              onClick={() => updateParams({ q: null })}
              className="inline-flex items-center gap-1.5 rounded-full border bg-muted/60 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
              title="Remove keyword filter"
            >
              <span>Search: &ldquo;{q}&rdquo;</span>
              <X className="size-3 text-muted-foreground transition-colors hover:text-destructive" />
            </button>
          )}

          {category && (
            <button
              type="button"
              onClick={() => updateParams({ category: null })}
              className="inline-flex items-center gap-1.5 rounded-full border bg-muted/60 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
              title="Remove category filter"
            >
              <span>Category: {category}</span>
              <X className="size-3 text-muted-foreground transition-colors hover:text-destructive" />
            </button>
          )}

          {size && (
            <button
              type="button"
              onClick={() => updateParams({ size: null })}
              className="inline-flex items-center gap-1.5 rounded-full border bg-muted/60 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
              title="Remove size filter"
            >
              <span>Size: {size}</span>
              <X className="size-3 text-muted-foreground transition-colors hover:text-destructive" />
            </button>
          )}

          {priceLabel && (
            <button
              type="button"
              onClick={() => {
                setMinInput("");
                setMaxInput("");
                updateParams({ minPrice: null, maxPrice: null });
              }}
              className="inline-flex items-center gap-1.5 rounded-full border bg-muted/60 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
              title="Remove price filter"
            >
              <span>Price: {priceLabel}</span>
              <X className="size-3 text-muted-foreground transition-colors hover:text-destructive" />
            </button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="h-7 gap-1.5 rounded-full px-2.5 text-xs text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <RotateCcw className="size-3" />
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}
