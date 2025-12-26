import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/Logo";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MotionToggle } from "@/components/background/MotionToggle";
import { WalletConnectModal } from "@/components/wallet/WalletConnectModal";
import { NotificationDropdown } from "./NotificationDropdown";
import { MessageDropdown } from "./MessageDropdown";
import { SearchBar } from "./SearchBar";
import { LanguageToggle } from "./LanguageToggle";
import CursorSettings from "@/components/cursor/CursorSettings";
import { useLanguage } from "@/contexts/LanguageContext";
import { useFriendRequestNotifications } from "@/hooks/useFriendNotifications";
import { usePostNotifications } from "@/hooks/usePostNotifications";
import { useDonationNotifications } from "@/hooks/useDonationNotifications";
import {
  Menu,
  X,
  Wallet,
  LayoutDashboard,
  MapPin,
  Users,
  Star,
  Newspaper,
  LogOut,
  User as UserIcon,
  Settings,
  Check,
  Home,
  ChevronDown,
  Layers,
  MessageCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const platformItems = [
  { nameKey: "nav.campaigns", path: "/campaigns", icon: Newspaper },
  { nameKey: "nav.myCampaigns", path: "/my-campaigns", icon: Layers },
  { nameKey: "nav.needsMap", path: "/needs-map", icon: MapPin },
  { nameKey: "nav.overview", path: "/dashboard", icon: LayoutDashboard },
  { nameKey: "nav.reviews", path: "/reviews", icon: Star },
];

const navItems = [
  { nameKey: "nav.communityProfiles", path: "/profiles", icon: Users },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Enable realtime notifications
  useFriendRequestNotifications(user?.id || null);
  usePostNotifications(user?.id || null);
  useDonationNotifications(user?.id || null);

  // Fetch unread message count
  useEffect(() => {
    if (!user?.id) {
      setUnreadMessageCount(0);
      return;
    }

    const fetchUnreadCount = async () => {
      // Get all conversations for this user
      const { data: convos } = await supabase
        .from("conversations")
        .select("id")
        .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`);

      if (!convos || convos.length === 0) {
        setUnreadMessageCount(0);
        return;
      }

      const convoIds = convos.map(c => c.id);
      
      // Count unread messages
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .in("conversation_id", convoIds)
        .eq("is_read", false)
        .neq("sender_id", user.id);

      setUnreadMessageCount(count || 0);
    };

    fetchUnreadCount();

    // Subscribe to new messages
    const channel = supabase
      .channel("navbar-messages")
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setAvatarUrl(null);
        setConnectedWallet(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("avatar_url, wallet_address")
      .eq("user_id", userId)
      .single();
    
    if (data?.avatar_url) {
      setAvatarUrl(data.avatar_url);
    }
    if (data?.wallet_address) {
      setConnectedWallet(data.wallet_address);
    }
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-border/50 shadow-sm">
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo + Home + Search */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Link to="/social" className="flex items-center gap-1 sm:gap-2 group">
              <Logo size="md" />
            </Link>
            
            {/* Home Button - hidden on mobile, shown on sm+ */}
            <Link to="/social" className="hidden sm:block">
              <Button 
                variant={location.pathname === "/social" ? "secondary" : "ghost"} 
                size="icon"
                className={location.pathname === "/social" ? "bg-primary/20 text-primary" : "text-foreground hover:text-primary hover:bg-primary/10"}
                title={t("nav.home")}
              >
                <Home className="w-5 h-5" />
              </Button>
            </Link>
            
            {/* Search - hidden on mobile, shown on md+ */}
            <div className="hidden md:block">
              <SearchBar />
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {/* Platform Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 text-foreground hover:text-primary hover:bg-primary/10">
                  <Layers className="w-4 h-4" />
                  {t("nav.platform")}
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {platformItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem key={item.path} asChild>
                      <Link to={item.path} className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {t(item.nameKey)}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    className={isActive ? "bg-primary/20 text-primary" : "text-foreground hover:text-primary hover:bg-primary/10"}
                  >
                    <Icon className="w-4 h-4" />
                    {t(item.nameKey)}
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* Right Actions - adjusted for mobile */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* These items hidden on mobile, shown on md+ */}
            <div className="hidden md:flex items-center gap-2">
              <LanguageToggle />
              <CursorSettings />
            </div>
            
            {/* Messages Dropdown - always visible */}
            {user && (
              <MessageDropdown userId={user.id} unreadCount={unreadMessageCount} />
            )}

            {/* Notifications - always visible but smaller on mobile */}
            <NotificationDropdown />

            {/* Settings Popover - hidden on mobile */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="hidden md:flex text-foreground hover:text-primary hover:bg-primary/10">
                  <Settings className="w-5 h-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">{t("common.settings")}</h4>
                  <MotionToggle />
                </div>
              </PopoverContent>
            </Popover>
            
            <WalletConnectModal 
              open={walletModalOpen} 
              onOpenChange={setWalletModalOpen}
              onWalletConnected={(address) => setConnectedWallet(address)}
            />

            {/* User section - compact on mobile */}
            <div className="hidden sm:flex items-center gap-2 pl-2 sm:pl-3 border-l border-border/50">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-1 sm:gap-2 text-sm hover:opacity-80 transition-opacity cursor-pointer focus:outline-none">
                      <Avatar className="w-7 h-7 sm:w-8 sm:h-8 border-2 border-secondary/70 ring-2 ring-primary/20">
                        <AvatarImage src={avatarUrl || undefined} alt="Avatar" />
                        <AvatarFallback className="bg-secondary/30">
                          <UserIcon className="w-3 h-3 sm:w-4 sm:h-4 text-secondary" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden lg:block font-bold max-w-[120px] truncate bg-gradient-to-r from-purple-dark via-primary to-secondary bg-clip-text text-transparent">
                        {user.user_metadata?.full_name || user.email?.split('@')[0]}
                      </span>
                      <ChevronDown className="hidden lg:block w-3 h-3 text-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="flex items-center gap-2 cursor-pointer">
                        <UserIcon className="w-4 h-4" />
                        {t("user.profile")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setWalletModalOpen(true)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Wallet className="w-4 h-4" />
                      {connectedWallet ? (
                        <span>{t("common.walletPrefix")} {shortenAddress(connectedWallet)}</span>
                      ) : (
                        <span>{t("common.connectWallet")}</span>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={handleLogout}
                      className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
                    >
                      <LogOut className="w-4 h-4" />
                      {t("user.logout")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Link to="/auth">
                    <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                      {t("common.login")}
                    </Button>
                  </Link>
                  <Link to="/campaigns" className="hidden sm:block">
                    <Button variant="hero" size="sm" className="text-xs sm:text-sm">
                      {t("common.donate")}
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile Menu Button - only visible on small screens */}
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu - slide down */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="sm:hidden bg-background border-b border-border"
          >
            <div className="container mx-auto px-4 py-4 space-y-3">
              {/* Search on mobile */}
              <div className="mb-4">
                <SearchBar />
              </div>

              <Link to="/social" onClick={() => setIsOpen(false)}>
                <Button variant="ghost" className="w-full justify-start gap-3 h-12 text-base">
                  <Home className="w-5 h-5" />
                  {t("nav.home")}
                </Button>
              </Link>
              
              {/* Platform items */}
              <div className="py-2">
                <p className="px-3 text-xs font-semibold text-muted-foreground mb-2">{t("nav.platform")}</p>
                {platformItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsOpen(false)}
                    >
                      <Button variant="ghost" className="w-full justify-start gap-3 h-12 text-base">
                        <Icon className="w-5 h-5" />
                        {t(item.nameKey)}
                      </Button>
                    </Link>
                  );
                })}
              </div>

              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                  >
                    <Button variant="ghost" className="w-full justify-start gap-3 h-12 text-base">
                      <Icon className="w-5 h-5" />
                      {t(item.nameKey)}
                    </Button>
                  </Link>
                );
              })}

              <div className="pt-4 space-y-3 border-t border-border">
                <Button 
                  variant="wallet" 
                  className="w-full h-12 text-base"
                  onClick={() => {
                    setWalletModalOpen(true);
                    setIsOpen(false);
                  }}
                >
                  {connectedWallet ? (
                    <>
                      <Check className="w-4 h-4 text-success" />
                      {shortenAddress(connectedWallet)}
                    </>
                  ) : (
                    <>
                      <Wallet className="w-4 h-4" />
                      {t("common.connectWallet")}
                    </>
                  )}
                </Button>
                {user ? (
                  <>
                    <Link to="/profile" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-muted rounded-xl transition-colors">
                      <Avatar className="w-10 h-10 border-2 border-secondary/50">
                        <AvatarImage src={avatarUrl || undefined} alt="Avatar" />
                        <AvatarFallback className="bg-secondary/20">
                          <UserIcon className="w-5 h-5 text-secondary" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="navbar-username text-base truncate font-semibold">
                        {user.user_metadata?.full_name || user.email?.split('@')[0]}
                      </span>
                    </Link>
                    <Button variant="outline" className="w-full h-12 text-base" onClick={() => { handleLogout(); setIsOpen(false); }}>
                      <LogOut className="w-5 h-5 mr-2" />
                      {t("user.logout")}
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/auth" onClick={() => setIsOpen(false)}>
                      <Button variant="outline" className="w-full h-12 text-base">
                        {t("common.login")}
                      </Button>
                    </Link>
                    <Link to="/campaigns" onClick={() => setIsOpen(false)}>
                      <Button variant="hero" className="w-full h-12 text-base">
                        {t("common.donate")}
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
