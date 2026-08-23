"use client";

import Link from "next/link";
import { ArrowRight, ClipboardList, LayoutDashboard, ShieldCheck, ShoppingBag } from "lucide-react";
import { authClient } from "@/lib/auth-client";

/** Top ribbon displayed to administrators navigating the storefront for instant control center access. */
export function AdminTopBanner() {
  const { data: session } = authClient.useSession();

  if (!session?.user || session.user.role !== "admin") return null;

  return (
    <div className="relative z-50 border-b bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 px-4 py-1.5 text-xs text-purple-100 shadow-xs">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-medium">
          <ShieldCheck className="size-3.5 text-purple-300" />
          <span className="font-semibold text-white">Admin Mode</span>
          <span className="hidden opacity-75 sm:inline">— You are browsing the storefront as Store Admin</span>
        </div>
        <div className="flex items-center gap-3 font-medium">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1 text-purple-200 transition-colors hover:text-white"
          >
            <LayoutDashboard className="size-3" />
            <span>Dashboard</span>
            <ArrowRight className="size-3" />
          </Link>
          <span className="opacity-30">|</span>
          <Link
            href="/admin/inventory"
            className="hidden items-center gap-1 text-purple-200 transition-colors hover:text-white sm:inline-flex"
          >
            <ClipboardList className="size-3" />
            <span>Inventory</span>
          </Link>
          <span className="hidden opacity-30 sm:inline">|</span>
          <Link
            href="/admin/orders"
            className="hidden items-center gap-1 text-purple-200 transition-colors hover:text-white sm:inline-flex"
          >
            <ShoppingBag className="size-3" />
            <span>Orders</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
