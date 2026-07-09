import { useEffect, useRef, useState } from "react";
import HTMLFlipBook from "react-pageflip";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { renderPdfToImages } from "@/lib/pdf";
import { getEditionPdfUrl, type Edition } from "@/lib/store";

interface Props {
  edition: Edition;
}

export function Flipbook({ edition }: Props) {
  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [dims, setDims] = useState({ w: 500, h: 700 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bookRef = useRef<any>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setPages([]);

    renderPdfToImages(getEditionPdfUrl(edition.pdfPath))
      .then((images) => {
        if (alive) setPages(images);
      })
      .catch((error) => console.error(error))
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [edition.pdfPath]);

  useEffect(() => {
    function resize() {
      const w = wrapRef.current?.clientWidth ?? 900;
      const isMobile = w < 720;
      const pageW = isMobile ? Math.min(w - 24, 480) : Math.min((w - 32) / 2, 520);
      const pageH = Math.round(pageW * 1.414);
      setDims({ w: pageW, h: pageH });
    }
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  if (loading) {
    return <div className="text-center py-20 text-muted-foreground">Carregando páginas...</div>;
  }
  if (pages.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Esta edição ainda não possui páginas publicadas.
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="flex flex-col items-center gap-5">
      <div className="w-full flex justify-center">
        {/* @ts-expect-error react-pageflip has loose types */}
        <HTMLFlipBook
          ref={bookRef}
          width={dims.w}
          height={dims.h}
          size="fixed"
          minWidth={280}
          maxWidth={1200}
          minHeight={400}
          maxHeight={1600}
          drawShadow
          flippingTime={800}
          usePortrait
          showCover
          mobileScrollSupport
          className="paper-shadow"
          onFlip={(e: { data: number }) => setCurrent(e.data)}
        >
          {pages.map((src, i) => (
            <div key={i} className="bg-paper overflow-hidden">
              <img
                src={src}
                alt={`${edition.title} - página ${i + 1}`}
                className="w-full h-full object-contain select-none"
                draggable={false}
              />
            </div>
          ))}
        </HTMLFlipBook>
      </div>

      <div className="flex items-center gap-3 text-sm">
        <button
          onClick={() => bookRef.current?.pageFlip()?.flipPrev()}
          className="grid h-10 w-10 place-items-center rounded-full border border-ink/25 hover:bg-ink hover:text-paper transition-colors"
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-muted-foreground tabular-nums">
          {current + 1} / {pages.length}
        </span>
        <button
          onClick={() => bookRef.current?.pageFlip()?.flipNext()}
          className="grid h-10 w-10 place-items-center rounded-full border border-ink/25 hover:bg-ink hover:text-paper transition-colors"
          aria-label="Próxima página"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
        <button
          onClick={() => wrapRef.current?.requestFullscreen?.()}
          className="ml-2 hidden sm:grid h-10 w-10 place-items-center rounded-full border border-ink/25 hover:bg-ink hover:text-paper transition-colors"
          aria-label="Tela cheia"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
