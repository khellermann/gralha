import { createFileRoute } from "@tanstack/react-router";
import { Camera, FileText, Mail, Palette, Send, Sparkles } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { absoluteUrl, createSeo, jsonLd } from "@/lib/seo";

const participationItems = [
  "Uma foto sua, para apresentação do artista",
  "Seu nome completo",
  "Seu nome artístico, caso utilize",
  "Sua área de atuação",
  "O material que deseja publicar",
];

const materialBlocks = [
  {
    title: "Literatura",
    text: "Poemas, crônicas, contos, artigos, ensaios, biografias e outras formas de escrita.",
  },
  {
    title: "Artes visuais",
    text: "Fotografias de pinturas, desenhos, esculturas, gravuras, grafites, artesanato e demais produções.",
  },
  {
    title: "Música, teatro, dança e outras linguagens",
    text: "Fotos, textos, relatos, projetos ou registros de apresentações.",
  },
];

export const Route = createFileRoute("/publique")({
  head: () => {
    const seo = createSeo({
      title: "Publique sua arte - A Gralha",
      description:
        "Chamada para artistas publicarem gratuitamente no Jornal Cultural A Gralha, nas versões digital e impressa.",
      path: "/publique",
      image: "/publique.jfif",
    });

    return {
      ...seo,
      scripts: [
        jsonLd({
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Publique sua arte - A Gralha",
          url: absoluteUrl("/publique"),
          image: absoluteUrl("/publique.jfif"),
          description:
            "Página de chamada para artistas enviarem materiais ao Jornal Cultural A Gralha.",
          inLanguage: "pt-BR",
          isPartOf: {
            "@type": "WebSite",
            name: "A Gralha",
            url: absoluteUrl("/"),
          },
        }),
      ],
    };
  },
  component: PublishPage,
});

function PublishPage() {
  return (
    <div className="min-h-screen flex flex-col bg-paper-grain">
      <Header />

      <main className="flex-1">
        <section className="border-b border-ink/15 bg-hero-gradient">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-center">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-primary">
                  Chamada para artistas
                </p>
                <h1 className="mt-3 text-serif text-4xl font-black leading-tight text-ink sm:text-6xl">
                  Publique sua arte em A Gralha
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-8 text-ink/75">
                  Você gostaria de ter seu trabalho publicado no Jornal Cultural A Gralha, nas
                  versões digital e impressa? E o melhor: totalmente gratuito.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <a
                    href="mailto:jornalculturalagralha@gmail.com"
                    className="inline-flex items-center gap-2 rounded-full bg-gralha-gradient px-5 py-3 text-sm font-semibold text-primary-foreground paper-shadow transition hover:brightness-110"
                  >
                    <Mail className="h-4 w-4" /> Enviar material
                  </a>
                  <a
                    href="#como-participar"
                    className="inline-flex items-center gap-2 rounded-full border border-ink/25 px-5 py-3 text-sm font-semibold text-ink transition-colors hover:bg-ink hover:text-paper"
                  >
                    <FileText className="h-4 w-4" /> Como participar
                  </a>
                </div>
              </div>

              <figure className="overflow-hidden rounded-md border border-ink/15 bg-card paper-shadow">
                <img
                  src="/publique.jfif"
                  alt="Aviso aos artistas do Jornal Cultural A Gralha"
                  className="aspect-[16/10] w-full object-cover"
                />
              </figure>
            </div>
          </div>
        </section>

        <section id="como-participar" className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <article className="rounded-md border border-ink/15 bg-card/85 p-6 paper-shadow sm:p-8">
              <p className="text-xs uppercase tracking-[0.35em] text-primary">Espaço aberto</p>
              <h2 className="mt-3 text-serif text-3xl font-black text-ink">
                Arte em todas as formas
              </h2>
              <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
                O Jornal Cultural A Gralha é um espaço aberto à divulgação da arte em todas as suas
                formas. Valorizamos artistas iniciantes e experientes, sem restrições de idade,
                estilo ou linguagem artística.
              </p>

              <div className="mt-6 rounded-md border border-primary/20 bg-primary/10 p-5">
                <p className="text-serif text-2xl font-black text-ink">Participe!</p>
                <p className="mt-2 text-sm leading-7 text-ink/75">
                  Porque a cultura cresce quando é compartilhada.
                </p>
              </div>
            </article>

            <article className="rounded-md border border-ink/15 bg-paper/85 p-6 paper-shadow sm:p-8">
              <p className="text-xs uppercase tracking-[0.35em] text-primary">Para participar</p>
              <h2 className="mt-3 text-serif text-3xl font-black text-ink">Envie seus dados</h2>
              <div className="mt-6 grid gap-3">
                {participationItems.map((item, index) => (
                  <div key={item} className="flex gap-3 rounded-md bg-card/70 p-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                      {index + 1}
                    </span>
                    <p className="self-center text-sm leading-6 text-ink/80">{item}</p>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {materialBlocks.map((block, index) => {
              const Icon = index === 0 ? FileText : index === 1 ? Palette : Camera;
              return (
                <article
                  key={block.title}
                  className="rounded-md border border-ink/15 bg-card/80 p-5 paper-shadow"
                >
                  <Icon className="h-8 w-8 text-primary" />
                  <h3 className="mt-4 text-serif text-xl font-black text-ink">{block.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{block.text}</p>
                </article>
              );
            })}
          </div>

          <section className="mt-10 overflow-hidden rounded-md border border-ink/15 bg-ink text-paper paper-shadow">
            <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-primary-foreground/70">
                  Jornal Cultural A Gralha
                </p>
                <h2 className="mt-3 text-serif text-3xl font-black">
                  Levando sementes de arte e cultura por onde passa.
                </h2>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-paper/75 sm:text-base">
                  Nosso compromisso é dar voz aos artistas e levar a arte para cada vez mais
                  pessoas, de forma acessível, democrática e livre.
                </p>
              </div>
              <a
                href="mailto:jornalculturalagralha@gmail.com"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-paper px-5 py-3 text-sm font-semibold text-ink transition hover:bg-primary hover:text-primary-foreground"
              >
                <Send className="h-4 w-4" /> jornalculturalagralha@gmail.com
              </a>
            </div>
          </section>

          <div className="mx-auto mt-10 flex max-w-2xl items-center justify-center gap-3 text-center text-sm leading-7 text-muted-foreground">
            <Sparkles className="h-5 w-5 shrink-0 text-primary" />
            <p>
              A cultura deve ser acessível, democrática e livre. Compartilhe sua arte com A Gralha.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
