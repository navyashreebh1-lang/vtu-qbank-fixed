"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Search,
  Upload,
  BarChart3,
  Settings,
  FileText,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/shared/navbar";

const sidebarLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/browse", label: "Browse Papers", icon: Search },
  { href: "/dashboard/upload", label: "Upload Paper", icon: Upload },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

function SidebarContent() {
  const pathname = usePathname();

  return (
    <div className="space-y-1 py-4">
      <div className="px-4 mb-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <span className="font-bold text-sm">
            VTU <span className="text-primary">Q-Bank</span>
          </span>
        </Link>
      </div>

      {sidebarLinks.map((link) => (
        <Link key={link.href} href={link.href}>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3 px-4 h-10 text-sm font-medium",
              pathname === link.href
                ? "bg-primary/10 text-primary hover:bg-primary/15"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <link.icon className="h-4 w-4" />
            {link.label}
          </Button>
        </Link>
      ))}
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="flex pt-0 md:pt-16">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 border-r border-border/50 min-h-[calc(100vh-4rem)] bg-card/30 backdrop-blur-sm">
          <div className="sticky top-16">
            <SidebarContent />
          </div>
        </aside>

        {/* Mobile Sidebar */}
        <div className="lg:hidden fixed bottom-4 left-4 z-50">
          <Sheet>
            <SheetTrigger render={
              <Button size="icon" className="h-12 w-12 rounded-full shadow-lg">
                <Menu className="h-5 w-5" />
              </Button>
            } />
            <SheetContent side="left" className="w-64 p-0">
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </div>

        {/* Main Content */}
        <main className="flex-1 min-w-0 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
