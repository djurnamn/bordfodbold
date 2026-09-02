"use client";

import { ModeSwitch } from "@bordfodbold/ui";
import Link from "next/link";
import type { ReactNode } from "react";
import { createBem } from "use-bem";

import { LiveIndicator } from "@/components/LiveIndicator";
import { useMode } from "@/lib/use-mode";
import "./styles.scss";

interface BoardHeaderProps {
  kicker: string;
  title: string;
  updatedAt: string;
  actions?: ReactNode;
}

export function BoardHeader({ kicker, title, updatedAt, actions }: BoardHeaderProps) {
  const bem = createBem("BoardHeader");
  const { mode, toggle } = useMode();
  return (
    <header className={bem()}>
      <div className={bem("titles")}>
        <span className={bem("kicker")}>{kicker}</span>
        <h1 className={bem("title")}>{title}</h1>
      </div>
      <div className={bem("status")}>
        <LiveIndicator updatedAt={updatedAt} />
      </div>
      <nav className={bem("actions")} aria-label="Views">
        {actions}
        <Link href="/screen" className={bem("link")}>
          Screen
        </Link>
        <Link href="/admin" className={bem("link")}>
          Admin
        </Link>
        <ModeSwitch mode={mode} onModeChange={toggle} />
      </nav>
    </header>
  );
}
