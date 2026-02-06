import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cataract Call Analytics",
  description: "Dashboard for cataract surgery post-call analytics",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <nav className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" className="text-sm font-semibold">
              Cataract Call Analytics
            </Link>
            <div className="flex gap-4">
              <Link
                href="/"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Calls
              </Link>
              <Link
                href="/patients"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Patients
              </Link>
              <Link
                href="/analytics"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Analytics
              </Link>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
