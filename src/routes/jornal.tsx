import { createFileRoute, Link } from "@tanstack/react-router";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { absoluteUrl, createSeo, jsonLd } from "@/lib/seo";

const milestones = [
  {
    mark: "01",
    label: "10+ edições",
    text: "Uma trajetória dedicada exclusivamente à cultura.",
  },
  {
    mark: "02",
    label: "10 mil+ exemplares",
    text: "Distribuição gratuita aproximando artistas e leitores.",
  },
  {
    mark: "03",
    label: "Brasil, Portugal e EUA",
    text: "A cultura atravessando cidades, estados e fronteiras.",
  },
];

export const Route = createFileRoute("/jornal")({
  head: () => {
    const title = "Jornal Cultural Agralha - A arte que venceu o isolamento";
    const description =
      "Conheça a história do Jornal Cultural Agralha, nascido durante a pandemia para manter a arte viva, gratuita e acessível.";
    const seo = createSeo({
      title,
      description,
      path: "/jornal",
      image: "/jornal-a-gralha.jfif",
      imageAlt: "Imagem do Jornal Cultural A Gralha",
      imageType: null,
    });

    return {
      ...seo,
      scripts: [
        jsonLd({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: title,
          description,
          image: absoluteUrl("/jornal-a-gralha.jfif"),
          url: absoluteUrl("/jornal"),
          inLanguage: "pt-BR",
          publisher: {
            "@type": "Organization",
            name: "A Gralha",
            url: absoluteUrl("/"),
          },
        }),
      ],
    };
  },
  component: JornalPage,
});

function JornalPage() {
  return (
    <div className="min-h-screen flex flex-col bg-paper-grain">
      <Header />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:py-14">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          <span aria-hidden="true">←</span> Voltar para a home
        </Link>

        <article className="mt-8 border-y-4 border-double border-ink/70 py-6 sm:py-8">
          <header className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.38em] text-primary">
              História do jornal
            </p>
            <h1 className="mx-auto mt-4 max-w-5xl text-serif text-4xl font-black leading-none text-ink sm:text-6xl lg:text-7xl">
              Jornal Cultural Agralha: a arte que venceu o isolamento
            </h1>
            <div className="mx-auto mt-5 h-px max-w-3xl bg-ink/30" />
            <p className="mx-auto mt-5 max-w-3xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Um projeto nascido durante a pandemia para fazer a cultura seguir em frente, mesmo
              quando os encontros presenciais pareciam impossíveis.
            </p>
          </header>

          <figure className="mt-8 overflow-hidden border border-ink/15 bg-card paper-shadow">
            <img
              src="/jornal-a-gralha.jfif"
              alt="Jornal Cultural A Gralha"
              className="max-h-[520px] w-full object-cover"
            />
            <figcaption className="border-t border-ink/10 px-4 py-3 text-center text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Cultura impressa, gratuita e em movimento
            </figcaption>
          </figure>

          <section className="mt-8 grid gap-4 md:grid-cols-3">
            {milestones.map(({ mark, label, text }) => (
              <div key={label} className="border-y border-ink/15 py-4">
                <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-full border border-primary/40 text-xs font-black text-primary md:mx-0">
                  {mark}
                </span>
                <h2 className="mt-3 text-center text-serif text-2xl font-black text-ink md:text-left">
                  {label}
                </h2>
                <p className="mt-2 text-center text-sm leading-relaxed text-muted-foreground md:text-left">
                  {text}
                </p>
              </div>
            ))}
          </section>

          <section className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
            <div className="max-w-none text-[16px] leading-7 text-ink sm:text-justify lg:columns-2 lg:gap-10 [&_p]:mb-4">
              <p className="first-letter:float-left first-letter:mr-3 first-letter:text-7xl first-letter:font-black first-letter:leading-[0.85] first-letter:text-primary">
                O Jornal Cultural Agralha nasceu em um dos períodos mais difíceis da história
                recente da humanidade: a pandemia da Covid-19. Diante do isolamento social, do
                fechamento dos espaços culturais e da impossibilidade de realizar eventos
                presenciais, surgiu uma pergunta que parecia inevitável:{" "}
                <em>
                  como continuar fazendo arte quando os artistas não podiam sequer sair de casa?
                </em>
              </p>
              <p>
                Além da tragédia causada pela doença e pelas milhares de vidas perdidas, o
                confinamento deixou marcas profundas na sociedade. Crianças, adolescentes e adultos
                enfrentaram consequências emocionais e psicológicas que ainda hoje são sentidas. Ao
                mesmo tempo, a internet passou a ser ocupada por lives, apresentações musicais,
                espetáculos e inúmeras manifestações artísticas que buscavam manter viva a
                esperança.
              </p>
              <p>Foi nesse contexto que nasceu o Jornal Cultural Agralha.</p>
              <p>
                A proposta era simples e, ao mesmo tempo, ousada: permitir que a arte continuasse
                caminhando livremente pelas ruas, mesmo quando os artistas precisavam permanecer em
                casa. O jornal tornou-se uma ponte entre criadores e público, fazendo com que a
                produção cultural continuasse chegando às pessoas de forma gratuita, democrática e
                acessível.
              </p>
              <p>
                Desde sua primeira edição, o Jornal Cultural Agralha abriu espaço para todas as
                manifestações artísticas. Literatura, música, teatro, dança, circo, fotografia,
                ilustração, cinema, artes visuais, entrevistas, documentários e tantas outras
                expressões passaram a dividir as páginas de uma publicação dedicada exclusivamente à
                cultura.
              </p>
              <p>
                Hoje, o Agralha é o único jornal cultural da região Norte Pioneira do Paraná voltado
                integralmente à divulgação da arte e dos artistas. Seu compromisso sempre foi o
                mesmo: oferecer um espaço livre, sem custos para quem publica e sem qualquer tipo de
                restrição de idade, experiência ou linguagem artística. Qualquer artista pode
                participar. A única exigência é acreditar na força da cultura.
              </p>
              <p>
                Mais do que um jornal, o Agralha tornou-se um movimento de valorização artística.
                Cada edição leva aos leitores uma diversidade de expressões culturais, aproximando
                pessoas da arte de maneira simples e gratuita.
              </p>
              <p>
                Ao longo de sua trajetória, o projeto já ultrapassou dez edições, distribuiu mais de
                dez mil exemplares e rompeu fronteiras. Além de circular por diversas cidades
                brasileiras, o jornal chegou também a países como Portugal e Estados Unidos,
                reunindo artistas de diferentes estados do Brasil e demonstrando que a cultura não
                conhece limites geográficos.
              </p>
              <p>
                O Jornal Cultural Agralha nasceu em um momento de crise, mas escolheu responder com
                criatividade, sensibilidade e resistência. Sua história mostra que, mesmo diante do
                isolamento, a arte nunca deixou de encontrar caminhos para alcançar as pessoas.
                Afinal, quando tudo parecia parar, a cultura continuou seguindo em frente.
              </p>
            </div>

            <aside className="border-l-4 border-primary bg-card/70 px-5 py-5 paper-shadow">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-primary">
                Linha editorial
              </p>
              <p className="mt-4 text-serif text-2xl font-black leading-tight text-ink">
                Quando tudo parecia parar, a cultura continuou seguindo em frente.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                O Agralha nasceu para preservar encontros, vozes e criações em um tempo de
                distância. Cada página carrega essa escolha: fazer a arte circular.
              </p>
            </aside>
          </section>
        </article>
      </main>

      <Footer />
    </div>
  );
}
