import { Link } from "@tanstack/react-router";
import { Menu, Newspaper } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navItems = [
  { to: "/jornal", label: "Jornal" },
  { to: "/editor", label: "Editor" },
  { to: "/mural", label: "Mural" },
  { to: "/publique", label: "Publique" },
  { to: "/acervo", label: "Acervo" },
] as const;

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-y border-ink/15 bg-paper/95 shadow-[0_8px_24px_rgba(38,31,25,0.06)] backdrop-blur">
      <div className="border-b border-ink/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:py-4">
          <Link to="/" className="group flex min-w-0 items-center gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-paper shadow-md ring-1 ring-ink/15 sm:h-14 sm:w-14">
              <img src="/logo.png" alt="A Gralha" className="h-full w-full object-contain p-0.5" />
            </span>
            <div className="min-w-0 leading-tight">
              <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">
                <Newspaper className="h-3.5 w-3.5" />
                Jornal Cultural
              </p>
              <h1 className="text-serif text-2xl font-black text-ink transition-colors group-hover:text-primary sm:text-4xl">
                A Gralha
              </h1>
            </div>
          </Link>

          <div className="hidden text-right text-[10px] uppercase tracking-[0.24em] text-muted-foreground sm:block">
            <p>Literatura</p>
            <p>Arte e Memoria</p>
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-2 border-ink/20 bg-paper/80 px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-ink sm:hidden"
                aria-label="Abrir menu principal"
              >
                <Menu className="h-4 w-4" />
                Menu
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="border-l-ink/15 bg-paper">
              <SheetHeader className="border-b border-ink/10 pb-5 text-left">
                <SheetTitle className="text-serif text-3xl font-black text-ink">
                  A Gralha
                </SheetTitle>
                <SheetDescription className="text-xs uppercase tracking-[0.22em] text-primary">
                  Editorias do jornal
                </SheetDescription>
              </SheetHeader>
              <nav className="mt-6 grid gap-2" aria-label="Menu principal mobile">
                {navItems.map((item) => (
                  <SheetClose asChild key={item.to}>
                    <Link
                      to={item.to}
                      className="border-b border-ink/10 px-1 py-4 text-sm font-bold uppercase tracking-[0.2em] text-ink/75 transition-colors hover:text-primary"
                      activeProps={{
                        className: "border-primary text-primary",
                      }}
                    >
                      {item.label}
                    </Link>
                  </SheetClose>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <nav className="hidden border-b border-ink/10 sm:block" aria-label="Menu principal">
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-1 px-4">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="relative px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.22em] text-ink/70 transition-colors after:absolute after:inset-x-5 after:bottom-0 after:h-0.5 after:origin-center after:scale-x-0 after:bg-primary after:transition-transform hover:text-primary hover:after:scale-x-100"
              activeProps={{
                className: "text-primary after:scale-x-100",
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
