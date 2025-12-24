import { useState } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  UserPlus,
  Receipt,
  Menu,
  X,
  Milk
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Products", href: "/products", icon: Package },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Daily Sales", href: "/daily-sales", icon: ShoppingCart },
  { name: "Guest Sales", href: "/guest-sales", icon: UserPlus },
  { name: "Billing", href: "/billing", icon: Receipt },
];

export const Sidebar = ({ mobile = false, onClose }) => {
  const location = useLocation();

  return (
    <div className={cn("flex flex-col h-full", mobile ? "pt-4" : "")}>
      {/* Logo */}
      <div className="px-6 py-6 border-b border-stone-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-900 flex items-center justify-center">
            <Milk className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-stone-900 font-fraunces">Lata Dairy</h1>
            <p className="text-xs text-stone-500">Management Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href || 
            (item.href !== "/" && location.pathname.startsWith(item.href));
          
          return (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={onClose}
              className={cn(
                "sidebar-link",
                isActive && "active"
              )}
              data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-stone-200">
        <p className="text-xs text-stone-400 text-center">
          © 2024 Lata Dairy
        </p>
      </div>
    </div>
  );
};

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#fdfbf7]">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col bg-white border-r border-stone-200">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-72">
          <Sidebar mobile onClose={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-stone-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-900 flex items-center justify-center">
              <Milk className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-stone-900 font-fraunces">Lata Dairy</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
            data-testid="mobile-menu-btn"
          >
            <Menu className="w-6 h-6" />
          </Button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
