import type { ComponentPropsWithoutRef, ElementType } from "react";
import { createBem } from "use-bem";
import "./styles.scss";

interface SectionHeadingProps extends ComponentPropsWithoutRef<"h2"> {
  /** `h2` for a section, `span` for a kicker or a label that heads nothing. */
  as?: "h2" | "h3" | "span";
  /** Flush with the page edge instead of the one-rem inset. */
  flush?: boolean;
}

/** The uppercase, letter-spaced label every section and kicker wears. */
export function SectionHeading({ as = "h2", flush = false, className, children, ...rest }: SectionHeadingProps) {
  const bem = createBem("SectionHeading");
  const Tag: ElementType = as;
  return (
    <Tag {...rest} className={[bem(undefined, { flush }), className].filter(Boolean).join(" ")}>
      {children}
    </Tag>
  );
}
