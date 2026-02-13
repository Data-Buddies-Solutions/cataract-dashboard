import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from "@/components/mode-toggle";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/app/components/app-sidebar";
import { MobileBottomNav } from "@/app/components/mobile-bottom-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cataract Dashboard",
  description: "Dashboard for cataract surgery patient management and call analytics",
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
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <header className="flex h-12 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1 hidden md:flex" />
                <div className="ml-auto">
                  <ModeToggle />
                </div>
              </header>
              <div className="pb-20 md:pb-0">
                {children}
              </div>
              <MobileBottomNav />
            </SidebarInset>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
