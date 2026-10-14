import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "GazDream — адмінка",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <html lang="uk">
      <body className="min-h-screen bg-soft">{children}</body>
    </html>
  );
}
