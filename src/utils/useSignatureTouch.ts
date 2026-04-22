import { useEffect, RefObject } from 'react';

/**
 * Hook to prevent page scroll on signature canvas (mobile fix).
 * Attaches native touch listeners with { passive: false } so preventDefault() works.
 * React synthetic touch handlers (onTouchStart/Move/End) attach with passive: true by default,
 * which causes preventDefault() to be silently ignored on iOS Safari.
 * Usage:
 *   const canvasRef = useRef<HTMLCanvasElement>(null);
 *   useSignatureTouch(canvasRef);
 */
export function useSignatureTouch(ref: RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    // CSS: prevents default touch handling (scroll, zoom)
    canvas.style.touchAction = 'none';

    const preventScroll = (e: TouchEvent) => {
      e.preventDefault();
    };

    canvas.addEventListener('touchstart', preventScroll, { passive: false });
    canvas.addEventListener('touchmove',  preventScroll, { passive: false });
    canvas.addEventListener('touchend',   preventScroll, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', preventScroll);
      canvas.removeEventListener('touchmove',  preventScroll);
      canvas.removeEventListener('touchend',   preventScroll);
    };
  }, [ref]);
}
