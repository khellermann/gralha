import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Archive, Feather } from "lucide-react";
import { CulturalLoader } from "@/components/CulturalLoader";
import { EditionCard } from "@/components/EditionCard";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getEditions, type Edition } from "@/lib/store";

export const Route = createFileRoute("/acervo")({
  component: ArchivePage,
});

function ArchivePage() {
  const [editions, setEditions] = useState<Edition[]>([]);
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

  return (
    <div className="min-h-screen flex flex-col bg-paper-grain">
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:py-14 w-full flex-1">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar para a home
        </Link>

        <header className="mt-8 border-b border-ink/15 pb-8 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-primary">Acervo</p>
          <h1 className="mt-3 text-serif text-4xl sm:text-6xl font-black text-ink">
            Todas as edições
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm sm:text-base text-muted-foreground">
            O arquivo completo de A Gralha, com as edições mais recentes primeiro.
          </p>
        </header>

        {loading ? (
          <CulturalLoader
            title="Carregando acervo"
            phrases={[
              "Abrindo o acervo cultural...",
              "Organizando as edições...",
              "Preparando as capas...",
              "Folheando histórias...",
            ]}
            className="py-16"
          />
        ) : editions.length === 0 ? (
          <div className="mx-auto mt-12 max-w-2xl rounded-xl border border-dashed border-ink/25 bg-card/70 p-10 text-center">
            <Feather className="mx-auto h-10 w-10 text-primary" />
            <h2 className="mt-4 text-serif text-2xl font-bold text-ink">
              Nenhuma edição publicada ainda
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Quando as edições forem publicadas, o acervo completo aparecerá aqui.
            </p>
          </div>
        ) : (
          <section className="py-12">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-card/70 px-4 py-2 text-sm text-ink">
                <Archive className="h-4 w-4 text-primary" />
                {editions.length} {editions.length === 1 ? "edição publicada" : "edições publicadas"}
              </div>
            </div>

            <div className="grid gap-8 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {editions.map((edition, index) => (
                <EditionCard key={edition.id} edition={edition} index={index} />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
