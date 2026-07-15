import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Camera } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MuralSection } from "@/components/MuralSection";
import { absoluteUrl, createSeo, jsonLd } from "@/lib/seo";

export const Route = createFileRoute("/mural")({
  head: () => {
    const seo = createSeo({
      title: "Mural de Artistas - A Gralha",
      description:
        "Conheça o mural de artistas com fotos, depoimentos e registros de quem participa da história cultural de A Gralha.",
      path: "/mural",
    });

    return {
      ...seo,
      scripts: [
        jsonLd({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Mural de Artistas - A Gralha",
          url: absoluteUrl("/mural"),
          description:
            "Mural público com fotos e depoimentos de artistas que acompanham o Jornal Cultural A Gralha.",
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
  component: MuralPage,
});

function MuralPage() {
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
          <p className="text-xs uppercase tracking-[0.35em] text-primary">Mural</p>
          <h1 className="mt-3 text-serif text-4xl sm:text-6xl font-black text-ink">
            Artistas com A Gralha
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm sm:text-base leading-7 text-muted-foreground">
            Fotos e depoimentos de quem ajuda a cultura a circular pelas páginas do jornal.
          </p>
        </header>

        <section className="py-12">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-ink/15 bg-card/70 px-4 py-2 text-sm text-ink">
            <Camera className="h-4 w-4 text-primary" />
            Registros culturais
          </div>
          <MuralSection />
        </section>
      </main>

      <Footer />
    </div>
  );
}
