import { useEffect, useRef, type ReactNode } from "react";
import { annotate, type RoughAnnotation } from "rough-notation";

export function RoughUnderline({
  children,
  className = "",
  color = "var(--primary)",
}: {
  children: ReactNode;
  className?: string;
  color?: string;
}) {
  const elementRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!elementRef.current) return;

    let annotation: RoughAnnotation | undefined;
    const timer = window.setTimeout(() => {
      if (!elementRef.current) return;

      annotation = annotate(elementRef.current, {
        type: "underline",
        color,
        strokeWidth: 2,
        iterations: 2,
        padding: [0, 2],
        animate: true,
        animationDuration: 900,
      });
      annotation.show();
    }, 180);

    return () => {
      window.clearTimeout(timer);
      annotation?.remove();
    };
  }, [color]);

  return (
    <span ref={elementRef} className={`relative inline-block ${className}`}>
      {children}
    </span>
  );
}
