import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getSponsorImageUrl, getSponsors, type Sponsor } from "@/lib/store";
import "sweetalert2/dist/sweetalert2.min.css";

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
        <motion.button
          key={current.sponsor.id}
          type="button"
          onClick={() => void openSponsorModal(current)}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="block w-full cursor-pointer text-left"
          aria-label={`Ver informaÃ§Ãµes do patrocinador ${current.sponsor.name}`}
        >
          <img
            src={current.url}
            alt={current.sponsor.name}
            className="h-40 sm:h-56 w-full object-contain bg-paper p-4"
          />
        </motion.button>
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

async function openSponsorModal(entry: Entry) {
  const { default: Swal } = await import("sweetalert2");
  const whatsappHref = getWhatsappUrl(entry.sponsor.whatsapp);
  const address = entry.sponsor.address.trim();
  const whatsapp = entry.sponsor.whatsapp.trim();

  const result = await Swal.fire({
    title: escapeHtml(entry.sponsor.name),
    html: `
      <div class="space-y-4 text-left">
        <img
          src="${escapeAttribute(entry.url)}"
          alt="${escapeAttribute(entry.sponsor.name)}"
          class="mx-auto max-h-64 w-full rounded-lg object-contain bg-[#f7f0df] p-3"
        />
        <div class="space-y-2 text-sm text-[#2f2a22]">
          ${whatsapp ? `<p><strong>WhatsApp:</strong> ${escapeHtml(whatsapp)}</p>` : ""}
          ${address ? `<p><strong>EndereÃ§o:</strong> ${escapeHtml(address)}</p>` : ""}
        </div>
      </div>
    `,
    confirmButtonText: whatsappHref ? "Conversar no WhatsApp" : "Fechar",
    showCancelButton: Boolean(whatsappHref),
    cancelButtonText: "Fechar",
    confirmButtonColor: "#1f7a4d",
    cancelButtonColor: "#6b6257",
    width: "min(92vw, 620px)",
  });

  if (result.isConfirmed && whatsappHref) {
    window.open(whatsappHref, "_blank", "noopener,noreferrer");
  }
}

function getWhatsappUrl(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  const normalized = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${normalized}`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}
