import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useRouter,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import { jsonLd, organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="min-h-screen bg-paper-grain px-4 py-10 text-ink">
      <main className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
        <section className="w-full overflow-hidden rounded-md border border-ink/15 bg-card/85 paper-shadow">
          <div className="border-b border-ink/15 bg-paper/75 px-5 py-4 text-center sm:px-8">
            <p className="text-[10px] uppercase tracking-[0.45em] text-muted-foreground">
              Jornal Cultural
            </p>
            <h1 className="mt-2 text-serif text-3xl font-black text-ink sm:text-5xl">A Gralha</h1>
          </div>

          <div className="grid gap-8 px-6 py-10 sm:px-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div className="mx-auto w-full max-w-xs rotate-[-1deg] rounded-md border border-ink/20 bg-paper p-5 paper-shadow">
              <div className="rule-double py-3 text-center">
                <p className="text-xs uppercase tracking-[0.35em] text-primary">
                  <TypewriterText text="Página perdida" speed={45} />
                </p>
                <strong className="mt-3 block text-serif text-7xl font-black leading-none text-ink sm:text-8xl">
                  404
                </strong>
              </div>
              <div className="mt-5 space-y-2">
                <span className="block h-1.5 w-full rounded-full bg-ink/15" />
                <span className="block h-1.5 w-10/12 rounded-full bg-ink/15" />
                <span className="block h-1.5 w-8/12 rounded-full bg-primary/25" />
              </div>
            </div>

            <div className="text-center lg:text-left">
              <p className="text-xs uppercase tracking-[0.35em] text-primary">
                <TypewriterText text="Fora do acervo" delay={550} speed={48} />
              </p>
              <h2 className="mt-3 text-serif text-3xl font-black leading-tight text-ink sm:text-5xl">
                <TypewriterText
                  text="Esta página escapou da edição."
                  delay={950}
                  speed={42}
                  cursor
                />
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base lg:mx-0">
                <TypewriterText
                  text="O endereço pode ter mudado, sido arquivado ou simplesmente não existir. Você pode voltar para a capa do jornal ou seguir direto para o acervo completo."
                  delay={2250}
                  speed={18}
                />
              </p>

              <div className="mt-7 flex flex-wrap justify-center gap-3 lg:justify-start">
                <Link
                  to="/"
                  className="inline-flex items-center justify-center rounded-full bg-gralha-gradient px-5 py-3 text-sm font-semibold text-primary-foreground paper-shadow hover:brightness-110 transition"
                >
                  Voltar para a home
                </Link>
                <Link
                  to="/acervo"
                  className="inline-flex items-center justify-center rounded-full border border-ink/25 px-5 py-3 text-sm font-semibold text-ink transition-colors hover:bg-ink hover:text-paper"
                >
                  Ver acervo completo
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function TypewriterText({
  text,
  delay = 0,
  speed = 35,
  cursor = false,
}: {
  text: string;
  delay?: number;
  speed?: number;
  cursor?: boolean;
}) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [displayed, setDisplayed] = useState(prefersReducedMotion ? text : "");

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayed(text);
      return;
    }

    setDisplayed("");
    let typingTimer: ReturnType<typeof window.setTimeout> | undefined;
    const startTimer = window.setTimeout(() => {
      let index = 0;

      const typeNextCharacter = () => {
        index += 1;
        setDisplayed(text.slice(0, index));

        if (index < text.length) {
          typingTimer = window.setTimeout(typeNextCharacter, speed);
        }
      };

      typeNextCharacter();
    }, delay);

    return () => {
      window.clearTimeout(startTimer);
      if (typingTimer) window.clearTimeout(typingTimer);
    };
  }, [delay, prefersReducedMotion, speed, text]);

  return (
    <span aria-label={text}>
      <span aria-hidden="true">{displayed}</span>
      {cursor && !prefersReducedMotion && (
        <span aria-hidden="true" className="ml-1 inline-block animate-pulse text-primary">
          |
        </span>
      )}
    </span>
  );
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);

    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  return prefersReducedMotion;
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Esta página não carregou
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Algo deu errado. Tente novamente ou volte para a home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Tentar novamente
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Voltar para a home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "apple-touch-icon", href: "/social-preview.png" },
    ],
    scripts: [jsonLd(websiteJsonLd()), jsonLd(organizationJsonLd())],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}
