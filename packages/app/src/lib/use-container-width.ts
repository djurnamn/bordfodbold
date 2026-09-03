import { useEffect, useState, type RefObject } from "react";

/** The width of an element, followed through resizes; `0` until measured. */
export function useContainerWidth(reference: RefObject<HTMLElement | null>): number {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const element = reference.current;
    if (element === null) {
      return;
    }
    const update = () => setWidth(element.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [reference]);
  return width;
}
