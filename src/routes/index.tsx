import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Feather } from "lucide-react";
import { EditionCard } from "@/components/EditionCard";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SponsorCarousel } from "@/components/SponsorCarousel";
import { renderPdfPageToImage } from "@/lib/pdf";
import { getEditionPdfUrl, getEditions, type Edition } from "@/lib/store";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [editions, setEditions] = useState<Edition[]>([]);
  const [featuredCover, setFeaturedCover] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    getEditions()
      .then((rows) => {
        if (alive) setEditions(rows);
      })
      .catch((error) => console.error(error))
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const featured = editions[0];
  const rest = editions.slice(1);

  useEffect(() => {
    let alive = true;
    setFeaturedCover(undefined);

    if (!featured) return;

    renderPdfPageToImage(getEditionPdfUrl(featured.pdfPath), featured.coverPageIndex + 1)
      .then((url) => {
        if (alive) setFeaturedCover(url);
      })
      .catch((error) => console.error(error));

    return () => {
      alive = false;
    };
  }, [featured]);

  return (
    <div className="min-h-screen flex flex-col bg-paper-grain">
      <Header />

      <section className="bg-hero-gradient border-b border-ink/15">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
          <div className="text-center">
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.5em] text-muted-foreground">
              Fundado em Londrina · Paraná
            </p>
            <h2 className="mt-3 text-serif text-5xl sm:text-7xl font-black text-ink">A Gralha</h2>
            <div className="mx-auto mt-3 max-w-md rule-double py-1">
              <p className="text-serif italic text-sm sm:text-base text-ink/80">
                Jornal Cultural - Literatura, Arte e Memória
              </p>
            </div>
          </div>

          {featured ? (
            <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7 }}
                className="mx-auto max-w-sm w-full"
              >
                <div className="relative aspect-[3/4] overflow-hidden rounded-md border border-ink/20 bg-card paper-shadow rotate-[-1.5deg] hover:rotate-0 transition-transform duration-500">
                  {featuredCover ? (
                    <img
                      src={featuredCover}
                      alt={`Capa - ${featured.title}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full place-items-center bg-gralha-gradient text-paper text-serif text-4xl">
                      A Gralha
                    </div>
                  )}
                  <div className="absolute top-4 left-4 rounded-full bg-ink/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-paper">
                    Edição atual · Nº {featured.number}
                  </div>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
              >
                <p className="text-xs uppercase tracking-[0.35em] text-primary">Em destaque</p>
                <h3 className="mt-3 text-serif text-3xl sm:text-5xl font-black text-ink leading-[1.05]">
                  {featured.title}
                </h3>
                <p className="mt-4 text-muted-foreground text-sm sm:text-base max-w-xl">
                  Publicada em{" "}
                  {new Date(featured.publishedAt).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                  . Vire as páginas como se estivesse folheando o jornal impresso.
                </p>
                <Link
                  to="/edicao/$id"
                  params={{ id: featured.id }}
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-gralha-gradient px-6 py-3 text-sm font-semibold text-primary-foreground paper-shadow hover:brightness-110 transition"
                >
                  <BookOpen className="h-4 w-4" /> Ler Edição Atual
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
            </div>
          ) : (
            <EmptyState loading={loading} />
          )}
        </div>
      </section>

      {rest.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16 w-full">
          <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-primary">Acervo</p>
              <h3 className="text-serif text-3xl sm:text-4xl font-black text-ink">
                Edições anteriores
              </h3>
            </div>
            <p className="text-sm text-muted-foreground max-w-sm">
              Um arquivo vivo de vozes, colunas e visualidades.
            </p>
          </div>
          <div className="grid gap-8 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {rest.map((e, i) => (
              <EditionCard key={e.id} edition={e} index={i} />
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 py-12 w-full">
        <div className="text-center mb-6">
          <p className="text-xs uppercase tracking-[0.35em] text-primary">Apoio Cultural</p>
          <h3 className="text-serif text-3xl sm:text-4xl font-black text-ink">
            Quem apoia A Gralha
          </h3>
        </div>
        <SponsorCarousel />
      </section>

      <Footer />
    </div>
  );
}

function EmptyState({ loading }: { loading: boolean }) {
  return (
    <div className="mt-10 mx-auto max-w-2xl rounded-xl border border-dashed border-ink/25 bg-card/70 p-10 text-center">
      <Feather className="mx-auto h-10 w-10 text-primary" />
      <h3 className="mt-4 text-serif text-2xl font-bold text-ink">
        {loading ? "Carregando edições..." : "Nenhuma edição publicada ainda"}
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">
        {loading
          ? "Estamos buscando o acervo publicado."
          : "A primeira edição será exibida aqui. Editores podem publicar pelo painel administrativo."}
      </p>
      {!loading && (
        <Link
          to="/admin"
          className="mt-4 inline-flex items-center gap-2 rounded-full border border-ink/25 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-ink hover:bg-ink hover:text-paper transition-colors"
        >
          Acessar painel
        </Link>
      )}
    </div>
  );
}
