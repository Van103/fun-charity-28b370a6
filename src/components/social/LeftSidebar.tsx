import { Link, useLocation } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
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
  Sprout,
  Gamepad2,
  MessageCircle,
} from "lucide-react";

const menuItems = [
  { icon: User, labelKey: "menu.profile", href: "https://fun.rich/", external: true },
  { icon: Sprout, labelKey: "menu.farm", href: "https://funfarm.life/feed", external: true },
  { icon: Globe, labelKey: "menu.planet", href: "https://planet.fun.rich/", external: true },
  { icon: Gamepad2, labelKey: "menu.play", href: "https://play.fun.rich/", external: true },
  { icon: MessageCircle, labelKey: "menu.chat", href: "/messages", external: false },
  { icon: GraduationCap, labelKey: "menu.academy", href: "/academy", external: false },
  { icon: TrendingUp, labelKey: "menu.trading", href: "/trading", external: false },
  { icon: PiggyBank, labelKey: "menu.investment", href: "/investment", external: false },
  { icon: Heart, labelKey: "menu.life", href: "/life", external: false },
  { icon: Scale, labelKey: "menu.legal", href: "/legal", external: false },
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
  const { t } = useLanguage();

  return (
    <aside className="w-64 shrink-0 space-y-4 sticky top-20">
      {/* Platform Ecosystem */}
      <div className="glass-card p-4 hover-luxury-glow">
        <h3 className="font-semibold mb-1 text-primary/90" style={{ fontSize: '20px' }}>
          {t("sidebar.ecosystem")}
        </h3>
        <p className="text-xs mb-4 text-primary/60">{t("sidebar.comingSoon")}</p>
        
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = !item.external && location.pathname === item.href;
            const linkClasses = `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 ${
              isActive 
                ? "glossy-btn glossy-btn-gradient shadow-lg font-semibold" 
                : "text-muted-foreground hover:bg-muted/50 hover:scale-[1.02] font-medium active:scale-[0.98]"
            }`;
            
            if (item.external) {
              return (
                <a
                  key={item.labelKey}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClasses}
                >
                  <item.icon className={`w-4 h-4 ${isActive ? "text-white" : "text-primary"}`} />
                  <span style={{ fontSize: '18px' }}>{t(item.labelKey)}</span>
                </a>
              );
            }
            
            return (
              <Link
                key={item.labelKey}
                to={item.href}
                className={linkClasses}
              >
                <item.icon className={`w-4 h-4 ${isActive ? "text-white" : "text-primary"}`} />
                <span style={{ fontSize: '18px' }}>{t(item.labelKey)}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Shortcuts */}
      <div className="glass-card p-4 hover-luxury-glow">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">{t("sidebar.shortcuts")}</h3>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground">
            <Edit className="w-3 h-3 mr-1" />
            {t("sidebar.edit")}
          </Button>
        </div>
        
        <Link 
          to="/wallet" 
          className="flex items-center gap-3 p-2 -mx-2 rounded-xl hover:bg-muted/50 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-champagne to-gold-light flex items-center justify-center shadow-md">
            <Coins className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-medium text-foreground">CAMLY COIN</span>
        </Link>
      </div>

      {/* User Count */}
      <div className="glass-card p-3 hover-luxury-glow">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-sm text-muted-foreground">
            <span className="font-bold text-foreground">1B96868</span> {t("sidebar.users")}
          </span>
        </div>
      </div>
    </aside>
  );
}
