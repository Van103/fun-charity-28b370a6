import { Link, useLocation } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  User,
  GraduationCap,
  TrendingUp,
  PiggyBank,
  Heart,
  Scale,
  Globe,
  Coins,
  Edit,
} from "lucide-react";

const menuItems = [
  { icon: User, label: "Fun Profile", href: "/profile", active: true },
  { icon: GraduationCap, label: "Fun Academy", href: "/academy" },
  { icon: TrendingUp, label: "Fun Trading", href: "/trading" },
  { icon: PiggyBank, label: "Fun Investment", href: "/investment" },
  { icon: Heart, label: "Fun Life", href: "/life" },
  { icon: Scale, label: "Fun Legal", href: "/legal" },
  { icon: Globe, label: "Fun Planet", href: "/planet" },
];

interface LeftSidebarProps {
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
    wallet_address: string | null;
  } | null;
}

export function LeftSidebar({ profile }: LeftSidebarProps) {
  const location = useLocation();

  return (
    <aside className="w-64 shrink-0 space-y-4 sticky top-20">
      {/* Platform Ecosystem */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-semibold text-primary mb-3">
          Các Platform F.U. Ecosystem
        </h3>
        <p className="text-xs text-muted-foreground mb-4">Coming soon</p>
        
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.label}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Shortcuts */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Lối tắt của bạn</h3>
          <Button variant="ghost" size="sm" className="text-xs text-primary">
            <Edit className="w-3 h-3 mr-1" />
            Chỉnh sửa
          </Button>
        </div>
        
        <Link 
          to="/wallet" 
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-primary/20 to-primary/10 hover:from-primary/30 hover:to-primary/20 transition-all"
        >
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Coins className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm font-medium">CAMLY COIN</span>
        </Link>
      </div>

      {/* User Count */}
      <div className="glass-card p-3">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-muted-foreground">
            <span className="font-semibold text-foreground">1B96868</span> Users
          </span>
        </div>
      </div>
    </aside>
  );
}
