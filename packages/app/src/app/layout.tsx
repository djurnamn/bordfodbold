import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { modeBootstrapScript } from "@bordfodbold/ui/scripts";
// The page opinions (reset, canvas) and the base layer (tokens, mode blocks,
// fonts). Each component imports its own stylesheet.
import "@bordfodbold/ui/styles/preflight.scss";
import "@bordfodbold/ui/styles/base.scss";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Bordfodbold",
  description: "Foosball tournament scoreboard.",
};

// Dark by default, a switch in the header; the stored choice wins on reload.
const modeOptions = { defaultMode: "dark" as const, respectSystemPreference: false };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-djui-mode="dark" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: modeBootstrapScript(modeOptions) }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
