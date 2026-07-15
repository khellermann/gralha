import { useEffect, useState } from "react";
import { getPublishedMuralArtists, type MuralArtist } from "@/lib/store";
import "sweetalert2/dist/sweetalert2.min.css";

const rotations = ["-rotate-2", "rotate-1", "-rotate-1", "rotate-2", "rotate-0"];

export function MuralSection() {
  const [items, setItems] = useState<MuralArtist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    getPublishedMuralArtists()
      .then((rows) => {
        if (alive) setItems(rows);
      })
      .catch((error) => console.error(error))
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="rounded-lg border border-dashed border-ink/25 bg-card/60 p-8 text-center text-sm text-muted-foreground">
        Preparando o mural de artistas...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-ink/25 bg-card/60 p-8 text-center text-sm text-muted-foreground">
        Em breve, fotos e depoimentos dos artistas com A Gralha.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item, index) => (
        <button
          key={item.id}
          type="button"
          onClick={() => void openMuralModal(item)}
          className={`group flex h-full flex-col bg-white p-3 pb-5 text-left shadow-[0_14px_30px_rgba(47,42,34,0.16)] transition duration-300 hover:-translate-y-1 hover:rotate-0 hover:shadow-[0_18px_38px_rgba(47,42,34,0.22)] focus:outline-none focus:ring-2 focus:ring-ring ${rotations[index % rotations.length]}`}
          aria-label={`Ver depoimento de ${item.name}`}
        >
          <img
            src={item.imageUrl}
            alt={item.imageAlt}
            className="aspect-[4/3] w-full bg-paper object-cover"
            loading="lazy"
          />
          <span className="mt-4 text-serif text-xl font-black leading-tight text-ink">
            {item.name}
          </span>
          {item.artisticSegment && (
            <span className="mt-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
              {item.artisticSegment}
            </span>
          )}
          <span className="mt-3 line-clamp-4 text-sm leading-6 text-ink/75">
            “{item.testimonial}”
          </span>
        </button>
      ))}
    </div>
  );
}

async function openMuralModal(item: MuralArtist) {
  const { default: Swal } = await import("sweetalert2");

  await Swal.fire({
    title: escapeHtml(item.name),
    html: `
      <div class="space-y-4 text-left">
        <img
          src="${escapeAttribute(item.imageUrl)}"
          alt="${escapeAttribute(item.imageAlt)}"
          class="mx-auto max-h-[70vh] w-full rounded-md object-contain bg-[#f7f0df] p-2"
        />
        ${
          item.artisticSegment
            ? `<p class="text-xs font-semibold uppercase tracking-[0.22em] text-[#1f7a4d]">${escapeHtml(item.artisticSegment)}</p>`
            : ""
        }
        <p class="text-base leading-7 text-[#2f2a22]">“${escapeHtml(item.testimonial)}”</p>
      </div>
    `,
    confirmButtonText: "Fechar",
    confirmButtonColor: "#1f7a4d",
    width: "min(94vw, 760px)",
  });
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
