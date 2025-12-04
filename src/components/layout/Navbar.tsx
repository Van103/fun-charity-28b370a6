import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/brand/Logo";
import {
  Menu,
  X,
  Bell,
  Wallet,
  LayoutDashboard,
  MapPin,
  Users,
  Star,
  Shield,
  Newspaper,
} from "lucide-react";

const navItems = [
  { name: "Chiến Dịch", path: "/campaigns", icon: Newspaper },
  { name: "Bản Đồ Nhu Cầu", path: "/needs-map", icon: MapPin },
  { name: "Tổng Quan", path: "/dashboard", icon: LayoutDashboard },
  { name: "Hồ Sơ", path: "/profiles", icon: Users },
  { name: "Đánh Giá", path: "/reviews", icon: Star },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <Logo size="md" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    className={isActive ? "bg-secondary/10 text-secondary" : ""}
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* Right Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-secondary rounded-full animate-pulse" />
            </Button>
            
            <Button variant="wallet" size="sm" className="gap-2">
              <Wallet className="w-4 h-4" />
              <span className="font-mono text-xs">Kết Nối Ví</span>
            </Button>

            <div className="flex items-center gap-2 pl-3 border-l border-border">
              <Link to="/auth">
                <Button variant="outline" size="sm">
                  Đăng Nhập
                </Button>
              </Link>
              <Link to="/campaigns">
                <Button variant="hero" size="sm">
                  Quyên Góp
                </Button>
              </Link>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-background border-b border-border"
          >
            <div className="container mx-auto px-4 py-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                  >
                    <Button variant="ghost" className="w-full justify-start gap-3">
                      <Icon className="w-5 h-5" />
                      {item.name}
                    </Button>
                  </Link>
                );
              })}
              <div className="pt-4 space-y-2 border-t border-border">
                <Button variant="wallet" className="w-full">
                  <Wallet className="w-4 h-4" />
                  Kết Nối Ví
                </Button>
                <Link to="/auth" onClick={() => setIsOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Đăng Nhập
                  </Button>
                </Link>
                <Link to="/campaigns" onClick={() => setIsOpen(false)}>
                  <Button variant="hero" className="w-full">
                    Quyên Góp
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
