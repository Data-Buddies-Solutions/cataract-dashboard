"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ListOrdered,
  PhoneCall,
  BarChart3,
} from "lucide-react";

const navItems = [
  { label: "Today", href: "/", icon: LayoutDashboard },
  { label: "Patients", href: "/patients", icon: Users },
  { label: "Queue", href: "/queue", icon: ListOrdered },
  { label: "Calls", href: "/calls", icon: PhoneCall },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
      <div className="flex h-16 items-center justify-around pb-safe">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 text-[10px] ${
                active
                  ? "font-medium text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              <item.icon className={`h-5 w-5 ${active ? "text-foreground" : ""}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
