import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CloudeAI — Your AI workspace",
  description: "A unified AI coding workspace for the web and terminal."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
