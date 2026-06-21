import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DanA-F | Portfolio Intelligence",
  description:
    "Private IDX portfolio monitoring and transparent AI-powered deep dive analysis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
