import type { Metadata } from "next";
import Link from "next/link";
import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from "@/components/mode-toggle";
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
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>
          <nav className="border-b border-border bg-background">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
              <Link href="/" className="text-sm font-semibold">
                Cataract Call Analytics
              </Link>
              <div className="flex items-center gap-4">
                <Link
                  href="/"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Calls
                </Link>
                <Link
                  href="/patients"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Patients
                </Link>
                <Link
                  href="/analytics"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Analytics
                </Link>
                <ModeToggle />
              </div>
            </div>
          </nav>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
