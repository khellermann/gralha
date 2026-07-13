import { useEffect, useState } from "react";
import { getSponsorImageUrl, getSponsors, type Sponsor } from "@/lib/store";
import "sweetalert2/dist/sweetalert2.min.css";

interface Entry {
  sponsor: Sponsor;
  url: string;
}

export function SponsorCarousel() {
  const [entries, setEntries] = useState<Entry[]>([]);

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

  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-ink/25 bg-card/60 p-8 text-center text-sm text-muted-foreground">
        Espaço reservado para apoiadores culturais.
      </div>
    );
  }

  return (
    <div
      className={`grid gap-3 sm:gap-4 ${
        entries.length === 1
          ? "mx-auto max-w-sm grid-cols-1"
          : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
      }`}
    >
      {entries.map((entry) => (
        <button
          key={entry.sponsor.id}
          type="button"
          onClick={() => void openSponsorModal(entry)}
          className="group flex aspect-[2/1] w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-ink/15 bg-paper p-4 paper-shadow transition hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label={`Ver informações do patrocinador ${entry.sponsor.name}`}
        >
          <img
            src={entry.url}
            alt={entry.sponsor.name}
            className="h-full w-full object-contain transition duration-300 group-hover:scale-[1.03]"
          />
        </button>
      ))}
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
          ${address ? `<p><strong>Endereço:</strong> ${escapeHtml(address)}</p>` : ""}
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
