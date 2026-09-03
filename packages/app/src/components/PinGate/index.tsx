"use client";

import { AuthTemplate, AuthTemplateHeader, AuthTemplateSection, Field, PinInput, TextLink } from "@bordfodbold/ui";
import Link from "next/link";
import { useState } from "react";

import { SectionHeading } from "@/components/SectionHeading";
import { createBem } from "use-bem";
import "./styles.scss";

interface PinGateProps {
  onSubmit: (pin: string) => Promise<boolean>;
  /** Shown under the field on a demo deployment; leave unset in earnest. */
  hint?: string;
}

/**
 * The admin's front door: four digits, checked by the store. A wrong PIN
 * clears the cells and says so; a right one opens the admin in place.
 */
export function PinGate({ onSubmit, hint }: PinGateProps) {
  const bem = createBem("PinGate");
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);
  const [checking, setChecking] = useState(false);

  const check = async (pin: string) => {
    setChecking(true);
    const ok = await onSubmit(pin);
    setChecking(false);
    if (!ok) {
      setFailed(true);
      setAttempt((count) => count + 1);
    }
  };

  return (
    <AuthTemplate
      header={
        <AuthTemplateHeader
          brand={
            <Link href="/" className={bem("brand")}>
              Bordfodbold
            </Link>
          }
          actions={<TextLink href="/">Back to the board</TextLink>}
        />
      }
    >
      <AuthTemplateSection>
        <div className={bem("intro")}>
          <SectionHeading as="span" flush>
            Admin
          </SectionHeading>
          <h1 className={bem("title")}>Enter the PIN</h1>
          <p className={bem("lead")}>Results and teams can only be changed from here.</p>
        </div>
        <Field label="Admin PIN" errorMessage={failed ? "That is not the PIN. Try again." : undefined} description={hint}>
          {({ id, className, describedBy, invalid }) => (
            <PinInput
              key={attempt}
              length={4}
              mask
              otp
              autoFocus
              disabled={checking}
              error={failed}
              inputProps={{ id, className, "aria-describedby": describedBy, "aria-invalid": invalid }}
              onChange={() => setFailed(false)}
              onComplete={check}
            />
          )}
        </Field>
      </AuthTemplateSection>
    </AuthTemplate>
  );
}
