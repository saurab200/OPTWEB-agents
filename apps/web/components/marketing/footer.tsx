import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 text-xs text-structure-faint md:flex-row lg:px-8">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-accent text-[10px] font-bold text-canvas">
            O
          </span>
          <span>© {new Date().getFullYear()} OPTWEB. Structured web intelligence.</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/portal" className="hover:text-structure-muted">Client Portal</Link>
          <Link href="/admin" className="hover:text-structure-muted">Internal Ops</Link>
          <a href="#pricing" className="hover:text-structure-muted">Pricing</a>
        </div>
      </div>
    </footer>
  );
}
