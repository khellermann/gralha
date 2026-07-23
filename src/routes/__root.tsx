import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useRouter,
} from "@tanstack/react-router";
import { RotateCcw, Volume2, VolumeX } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { jsonLd, organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import appCss from "../styles.css?url";

function NotFoundComponent() {
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [replayKey, setReplayKey] = useState(0);

  async function toggleSound() {
    const nextSoundEnabled = !soundEnabled;
    setSoundEnabled(nextSoundEnabled);

    if (nextSoundEnabled) {
      await unlockTypewriterAudio();
      setReplayKey((current) => current + 1);
    } else {
      stopTypewriterKeys();
      void typewriterAudioContext?.suspend().catch(() => undefined);
    }
  }

  return (
    <div className="min-h-screen bg-paper-grain px-4 py-10 text-ink">
      <main className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
        <section className="w-full overflow-hidden rounded-md border border-ink/15 bg-card/85 paper-shadow">
          <div className="flex items-center justify-between gap-4 border-b border-ink/15 bg-paper/75 px-5 py-4 sm:px-8">
            <div className="flex-1 text-center">
              <p className="text-[10px] uppercase tracking-[0.45em] text-muted-foreground">
                Jornal Cultural
              </p>
              <h1 className="mt-2 text-serif text-3xl font-black text-ink sm:text-5xl">A Gralha</h1>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setReplayKey((current) => current + 1);
                }}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-ink/20 bg-card text-ink transition-colors hover:bg-ink hover:text-paper focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label="Repetir efeito de máquina de escrever"
                title="Repetir efeito de máquina de escrever"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => void toggleSound()}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-ink/20 bg-card text-ink transition-colors hover:bg-ink hover:text-paper focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label={
                  soundEnabled
                    ? "Desativar som da máquina de escrever"
                    : "Ativar som da máquina de escrever"
                }
                title={
                  soundEnabled
                    ? "Desativar som da máquina de escrever"
                    : "Ativar som da máquina de escrever"
                }
              >
                {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="grid gap-8 px-6 py-10 sm:px-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div className="mx-auto w-full max-w-xs rotate-[-1deg] rounded-md border border-ink/20 bg-paper p-5 paper-shadow">
              <div className="rule-double py-3 text-center">
                <p className="text-xs uppercase tracking-[0.35em] text-primary">
                  <TypewriterText
                    text="Página perdida"
                    speed={110}
                    soundEnabled={soundEnabled}
                    replayKey={replayKey}
                  />
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
                <TypewriterText
                  text="Fora do acervo"
                  delay={1100}
                  speed={105}
                  soundEnabled={soundEnabled}
                  replayKey={replayKey}
                />
              </p>
              <h2 className="mt-3 text-serif text-3xl font-black leading-tight text-ink sm:text-5xl">
                <TypewriterText
                  text="Esta página escapou da edição."
                  delay={2100}
                  speed={85}
                  cursor
                  soundEnabled={soundEnabled}
                  replayKey={replayKey}
                />
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base lg:mx-0">
                <TypewriterText
                  text="O endereço pode ter mudado, sido arquivado ou simplesmente não existir. Você pode voltar para a capa do jornal ou seguir direto para o acervo completo."
                  delay={5200}
                  speed={38}
                  soundEnabled={soundEnabled}
                  replayKey={replayKey}
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
  soundEnabled = false,
  replayKey = 0,
}: {
  text: string;
  delay?: number;
  speed?: number;
  cursor?: boolean;
  soundEnabled?: boolean;
  replayKey?: number;
}) {
  const [displayed, setDisplayed] = useState("");
  const isTyping = displayed.length < text.length;

  useEffect(() => {
    setDisplayed("");
    let typingTimer: number | undefined;
    const startTimer = window.setTimeout(() => {
      let index = 0;

      const typeNextCharacter = () => {
        index += 1;
        setDisplayed(text.slice(0, index));

        if (soundEnabled && text[index - 1]?.trim()) {
          playTypewriterKey();
        }

        if (index < text.length) {
          typingTimer = window.setTimeout(typeNextCharacter, speed);
        }
      };

      typingTimer = window.setTimeout(typeNextCharacter, 180);
    }, delay);

    return () => {
      window.clearTimeout(startTimer);
      if (typingTimer) window.clearTimeout(typingTimer);
    };
  }, [delay, replayKey, soundEnabled, speed, text]);

  return (
    <span aria-label={text} className="inline-block min-h-[1em]">
      <span aria-hidden="true">{displayed}</span>
      {(cursor || isTyping) && (
        <span aria-hidden="true" className="ml-1 inline-block animate-pulse text-primary">
          |
        </span>
      )}
    </span>
  );
}

type WindowWithWebkitAudio = Window & {
  webkitAudioContext?: typeof AudioContext;
};

let typewriterAudioContext: AudioContext | null = null;
let typewriterKeyBuffer: AudioBuffer | null = null;
let typewriterKeyBufferPromise: Promise<void> | null = null;
const activeTypewriterSources = new Set<AudioBufferSourceNode>();

async function unlockTypewriterAudio() {
  if (typeof window === "undefined") return;

  const AudioContextConstructor =
    window.AudioContext ?? (window as WindowWithWebkitAudio).webkitAudioContext;
  if (!AudioContextConstructor) return;

  typewriterAudioContext ??= new AudioContextConstructor();

  if (typewriterAudioContext.state === "suspended") {
    await typewriterAudioContext.resume().catch(() => undefined);
  }

  typewriterKeyBufferPromise ??= fetch("/typewriter.mp3")
    .then((response) => response.arrayBuffer())
    .then((buffer) => typewriterAudioContext?.decodeAudioData(buffer))
    .then((buffer) => {
      typewriterKeyBuffer = buffer ?? null;
    })
    .catch(() => {
      typewriterKeyBuffer = null;
    });

  await typewriterKeyBufferPromise;
}

function playTypewriterKey() {
  const context = typewriterAudioContext;
  if (!context || context.state !== "running") return;

  if (typewriterKeyBuffer) {
    const source = context.createBufferSource();
    const gain = context.createGain();
    const now = context.currentTime;
    const duration = Math.min(0.065, typewriterKeyBuffer.duration);
    const maxOffset = Math.max(0, typewriterKeyBuffer.duration - duration);
    const offset = maxOffset > 0 ? Math.random() * maxOffset : 0;

    source.buffer = typewriterKeyBuffer;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.22, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    source.connect(gain);
    gain.connect(context.destination);
    source.start(now, offset, duration);
    source.stop(now + duration + 0.01);

    activeTypewriterSources.add(source);
    source.onended = () => activeTypewriterSources.delete(source);
    return;
  }

  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const now = context.currentTime;
  const duration = 0.045;

  oscillator.type = "square";
  oscillator.frequency.setValueAtTime(650 + Math.random() * 260, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.04, now + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + duration + 0.01);
}

function stopTypewriterKeys() {
  activeTypewriterSources.forEach((source) => {
    try {
      source.stop();
    } catch {
      // Source may have already ended.
    }
  });
  activeTypewriterSources.clear();

  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(0);
  }
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
