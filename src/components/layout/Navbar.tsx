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
  Globe,
  MousePointer2,
  Sparkles,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
          {/* Left Section: Logo + Search + Home */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Logo - Circular, text shows on hover */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Link to="/social" className="flex items-center">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <Logo size="md" showText={false} />
                  </motion.div>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-foreground text-background font-bold text-base px-4 py-2">
                FUNCHARITY
              </TooltipContent>
            </Tooltip>
            
            {/* Search - next to logo, compact */}
            <div className="hidden md:block w-44 lg:w-52">
              <SearchBar />
            </div>

            {/* Home Button - right of search */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Link to="/social">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.92 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-full transition-all duration-300 ${
                        location.pathname === "/social" 
                          ? "bg-gradient-to-br from-primary to-primary/80 text-white shadow-lg shadow-primary/30 hover:shadow-primary/50" 
                          : "text-primary hover:bg-primary/15 hover:text-primary hover:shadow-md"
                      }`}
                    >
                      <Home className="w-7 h-7 sm:w-8 sm:h-8" strokeWidth={2.5} />
                      {location.pathname === "/social" && (
                        <motion.div
                          layoutId="nav-indicator"
                          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-1 bg-primary rounded-full"
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      )}
                    </Button>
                  </motion.div>
                </Link>
              </TooltipTrigger>
              <TooltipContent className="bg-foreground text-background font-semibold">
                {t("nav.home")}
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Center Navigation - Larger icon buttons */}
          <div className="hidden lg:flex items-center gap-2">
            {/* Platform Dropdown - With arrow indicator */}
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.92 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <Button 
                        variant="ghost" 
                        size="default" 
                        className="w-auto h-12 px-4 gap-1 rounded-full text-primary hover:bg-primary/15 hover:shadow-md transition-all duration-300"
                      >
                        <Layers className="w-7 h-7" strokeWidth={2.5} />
                        <ChevronDown className="w-5 h-5" strokeWidth={2.5} />
                      </Button>
                    </motion.div>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent className="bg-foreground text-background font-semibold">
                  {t("nav.platform")}
                </TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="center" className="w-56 bg-background border border-border shadow-xl rounded-xl p-1">
                {platformItems.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.path}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
                        <Link to={item.path} className="flex items-center gap-3 py-3 px-3 hover:bg-primary/10 transition-colors">
                          <div className="p-2 rounded-full bg-primary/10">
                            <Icon className="w-5 h-5 text-primary" />
                          </div>
                          <span className="font-semibold text-foreground">{t(item.nameKey)}</span>
                        </Link>
                      </DropdownMenuItem>
                    </motion.div>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Community - Larger icon */}
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Tooltip key={item.path}>
                  <TooltipTrigger asChild>
                    <Link to={item.path}>
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.92 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`relative w-12 h-12 rounded-full transition-all duration-300 ${
                            isActive 
                              ? "bg-gradient-to-br from-primary to-primary/80 text-white shadow-lg shadow-primary/30 hover:shadow-primary/50" 
                              : "text-primary hover:bg-primary/15 hover:shadow-md"
                          }`}
                        >
                          <Icon className="w-7 h-7" strokeWidth={2.5} />
                          {isActive && (
                            <motion.div
                              layoutId="nav-indicator-community"
                              className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-1 bg-primary rounded-full"
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                          )}
                        </Button>
                      </motion.div>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent className="bg-foreground text-background font-semibold">
                    {t(item.nameKey)}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>


          {/* Right Actions - Larger icons, no cursor settings button outside */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Sparkles/Activity - Larger icon */}
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.92 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="hidden md:flex w-12 h-12 rounded-full text-primary hover:bg-primary/15 hover:shadow-md transition-all duration-300"
                  >
                    <Sparkles className="w-7 h-7" strokeWidth={2.5} />
                  </Button>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent className="bg-foreground text-background font-semibold">
                {t("nav.activity") || "Hoạt động"}
              </TooltipContent>
            </Tooltip>
            
            {/* Messages Dropdown */}
            {user && (
              <MessageDropdown userId={user.id} unreadCount={unreadMessageCount} />
            )}

            {/* Notifications */}
            <NotificationDropdown />
            
            <WalletConnectModal 
              open={walletModalOpen} 
              onOpenChange={setWalletModalOpen}
              onWalletConnected={(address) => setConnectedWallet(address)}
            />

            {/* User Avatar Dropdown - Larger avatar, name shows on hover */}
            <div className="hidden sm:flex items-center pl-2 sm:pl-3 border-l border-border/50">
              {user ? (
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <motion.button 
                          className="flex items-center gap-1 cursor-pointer focus:outline-none"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        >
                          <Avatar className="w-11 h-11 sm:w-12 sm:h-12 border-2 border-primary/40 ring-2 ring-primary/20 shadow-md shadow-primary/20">
                            <AvatarImage src={avatarUrl || undefined} alt="Avatar" />
                            <AvatarFallback className="bg-primary/20 text-primary font-bold">
                              <UserIcon className="w-6 h-6" />
                            </AvatarFallback>
                          </Avatar>
                        </motion.button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent className="bg-foreground text-background font-semibold">
                      {user.user_metadata?.full_name || user.email?.split('@')[0]}
                    </TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent align="end" className="w-72 bg-background border border-border shadow-lg p-2">
                    {/* User Profile Header */}
                    <DropdownMenuItem asChild className="cursor-pointer p-3 rounded-lg hover:bg-primary/10">
                      <Link to="/profile" className="flex items-center gap-3">
                        <Avatar className="w-12 h-12 border-2 border-primary/30">
                          <AvatarImage src={avatarUrl || undefined} alt="Avatar" />
                          <AvatarFallback className="bg-primary/20 text-primary font-bold">
                            <UserIcon className="w-6 h-6" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-foreground">
                            {user.user_metadata?.full_name || user.email?.split('@')[0]}
                          </p>
                          <p className="text-sm text-muted-foreground">{t("user.viewProfile")}</p>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator className="my-2" />
                    
                    {/* Wallet Connection */}
                    <DropdownMenuItem 
                      onClick={() => setWalletModalOpen(true)}
                      className="cursor-pointer p-3 rounded-lg hover:bg-primary/10"
                    >
                      <Wallet className="w-5 h-5 mr-3 text-primary" />
                      {connectedWallet ? (
                        <span className="font-medium">{t("common.walletPrefix")} {shortenAddress(connectedWallet)}</span>
                      ) : (
                        <span className="font-medium">{t("common.connectWallet")}</span>
                      )}
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator className="my-2" />
                    
                    {/* Language Toggle */}
                    <div className="p-3 rounded-lg hover:bg-primary/10 flex items-center gap-3 cursor-pointer">
                      <Globe className="w-5 h-5 text-primary" />
                      <span className="font-medium flex-1">{t("settings.language") || "Ngôn ngữ"}</span>
                      <LanguageToggle />
                    </div>
                    
                    {/* Cursor Settings */}
                    <div className="p-3 rounded-lg hover:bg-primary/10 flex items-center gap-3 cursor-pointer">
                      <MousePointer2 className="w-5 h-5 text-primary" />
                      <span className="font-medium flex-1">{t("settings.cursor") || "Con trỏ"}</span>
                      <CursorSettings />
                    </div>
                    
                    {/* Settings with Motion Toggle */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <div className="p-3 rounded-lg hover:bg-primary/10 flex items-center gap-3 cursor-pointer">
                          <Settings className="w-5 h-5 text-primary" />
                          <span className="font-medium flex-1">{t("common.settings")}</span>
                        </div>
                      </PopoverTrigger>
                      <PopoverContent align="end" className="w-72 bg-background border border-border shadow-lg">
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm">{t("common.settings")}</h4>
                          <MotionToggle />
                        </div>
                      </PopoverContent>
                    </Popover>
                    
                    <DropdownMenuSeparator className="my-2" />
                    
                    {/* Logout */}
                    <DropdownMenuItem 
                      onClick={handleLogout}
                      className="cursor-pointer p-3 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive focus:text-destructive"
                    >
                      <LogOut className="w-5 h-5 mr-3" />
                      <span className="font-medium">{t("user.logout")}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Link to="/auth">
                    <Button variant="outline" size="sm" className="text-xs sm:text-sm border-primary text-primary hover:bg-primary hover:text-white font-semibold">
                      {t("common.login")}
                    </Button>
                  </Link>
                  <Link to="/campaigns" className="hidden sm:block ml-2">
                    <Button variant="default" size="sm" className="text-xs sm:text-sm bg-primary hover:bg-primary/90 text-white font-semibold">
                      {t("common.donate")}
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
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
                <Button variant="ghost" className="w-full justify-start gap-3 h-12 text-base text-primary font-semibold">
                  <Home className="w-6 h-6" strokeWidth={2.5} />
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
                      <Button variant="ghost" className="w-full justify-start gap-3 h-12 text-base text-primary font-medium">
                        <Icon className="w-6 h-6" strokeWidth={2} />
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
                    <Button variant="ghost" className="w-full justify-start gap-3 h-12 text-base text-primary font-medium">
                      <Icon className="w-6 h-6" strokeWidth={2} />
                      {t(item.nameKey)}
                    </Button>
                  </Link>
                );
              })}

              <div className="pt-4 space-y-3 border-t border-border">
                {/* Language and Cursor on mobile */}
                <div className="flex items-center justify-between px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-primary" />
                    <span className="font-medium">{t("settings.language") || "Ngôn ngữ"}</span>
                  </div>
                  <LanguageToggle />
                </div>
                <div className="flex items-center justify-between px-3 py-2">
                  <div className="flex items-center gap-2">
                    <MousePointer2 className="w-5 h-5 text-primary" />
                    <span className="font-medium">{t("settings.cursor") || "Con trỏ"}</span>
                  </div>
                  <CursorSettings />
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full h-12 text-base border-primary text-primary font-semibold"
                  onClick={() => {
                    setWalletModalOpen(true);
                    setIsOpen(false);
                  }}
                >
                  {connectedWallet ? (
                    <>
                      <Check className="w-5 h-5 text-green-500 mr-2" />
                      {shortenAddress(connectedWallet)}
                    </>
                  ) : (
                    <>
                      <Wallet className="w-5 h-5 mr-2" />
                      {t("common.connectWallet")}
                    </>
                  )}
                </Button>
                {user ? (
                  <>
                    <Link to="/profile" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-primary/10 rounded-xl transition-colors">
                      <Avatar className="w-12 h-12 border-2 border-primary/30">
                        <AvatarImage src={avatarUrl || undefined} alt="Avatar" />
                        <AvatarFallback className="bg-primary/20 text-primary">
                          <UserIcon className="w-6 h-6" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-base font-bold text-primary">
                        {user.user_metadata?.full_name || user.email?.split('@')[0]}
                      </span>
                    </Link>
                    <Button 
                      variant="outline" 
                      className="w-full h-12 text-base border-destructive text-destructive font-semibold" 
                      onClick={() => { handleLogout(); setIsOpen(false); }}
                    >
                      <LogOut className="w-5 h-5 mr-2" />
                      {t("user.logout")}
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/auth" onClick={() => setIsOpen(false)}>
                      <Button variant="outline" className="w-full h-12 text-base border-primary text-primary font-semibold">
                        {t("common.login")}
                      </Button>
                    </Link>
                    <Link to="/campaigns" onClick={() => setIsOpen(false)}>
                      <Button className="w-full h-12 text-base bg-primary hover:bg-primary/90 text-white font-semibold">
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
