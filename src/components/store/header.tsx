"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { SearchCommand } from "@/components/store/search-command";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserNav } from "@/components/store/user-nav";
import { AdminTopBanner } from "@/components/store/admin-top-banner";

/** Storefront sticky header with brand identity, search bar, role-based user menu, and live cart counter. */
export function StoreHeader() {
  const { count } = useCart();

  return (
    <>
      <AdminTopBanner />
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
          <Link href="/" className="text-lg font-bold tracking-tight">
            Kidora<span className="text-primary">.</span>
          </Link>

          <div className="order-last w-full sm:order-none sm:mr-2 sm:w-auto sm:flex-1">
            <SearchCommand />
          </div>

          <nav className="ml-auto flex items-center gap-1.5">
            <ThemeToggle />
            <UserNav />
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
    </>
  );
}
