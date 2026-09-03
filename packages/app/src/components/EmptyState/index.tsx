import type { ReactNode } from "react";
import { createBem } from "use-bem";
import "./styles.scss";

/** The one line a section shows when it has nothing yet. */
export function EmptyState({ children }: { children: ReactNode }) {
  const bem = createBem("EmptyState");
  return <p className={bem()}>{children}</p>;
}
