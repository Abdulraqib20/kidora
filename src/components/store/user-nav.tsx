"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Package,
  ShieldCheck,
  ShoppingBag,
  User as UserIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";

/** Header user menu rendering role-based actions for administrators and customers. */
export function UserNav() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  if (isPending) {
    return (
      <div className="flex size-9 items-center justify-center rounded-full bg-muted/60 opacity-60">
        <UserIcon className="size-4" />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <Link
        href="/account"
        className="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium transition-colors hover:bg-muted"
      >
        <UserIcon className="size-4" />
        <span>Sign in</span>
      </Link>
    );
  }

  const isAdmin = session.user.role === "admin";
  const initials = session.user.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative flex h-9 cursor-pointer items-center gap-1.5 rounded-full px-2 outline-none hover:bg-muted/80">
        <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
          {initials}
        </div>
        {isAdmin && (
          <span className="hidden rounded-full bg-purple-500/15 px-2 py-0.5 text-[10px] font-semibold text-purple-700 dark:text-purple-300 sm:inline-block">
            Admin
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8} className="w-56 p-1.5">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold leading-none">{session.user.name}</p>
              {isAdmin && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-purple-500/15 px-1.5 py-0.2 text-[10px] font-semibold text-purple-700 dark:text-purple-300">
                  <ShieldCheck className="size-3" />
                  Admin
                </span>
              )}
            </div>
            <p className="truncate text-xs leading-none text-muted-foreground">
              {session.user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {isAdmin ? (
          <>
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                Store Management
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => router.push("/admin")}
                className="flex cursor-pointer items-center gap-2 font-medium"
              >
                <LayoutDashboard className="size-4 text-purple-600 dark:text-purple-400" />
                <span>Admin Dashboard</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push("/admin/inventory")}
                className="flex cursor-pointer items-center gap-2"
              >
                <ClipboardList className="size-4 text-muted-foreground" />
                <span>Inventory & Stock</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push("/admin/orders")}
                className="flex cursor-pointer items-center gap-2"
              >
                <ShoppingBag className="size-4 text-muted-foreground" />
                <span>Manage All Orders</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push("/admin/products")}
                className="flex cursor-pointer items-center gap-2"
              >
                <Package className="size-4 text-muted-foreground" />
                <span>Manage Products</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => router.push("/account")}
                className="flex cursor-pointer items-center gap-2 text-xs"
              >
                <UserIcon className="size-4 text-muted-foreground" />
                <span>My Account</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        ) : (
          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={() => router.push("/account")}
              className="flex cursor-pointer items-center gap-2 font-medium"
            >
              <ShoppingBag className="size-4 text-primary" />
              <span>My Order History</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          variant="destructive"
          className="flex cursor-pointer items-center gap-2"
        >
          <LogOut className="size-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
