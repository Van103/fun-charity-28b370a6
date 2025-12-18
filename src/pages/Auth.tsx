import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { signupSchema, loginSchema } from "@/lib/validation";
import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator";
import {
  Heart,
  Users,
  Building2,
  Mail,
  Lock,
  User,
  Wallet,
  ArrowRight,
  Shield,
  Sparkles,
  Loader2,
} from "lucide-react";

const Auth = () => {
  const [activeTab, setActiveTab] = useState("login");
  const [userType, setUserType] = useState<"donor" | "volunteer" | "ngo">("donor");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check if user is already logged in
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        navigate("/social");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate("/social");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input with zod
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      toast({
        title: "Lỗi xác thực",
        description: result.error.errors[0]?.message || 'Dữ liệu không hợp lệ',
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email: result.data.email.trim(),
      password: result.data.password,
    });

    setLoading(false);

    if (error) {
      let errorMessage = "Đã xảy ra lỗi khi đăng nhập";
      if (error.message.includes("Invalid login credentials")) {
        errorMessage = "Email hoặc mật khẩu không chính xác";
      } else if (error.message.includes("Email not confirmed")) {
        errorMessage = "Vui lòng xác nhận email của bạn trước khi đăng nhập";
      }
      toast({
        title: "Đăng nhập thất bại",
        description: errorMessage,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Đăng nhập thành công",
      description: "Chào mừng bạn trở lại FUN Charity!",
    });
    navigate("/social");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input with zod
    const result = signupSchema.safeParse({ email, password, fullName });
    if (!result.success) {
      toast({
        title: "Lỗi xác thực",
        description: result.error.errors[0]?.message || 'Dữ liệu không hợp lệ',
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email: result.data.email.trim(),
      password: result.data.password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: result.data.fullName,
          role: userType,
        },
      },
    });

    setLoading(false);

    if (error) {
      let errorMessage = "Đã xảy ra lỗi khi đăng ký";
      if (error.message.includes("User already registered")) {
        errorMessage = "Email này đã được sử dụng. Vui lòng đăng nhập hoặc sử dụng email khác.";
      } else if (error.message.includes("Password")) {
        errorMessage = "Mật khẩu không hợp lệ. Vui lòng sử dụng mật khẩu mạnh hơn.";
      }
      toast({
        title: "Đăng ký thất bại",
        description: errorMessage,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Đăng ký thành công!",
      description: "Tài khoản của bạn đã được tạo. Chào mừng đến với FUN Charity!",
    });
    navigate("/social");
  };

  return (
    <main className="min-h-screen bg-primary relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(43_55%_52%_/_0.15),_transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_hsl(275_60%_30%_/_0.3),_transparent_50%)]" />

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link to="/">
            <Logo size="md" />
          </Link>
          <Link to="/">
            <Button variant="ghost" className="text-primary-foreground hover:bg-primary-light">
              <ArrowRight className="w-4 h-4 rotate-180 mr-2" />
              Về Trang Chủ
            </Button>
          </Link>
        </div>

        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8 backdrop-blur-xl bg-card/95 luxury-border"
          >
            {/* Title */}
            <div className="text-center mb-6">
              <Badge variant="gold" className="mb-4">
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                Tham Gia FUN Charity
              </Badge>
              <h1 className="font-display text-2xl font-bold mb-2">
                {activeTab === "login" ? "Chào Mừng Trở Lại" : "Tạo Tài Khoản"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {activeTab === "login"
                  ? "Đăng nhập để tiếp tục hành trình tạo tác động"
                  : "Bắt đầu tạo sự khác biệt minh bạch ngay hôm nay"}
              </p>
            </div>

            {/* User Type Selection (for signup) */}
            {activeTab === "signup" && (
              <div className="mb-6">
                <Label className="text-sm text-muted-foreground mb-3 block">
                  Tôi muốn tham gia với vai trò
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { type: "donor", icon: Heart, label: "Nhà Hảo Tâm" },
                    { type: "volunteer", icon: Users, label: "Tình Nguyện" },
                    { type: "ngo", icon: Building2, label: "Tổ Chức" },
                  ].map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.type}
                        type="button"
                        onClick={() => setUserType(option.type as typeof userType)}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          userType === option.type
                            ? "border-secondary bg-secondary/10"
                            : "border-border hover:border-secondary/50"
                        }`}
                      >
                        <Icon
                          className={`w-5 h-5 mx-auto mb-1 ${
                            userType === option.type ? "text-secondary" : "text-muted-foreground"
                          }`}
                        />
                        <span
                          className={`text-xs ${
                            userType === option.type ? "text-secondary font-medium" : "text-muted-foreground"
                          }`}
                        >
                          {option.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Auth Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full mb-6 bg-muted/50">
                <TabsTrigger value="login" className="flex-1">
                  Đăng Nhập
                </TabsTrigger>
                <TabsTrigger value="signup" className="flex-1">
                  Đăng Ký
                </TabsTrigger>
              </TabsList>

              {/* Login Form */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="email@example.com"
                        className="pl-10"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="password">Mật Khẩu</Label>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <Button variant="hero" className="w-full" type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        Đăng Nhập
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Signup Form */}
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div>
                    <Label htmlFor="name">
                      {userType === "ngo" ? "Tên Tổ Chức" : "Họ và Tên"}
                    </Label>
                    <div className="relative mt-1">
                      {userType === "ngo" ? (
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      ) : (
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      )}
                      <Input
                        id="name"
                        placeholder={userType === "ngo" ? "Tên tổ chức" : "Họ và tên của bạn"}
                        className="pl-10"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="email@example.com"
                        className="pl-10"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="signup-password">Mật Khẩu</Label>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                    <PasswordStrengthIndicator password={password} />
                  </div>

                  {userType === "ngo" && (
                    <div className="bg-muted/50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-4 h-4 text-secondary" />
                        <span className="text-sm font-medium">Yêu Cầu KYC</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Các tổ chức NGO cần hoàn thành xác minh KYC để khởi chạy chiến dịch. Bạn sẽ được hướng dẫn sau khi đăng ký.
                      </p>
                    </div>
                  )}

                  <Button variant="hero" className="w-full" type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        Tạo Tài Khoản
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Hoặc tiếp tục với</span>
              </div>
            </div>

            {/* Wallet Connect */}
            <Button variant="wallet" className="w-full">
              <Wallet className="w-4 h-4" />
              Kết Nối Ví
            </Button>

            <p className="text-xs text-center text-muted-foreground mt-4">
              Hỗ trợ MetaMask, WalletConnect và nhiều ví khác
            </p>
          </motion.div>

          {/* Footer Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center mt-6 text-primary-foreground/60 text-sm"
          >
            <p>Từ thiện là ánh sáng. Minh bạch là vàng.</p>
          </motion.div>
        </div>
      </div>
    </main>
  );
};

export default Auth;
