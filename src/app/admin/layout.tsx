import Link from "next/link";
import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  ShoppingBag,
  Ruler,
} from "lucide-react";
import { getSession } from "@/lib/session";
import { SignOutButton } from "@/components/store/signout-button";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/inventory", label: "Inventory", icon: ClipboardList },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/size-options", label: "Size / Age Groups", icon: Ruler },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session?.user) redirect("/account");
  if (session.user.role !== "admin") redirect("/");

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-card md:flex">
        <div className="border-b p-4">
          <p className="font-bold">
            Kidora<span className="text-primary">.</span>
          </p>
          <p className="text-xs text-muted-foreground">Store management</p>
        </div>
        <nav className="flex-1 space-y-1 p-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted"
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="space-y-1 border-t p-3 text-sm">
          <p className="truncate text-xs text-muted-foreground">{session.user.email}</p>
          <Link href="/" className="block px-1 py-1 hover:underline">
            ← Back to store
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-2 border-b px-4 py-3 md:hidden">
          <p className="font-bold">Admin</p>
          <nav className="ml-auto flex gap-1 text-xs">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-lg border px-2 py-1">
                {item.label.split(" ")[0]}
              </Link>
            ))}
          </nav>
        </header>
        <main className="flex-1 p-4 md:p-6">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
        <div className="border-t px-4 py-3 md:hidden">
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}
