"use client";

import { Button, Drawer, Icon, ModeSwitch, NavigationItem, NavigationList } from "@bordfodbold/ui";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { createBem } from "use-bem";

import { LiveIndicator } from "@/components/LiveIndicator";
import { useMode } from "@/lib/use-mode";
import "./styles.scss";

interface ViewHeaderProps {
  kicker: string;
  title: string;
  updatedAt: string;
  /** Controls before the menu. */
  actions?: ReactNode;
  /** Something beside the live indicator - the screen's clock. */
  aside?: ReactNode;
  /** The menu drawer; off for a screen nobody taps. */
  menu?: boolean;
  className?: string;
}

const views = [
  { href: "/", label: "Board" },
  { href: "/screen", label: "Screen" },
  { href: "/admin", label: "Admin" },
];

/**
 * Every view's header: the kicker and title, the live indicator, and the
 * menu - a drawer with the three views and the mode switch.
 */
export function ViewHeader({ kicker, title, updatedAt, actions, aside, menu = true, className }: ViewHeaderProps) {
  const bem = createBem("ViewHeader");
  const pathname = usePathname();
  const { mode, toggle } = useMode();
  return (
    <header className={[bem(undefined, { menuless: !menu }), className].filter(Boolean).join(" ")}>
      <div className={bem("titles")}>
        <span className={bem("kicker")}>{kicker}</span>
        <h1 className={bem("title")}>{title}</h1>
      </div>
      <div className={bem("status")}>
        {aside}
        <LiveIndicator updatedAt={updatedAt} />
      </div>
      {(menu || actions) && (
        <div className={bem("actions")}>
          {actions}
          {menu && (
            <Drawer side="right" label="Menu" trigger={({ triggerProps }) => <Button {...triggerProps} variant="soft" icon={<Icon name="menu" />} label="Menu" aria-label="Menu" />}>
              <div className={bem("menu")}>
                <NavigationList label="Views">
                  {views.map((view) => (
                    <NavigationItem key={view.href} href={view.href} label={view.label} active={view.href === pathname} />
                  ))}
                </NavigationList>
                <div className={bem("menuMode")}>
                  <ModeSwitch mode={mode} onModeChange={toggle} />
                </div>
              </div>
            </Drawer>
          )}
        </div>
      )}
    </header>
  );
}
