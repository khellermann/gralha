import { Link } from "@tanstack/react-router";

export function Header() {
  return (
    <header className="border-b border-ink/15 bg-paper/85 backdrop-blur sticky top-0 z-40">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:py-4">
        <Link to="/" className="flex items-center gap-3 group">
          <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-paper shadow-md ring-1 ring-ink/10">
            <img src="/logo.png" alt="A Gralha" className="h-full w-full object-contain p-0.5" />
          </span>
          <div className="leading-tight">
            <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
              Jornal Cultural
            </p>
            <h1 className="text-serif text-xl sm:text-2xl font-black text-ink group-hover:text-primary transition-colors">
              A Gralha
            </h1>
          </div>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link
            to="/acervo"
            className="text-ink/70 hover:text-primary transition-colors hidden sm:inline"
            activeProps={{ className: "text-primary font-semibold" }}
          >
            Acervo
          </Link>
          <Link
            to="/admin"
            className="rounded-full border border-ink/25 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-ink hover:bg-ink hover:text-paper transition-colors"
          >
            Editor
          </Link>
        </nav>
      </div>
    </header>
  );
}
