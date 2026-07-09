import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getSponsorImageUrl, getSponsors, type Sponsor } from "@/lib/store";

interface Entry {
  sponsor: Sponsor;
  url: string;
}

export function SponsorCarousel() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let alive = true;

    getSponsors()
      .then((rows) => {
        if (!alive) return;
        setEntries(
          rows
            .filter((s) => s.active)
            .map((s) => ({ sponsor: s, url: getSponsorImageUrl(s.imagePath) })),
        );
      })
      .catch((error) => console.error(error));

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (entries.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % entries.length), 4200);
    return () => clearInterval(t);
  }, [entries.length]);

  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-ink/25 bg-card/60 p-8 text-center text-sm text-muted-foreground">
        Espaço reservado para apoiadores culturais.
      </div>
    );
  }

  const current = entries[index];

  return (
    <div className="relative overflow-hidden rounded-xl border border-ink/15 bg-card paper-shadow">
      <AnimatePresence mode="wait">
        <motion.a
          key={current.sponsor.id}
          href={current.sponsor.url || "#"}
          target="_blank"
          rel="noreferrer"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="block"
        >
          <img
            src={current.url}
            alt={current.sponsor.name}
            className="h-40 sm:h-56 w-full object-contain bg-paper p-4"
          />
        </motion.a>
      </AnimatePresence>
      <div className="flex justify-center gap-1.5 py-3 bg-card">
        {entries.map((e, i) => (
          <button
            key={e.sponsor.id}
            onClick={() => setIndex(i)}
            aria-label={`Ir para patrocinador ${i + 1}`}
            className={`h-1.5 rounded-full transition-all ${i === index ? "w-6 bg-primary" : "w-1.5 bg-ink/25"}`}
          />
        ))}
      </div>
    </div>
  );
}
