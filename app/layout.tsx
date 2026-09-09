import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chemistry Learning Diagnostic Centre",
  description: "Upload an examination paper, student response, and marking reference to generate strengths, error causes, and a targeted remediation path.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
