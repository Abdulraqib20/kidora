"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ShoppingBag, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/lib/cart";

export function StoreHeader() {
  const { count } = useCart();
  const router = useRouter();
  const [q, setQ] = useState("");

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3">
        <Link href="/" className="text-lg font-bold tracking-tight">
          Boda Hameed<span className="text-primary">.</span>
        </Link>

        <form
          className="ml-2 hidden flex-1 sm:block"
          onSubmit={(e) => {
            e.preventDefault();
            router.push(q ? `/?q=${encodeURIComponent(q)}` : "/");
          }}
        >
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products, brands…"
            className="max-w-md"
          />
        </form>

        <nav className="ml-auto flex items-center gap-1">
          <Link href="/account">
            <Button variant="ghost" size="icon" aria-label="Account">
              <User />
            </Button>
          </Link>
          <Link href="/cart">
            <Button variant="ghost" size="icon" aria-label="Cart" className="relative">
              <ShoppingBag />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold text-primary-foreground">
                  {count}
                </span>
              )}
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
