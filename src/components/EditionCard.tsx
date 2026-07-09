import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { renderPdfPageToImage } from "@/lib/pdf";
import { getEditionPdfUrl, type Edition } from "@/lib/store";

interface Props {
  edition: Edition;
  featured?: boolean;
  index?: number;
}

export function EditionCard({ edition, featured, index = 0 }: Props) {
  const [cover, setCover] = useState<string | undefined>();

  useEffect(() => {
    let alive = true;
    setCover(undefined);

    renderPdfPageToImage(getEditionPdfUrl(edition.pdfPath), edition.coverPageIndex + 1)
      .then((url) => {
        if (alive) setCover(url);
      })
      .catch((error) => console.error(error));

    return () => {
      alive = false;
    };
  }, [edition.id, edition.coverPageIndex, edition.pdfPath]);

  const dateLabel = new Date(edition.publishedAt).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: index * 0.06 }}
    >
      <Link to="/edicao/$id" params={{ id: edition.id }} className="group block">
        <div
          className={`relative overflow-hidden rounded-md border border-ink/15 bg-card paper-shadow ${
            featured ? "aspect-[3/4]" : "aspect-[3/4]"
          }`}
        >
          {cover ? (
            <img
              src={cover}
              alt={`Capa - ${edition.title}`}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="grid h-full place-items-center bg-hero-gradient text-serif text-3xl text-primary">
              A Gralha
            </div>
          )}
          <div className="absolute top-3 left-3 rounded-full bg-ink/85 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-paper">
            Ed. {edition.number}
          </div>
        </div>
        <div className="mt-3">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{dateLabel}</p>
          <h3 className="text-serif text-lg font-bold text-ink group-hover:text-primary transition-colors leading-snug">
            {edition.title}
          </h3>
        </div>
      </Link>
    </motion.div>
  );
}
