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
import { SearchBar } from "./SearchBar";
import { LanguageToggle } from "./LanguageToggle";
import { useFriendRequestNotifications } from "@/hooks/useFriendNotifications";
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
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const platformItems = [
  { name: "Chiến Dịch", path: "/campaigns", icon: Newspaper },
  { name: "Bản Đồ Nhu Cầu", path: "/needs-map", icon: MapPin },
  { name: "Tổng Quan", path: "/dashboard", icon: LayoutDashboard },
  { name: "Đánh Giá", path: "/reviews", icon: Star },
];

const navItems = [
  { name: "Hồ Sơ", path: "/profiles", icon: Users },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Enable realtime friend request notifications
  useFriendRequestNotifications(user?.id || null);

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
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo + Home + Search */}
          <div className="flex items-center gap-2">
            <Link to="/social" className="flex items-center gap-2 group">
              <Logo size="md" />
            </Link>
            
            <SearchBar />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {/* Platform Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 text-foreground hover:text-primary hover:bg-primary/10">
                  <Layers className="w-4 h-4" />
                  Nền Tảng
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
                        {item.name}
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
                    {item.name}
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* Right Actions */}
          <div className="hidden md:flex items-center gap-2">
            <LanguageToggle />
            <NotificationDropdown />

            {/* Settings Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="text-foreground hover:text-primary hover:bg-primary/10">
                  <Settings className="w-5 h-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Cài đặt giao diện</h4>
                  <MotionToggle />
                </div>
              </PopoverContent>
            </Popover>
            
            <WalletConnectModal 
              open={walletModalOpen} 
              onOpenChange={setWalletModalOpen}
              onWalletConnected={(address) => setConnectedWallet(address)}
            />

            <div className="flex items-center gap-2 pl-3 border-l border-border/50">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 text-sm hover:opacity-80 transition-opacity cursor-pointer focus:outline-none">
                      <Avatar className="w-8 h-8 border-2 border-secondary/70 ring-2 ring-primary/20">
                        <AvatarImage src={avatarUrl || undefined} alt="Avatar" />
                        <AvatarFallback className="bg-secondary/30">
                          <UserIcon className="w-4 h-4 text-secondary" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-bold max-w-[120px] truncate bg-gradient-to-r from-purple-dark via-primary to-secondary bg-clip-text text-transparent">
                        {user.user_metadata?.full_name || user.email?.split('@')[0]}
                      </span>
                      <ChevronDown className="w-3 h-3 text-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="flex items-center gap-2 cursor-pointer">
                        <UserIcon className="w-4 h-4" />
                        Hồ sơ cá nhân
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setWalletModalOpen(true)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Wallet className="w-4 h-4" />
                      {connectedWallet ? (
                        <span>Ví: {shortenAddress(connectedWallet)}</span>
                      ) : (
                        <span>Kết nối ví</span>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={handleLogout}
                      className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
                    >
                      <LogOut className="w-4 h-4" />
                      Đăng xuất
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
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
                </>
              )}
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
              <Link to="/social" onClick={() => setIsOpen(false)}>
                <Button variant="ghost" className="w-full justify-start gap-3">
                  <Home className="w-5 h-5" />
                  Trang Chủ
                </Button>
              </Link>
              
              {/* Platform items */}
              <div className="py-2">
                <p className="px-3 text-xs font-semibold text-muted-foreground mb-1">Nền Tảng</p>
                {platformItems.map((item) => {
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
              </div>

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
                <Button 
                  variant="wallet" 
                  className="w-full"
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
                      Kết Nối Ví
                    </>
                  )}
                </Button>
                {user ? (
                  <>
                    <Link to="/profile" onClick={() => setIsOpen(false)} className="flex items-center gap-2 px-4 py-2 hover:bg-muted rounded-md transition-colors">
                      <Avatar className="w-8 h-8 border-2 border-secondary/50">
                        <AvatarImage src={avatarUrl || undefined} alt="Avatar" />
                        <AvatarFallback className="bg-secondary/20">
                          <UserIcon className="w-4 h-4 text-secondary" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="navbar-username text-sm truncate font-semibold">
                        {user.user_metadata?.full_name || user.email?.split('@')[0]}
                      </span>
                    </Link>
                    <Button variant="outline" className="w-full" onClick={() => { handleLogout(); setIsOpen(false); }}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Đăng Xuất
                    </Button>
                  </>
                ) : (
                  <>
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
