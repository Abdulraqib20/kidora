"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SizeOptionWithUsage } from "@/lib/queries";

type Props = {
  categories: string[];
  sizeOptions: SizeOptionWithUsage[];
};

export function ProductFilters({ categories, sizeOptions }: Props) {
  const router = useRouter();
  const sp = useSearchParams();

  const current = {
    category: sp?.get("category") ?? "",
    size: sp?.get("size") ?? "",
    minPrice: sp?.get("minPrice") ?? "",
    maxPrice: sp?.get("maxPrice") ?? "",
  };

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(sp?.toString() ?? "");
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(params.size > 0 ? `/?${params}` : "/");
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

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={current.category}
        onValueChange={(v) => setParam("category", v && v !== "all" ? v : "")}
      >
        <SelectTrigger className="w-[160px]">
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
        value={current.size}
        onValueChange={(v) => setParam("size", v && v !== "all" ? v : "")}
      >
        <SelectTrigger className="w-[180px]">
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
                <SelectItem key={o.id} value={o.id}>
                  {o.label}
                </SelectItem>
              ))}
            </div>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-1">
        <Input
          type="number"
          min={0}
          placeholder="Min ₦"
          className="w-24"
          defaultValue={current.minPrice}
          onBlur={(e) => setParam("minPrice", e.target.value)}
        />
        <span className="text-muted-foreground">–</span>
        <Input
          type="number"
          min={0}
          placeholder="Max ₦"
          className="w-24"
          defaultValue={current.maxPrice}
          onBlur={(e) => setParam("maxPrice", e.target.value)}
        />
      </div>

      {(current.category || current.size || current.minPrice || current.maxPrice || sp?.get("q")) && (
        <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
          Clear all
        </Button>
      )}
    </div>
  );
}
