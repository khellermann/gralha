import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Flipbook } from "@/components/Flipbook";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getEdition, type Edition } from "@/lib/store";

export const Route = createFileRoute("/edicao/$id")({
  component: EditionPage,
});

function EditionPage() {
  const { id } = useParams({ from: "/edicao/$id" });
  const [edition, setEdition] = useState<Edition | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getEdition(id)
      .then((row) => {
        if (alive) setEdition(row);
      })
      .catch((error) => console.error(error))
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [id]);

  return (
    <div className="min-h-screen flex flex-col bg-paper-grain">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-10 w-full flex-1">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar ao acervo
        </Link>

        {loading ? (
          <div className="mt-16 text-center text-muted-foreground">Carregando edição...</div>
        ) : !edition ? (
          <div className="mt-16 text-center text-muted-foreground">Edição não encontrada.</div>
        ) : (
          <>
            <header className="mt-6 mb-8 text-center">
              <p className="text-xs uppercase tracking-[0.4em] text-primary">
                Edição Nº {edition.number} ·{" "}
                {new Date(edition.publishedAt).toLocaleDateString("pt-BR", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <h1 className="mt-2 text-serif text-4xl sm:text-5xl font-black text-ink">
                {edition.title}
              </h1>
              <div className="mx-auto mt-3 h-[3px] w-24 bg-ink" />
            </header>

            <Flipbook edition={edition} />
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
