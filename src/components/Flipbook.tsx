import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import HTMLFlipBook from "react-pageflip";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  RotateCcw,
  Rows3,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { CulturalLoader } from "@/components/CulturalLoader";
import { renderPdfToImages } from "@/lib/pdf";
import { getEditionPdfUrl, type Edition } from "@/lib/store";

interface Props {
  edition: Edition;
}

type ReadingMode = "flip" | "scroll";

const zoomSteps = [1, 1.25, 1.5, 1.75, 2];

export function Flipbook({ edition }: Props) {
  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [dims, setDims] = useState({ w: 500, h: 700 });
  const [zoomIndex, setZoomIndex] = useState(0);
  const [readingMode, setReadingMode] = useState<ReadingMode>("flip");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bookRef = useRef<any>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const zoom = zoomSteps[zoomIndex];

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setPages([]);

    renderPdfToImages(getEditionPdfUrl(edition.pdfPath), 1.8)
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
    const media = window.matchMedia("(max-width: 719px)");
    const updateMode = () => setReadingMode(media.matches ? "scroll" : "flip");

    updateMode();
    media.addEventListener("change", updateMode);
    return () => media.removeEventListener("change", updateMode);
  }, []);

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

  function zoomOut() {
    setZoomIndex((value) => Math.max(0, value - 1));
  }

  function zoomIn() {
    setZoomIndex((value) => Math.min(zoomSteps.length - 1, value + 1));
  }

  if (loading) {
    return <CulturalLoader title="Carregando páginas" className="py-20" />;
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
      <div className="sticky top-[74px] z-30 flex w-full flex-wrap items-center justify-center gap-2 rounded-md border border-ink/10 bg-paper/95 px-2 py-2 shadow-sm backdrop-blur sm:top-[82px] sm:w-auto">
        <IconButton
          label="Modo folhear"
          active={readingMode === "flip"}
          onClick={() => setReadingMode("flip")}
        >
          <BookOpen className="h-4 w-4" />
        </IconButton>
        <IconButton
          label="Modo rolagem"
          active={readingMode === "scroll"}
          onClick={() => setReadingMode("scroll")}
        >
          <Rows3 className="h-4 w-4" />
        </IconButton>
        <span className="mx-1 h-6 w-px bg-ink/15" />
        <IconButton label="Diminuir zoom" onClick={zoomOut} disabled={zoomIndex === 0}>
          <ZoomOut className="h-4 w-4" />
        </IconButton>
        <span className="w-12 text-center text-xs font-semibold tabular-nums text-ink">
          {Math.round(zoom * 100)}%
        </span>
        <IconButton
          label="Aumentar zoom"
          onClick={zoomIn}
          disabled={zoomIndex === zoomSteps.length - 1}
        >
          <ZoomIn className="h-4 w-4" />
        </IconButton>
        <IconButton
          label="Restaurar zoom"
          onClick={() => setZoomIndex(0)}
          disabled={zoomIndex === 0}
        >
          <RotateCcw className="h-4 w-4" />
        </IconButton>
      </div>

      {readingMode === "scroll" ? (
        <ScrollReader pages={pages} title={edition.title} zoom={zoom} />
      ) : (
        <FlipReader
          pages={pages}
          title={edition.title}
          zoom={zoom}
          dims={dims}
          current={current}
          setCurrent={setCurrent}
          bookRef={bookRef}
          wrapRef={wrapRef}
        />
      )}
    </div>
  );
}

function ScrollReader({ pages, title, zoom }: { pages: string[]; title: string; zoom: number }) {
  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="mx-auto flex min-w-0 flex-col items-center gap-5 px-1">
        {pages.map((src, i) => (
          <figure
            key={i}
            className="w-full shrink-0 rounded-md border border-ink/10 bg-paper p-1 paper-shadow"
            style={{
              maxWidth: `${Math.round(760 * zoom)}px`,
              width: `${Math.round(100 * zoom)}%`,
            }}
          >
            <img
              src={src}
              alt={`${title} - página ${i + 1}`}
              className="h-auto w-full select-auto rounded-sm object-contain"
              draggable={false}
            />
            <figcaption className="py-2 text-center text-xs text-muted-foreground">
              Página {i + 1} de {pages.length}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

function FlipReader({
  pages,
  title,
  zoom,
  dims,
  current,
  setCurrent,
  bookRef,
  wrapRef,
}: {
  pages: string[];
  title: string;
  zoom: number;
  dims: { w: number; h: number };
  current: number;
  setCurrent: (page: number) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bookRef: RefObject<any>;
  wrapRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <>
      <div className="w-full overflow-auto pb-4">
        <div
          className="mx-auto flex justify-center"
          style={{
            width: `${dims.w * zoom * 2}px`,
            minWidth: "100%",
            height: `${dims.h * zoom}px`,
          }}
        >
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "top center",
            }}
          >
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
                    alt={`${title} - página ${i + 1}`}
                    className="w-full h-full object-contain select-none"
                    draggable={false}
                  />
                </div>
              ))}
            </HTMLFlipBook>
          </div>
        </div>
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
    </>
  );
}

function IconButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`grid h-9 w-9 place-items-center rounded-md border text-ink transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-ink/20 bg-paper hover:bg-ink hover:text-paper"
      }`}
    >
      {children}
    </button>
  );
}
