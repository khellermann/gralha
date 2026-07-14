import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { BookOpen, Feather } from "lucide-react";

const defaultPhrases = [
  "Folheando histórias...",
  "Preparando as páginas...",
  "Ajustando a tinta no papel...",
  "Abrindo o acervo cultural...",
];

interface CulturalLoaderProps {
  title?: string;
  phrases?: string[];
  className?: string;
}

export function CulturalLoader({
  title = "Carregando",
  phrases = defaultPhrases,
  className = "",
}: CulturalLoaderProps) {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const shouldReduceMotion = useReducedMotion();
  const activePhrases = phrases.length > 0 ? phrases : defaultPhrases;

  useEffect(() => {
    if (shouldReduceMotion || activePhrases.length <= 1) return;

    const interval = window.setInterval(() => {
      setPhraseIndex((index) => (index + 1) % activePhrases.length);
    }, 2200);

    return () => window.clearInterval(interval);
  }, [activePhrases.length, shouldReduceMotion]);

  const phrase = activePhrases[phraseIndex % activePhrases.length];

  return (
    <motion.div
      role="status"
      aria-live="polite"
      initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
      animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className={`mx-auto flex max-w-md flex-col items-center px-4 py-14 text-center text-ink ${className}`}
    >
      <div className="relative h-28 w-28">
        <motion.div
          aria-hidden="true"
          animate={shouldReduceMotion ? undefined : { rotate: [-2, 2, -2] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-3 rounded-md border border-ink/15 bg-card paper-shadow"
        >
          <div className="absolute left-4 top-5 h-1.5 w-12 rounded-full bg-primary/35" />
          <div className="absolute left-4 top-9 h-1 w-16 rounded-full bg-ink/15" />
          <div className="absolute left-4 top-13 h-1 w-14 rounded-full bg-ink/15" />
          <div className="absolute left-4 top-17 h-1 w-10 rounded-full bg-ink/15" />
        </motion.div>

        <motion.div
          aria-hidden="true"
          animate={shouldReduceMotion ? undefined : { x: [0, 6, 0], rotateY: [0, -18, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute right-5 top-4 h-20 w-12 origin-left rounded-r-md border border-ink/10 bg-paper/95 shadow-sm"
        >
          <div className="mx-auto mt-4 h-1 w-7 rounded-full bg-ink/15" />
          <div className="mx-auto mt-2 h-1 w-6 rounded-full bg-ink/15" />
          <div className="mx-auto mt-2 h-1 w-5 rounded-full bg-primary/25" />
        </motion.div>

        <motion.div
          aria-hidden="true"
          animate={shouldReduceMotion ? undefined : { y: [0, -5, 0], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1 left-1/2 grid h-11 w-11 -translate-x-1/2 place-items-center rounded-full bg-gralha-gradient text-primary-foreground shadow-lg"
        >
          <BookOpen className="h-5 w-5" />
        </motion.div>

        <motion.div
          aria-hidden="true"
          animate={shouldReduceMotion ? undefined : { x: [0, 4, -2, 0], y: [0, -3, 1, 0] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute right-0 top-1 text-primary"
        >
          <Feather className="h-6 w-6" />
        </motion.div>
      </div>

      <h2 className="mt-4 text-serif text-2xl font-black text-ink">{title}</h2>
      <motion.p
        key={phrase}
        initial={shouldReduceMotion ? false : { opacity: 0, y: 4 }}
        animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="mt-2 min-h-5 text-sm text-muted-foreground"
      >
        {phrase}
      </motion.p>
      <span className="sr-only">{title}. Aguarde.</span>
    </motion.div>
  );
}
