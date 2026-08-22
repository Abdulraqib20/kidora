import Link from "next/link";
import { StoreHeader } from "@/components/store/header";

/** Storefront layout wrapping customer-facing pages with navigation header and footer. */
export default function StoreLayout({ children }: { children: React.ReactNode }) {

  return (
    <div className="flex min-h-screen flex-col">
      <StoreHeader />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 py-8">{children}</div>
      </main>
      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Kidora</p>
          <Link href="/admin" className="hover:text-foreground">
            Store management
          </Link>
        </div>
      </footer>
    </div>
  );
}
