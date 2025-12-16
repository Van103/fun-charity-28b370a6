import { Link, useLocation } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  User,
  Users,
  GraduationCap,
  TrendingUp,
  PiggyBank,
  Heart,
  Scale,
  Globe,
  Coins,
  Edit,
  Sprout,
  Gamepad2,
  MessageCircle,
} from "lucide-react";

const menuItems = [
  { icon: User, label: "Fun Profile", href: "/profile" },
  { icon: Users, label: "Bạn bè", href: "/friends" },
  { icon: Sprout, label: "Fun Farm", href: "/farm" },
  { icon: Globe, label: "Fun Planet", href: "/planet" },
  { icon: Gamepad2, label: "Fun Play", href: "/play" },
  { icon: MessageCircle, label: "Fun Chat", href: "/chat" },
  { icon: GraduationCap, label: "Fun Academy", href: "/academy" },
  { icon: TrendingUp, label: "Fun Trading", href: "/trading" },
  { icon: PiggyBank, label: "Fun Investment", href: "/investment" },
  { icon: Heart, label: "Fun Life", href: "/life" },
  { icon: Scale, label: "Fun Legal", href: "/legal" },
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
        <h3 className="text-sm font-semibold text-foreground mb-1">
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
                    ? "bg-gradient-to-r from-primary to-primary-light text-primary-foreground font-medium shadow-sm"
                    : "text-foreground hover:bg-muted/50"
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
          <Button variant="ghost" size="sm" className="text-xs text-primary hover:text-primary-dark hover:bg-primary/5">
            <Edit className="w-3 h-3 mr-1" />
            Chỉnh sửa
          </Button>
        </div>
        
        <Link 
          to="/wallet" 
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-gold-champagne/20 to-gold-champagne/10 hover:from-gold-champagne/30 hover:to-gold-champagne/20 transition-all border border-gold-champagne/20"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-champagne to-gold-light flex items-center justify-center">
            <Coins className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-medium text-foreground">CAMLY COIN</span>
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