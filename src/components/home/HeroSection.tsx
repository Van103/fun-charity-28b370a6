import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/brand/Logo";
import {
  ArrowRight,
  Heart,
  Users,
  Shield,
  Sparkles,
  TrendingUp,
  Globe,
  Wallet,
  Link as LinkIcon,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";

const stats = [
  { label: "Đã Quyên Góp", value: "$2.4M+", icon: TrendingUp },
  { label: "Chiến Dịch", value: "1,200+", icon: Heart },
  { label: "Nhà Hảo Tâm", value: "45K+", icon: Users },
  { label: "Quốc Gia", value: "80+", icon: Globe },
];

const pillars = [
  {
    icon: Zap,
    title: "Kết Nối Realtime",
    description: "Ghép nối nhu cầu - nguồn lực tức thì với smart matching engine",
  },
  {
    icon: Users,
    title: "Mạng Xã Hội Từ Thiện",
    description: "Feed cập nhật, chia sẻ tiến độ, tương tác cộng đồng",
  },
  {
    icon: LinkIcon,
    title: "100% Minh Bạch Blockchain",
    description: "Mọi giao dịch được ghi nhận on-chain, có thể kiểm chứng",
  },
];

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Video Background */}
      <div className="absolute inset-0">
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
          <source src="/videos/logo-video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-primary/85" />
      </div>
      
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(43_55%_52%_/_0.15),_transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_hsl(275_60%_30%_/_0.3),_transparent_50%)]" />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-primary-light/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: "1s" }} />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(201,162,61,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(201,162,61,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex justify-center mb-8">
            <Logo size="xl" showText={false} />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
            <Badge variant="gold" className="mb-6 px-4 py-1.5">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Cách Mạng Từ Thiện Web3
            </Badge>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="font-display text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight text-primary-foreground">
            <span className="gradient-text-luxury">FUN</span> Charity
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="text-lg md:text-xl text-primary-foreground/80 mb-4 max-w-3xl mx-auto italic">
            "Nơi lòng tốt trở nên minh bạch – kết nối – và bất tử hóa bằng blockchain."
          </motion.p>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.35 }} className="text-lg md:text-xl slogan-glow mb-8">
            ✨ Từ thiện là ánh sáng. Minh bạch là vàng. ✨
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link to="/campaigns">
              <Button variant="hero" size="xl" className="group glossy-btn glossy-btn-gradient">
                <Heart className="w-5 h-5" fill="currentColor" />
                Quyên Góp Ngay
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Button variant="wallet" size="xl" className="group glossy-btn glossy-btn-purple">
              <Wallet className="w-5 h-5" />
              Kết Nối Ví
            </Button>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }} className="grid md:grid-cols-3 gap-4 mb-12">
            {pillars.map((pillar, index) => {
              const Icon = pillar.icon;
              return (
                <motion.div key={pillar.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }} className="bg-primary-foreground/10 backdrop-blur-sm border border-secondary/20 rounded-2xl p-6 text-left hover:border-secondary/40 transition-colors">
                  <Icon className="w-8 h-8 text-secondary mb-3" />
                  <h3 className="font-display font-semibold text-primary-foreground mb-2">{pillar.title}</h3>
                  <p className="text-sm text-primary-foreground/70">{pillar.description}</p>
                </motion.div>
              );
            })}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.8 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div key={stat.label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3, delay: 0.9 + index * 0.1 }} className="bg-primary-foreground/5 backdrop-blur-sm border border-secondary/10 rounded-xl p-4 text-center">
                  <Icon className="w-5 h-5 text-secondary mx-auto mb-2" />
                  <div className="font-display text-2xl font-bold text-secondary mb-1">{stat.value}</div>
                  <div className="text-xs text-primary-foreground/60">{stat.label}</div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 0.5 }} className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="w-6 h-10 rounded-full border-2 border-secondary/50 flex items-start justify-center p-2">
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-1.5 h-1.5 rounded-full bg-secondary" />
        </div>
      </motion.div>
    </section>
  );
}
