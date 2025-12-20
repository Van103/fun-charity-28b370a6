import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Heart, ArrowRight, Building2, Users, Sparkles, Crown, Wallet } from "lucide-react";
import { Link } from "react-router-dom";

const roles = [
  {
    icon: Heart,
    title: "Dành Cho Nhà Hảo Tâm",
    description: "Quyên góp với sự tin tưởng. Theo dõi tác động. Nhận uy tín & huy hiệu.",
    cta: "Bắt Đầu Quyên Góp",
    href: "/campaigns",
    gradient: "from-secondary to-secondary-light",
  },
  {
    icon: Users,
    title: "Dành Cho Tình Nguyện Viên",
    description: "Tìm cơ hội. Xây dựng kỹ năng. Tạo tác động thực sự trong cộng đồng.",
    cta: "Tham Gia Tình Nguyện",
    href: "/auth",
    gradient: "from-primary to-primary-light",
  },
  {
    icon: Building2,
    title: "Dành Cho Tổ Chức",
    description: "Khởi chạy chiến dịch. Xây dựng niềm tin với cộng đồng. Mở rộng tác động.",
    cta: "Đăng Ký Tổ Chức",
    href: "/auth",
    gradient: "from-success to-secondary",
  },
];

export function CTASection() {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Role Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-24">
          {roles.map((role, index) => {
            const Icon = role.icon;
            return (
              <motion.div
                key={role.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link to={role.href}>
                  <div className="glass-card-hover p-8 h-full group luxury-border">
                    <div
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${role.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg`}
                    >
                      <Icon className="w-7 h-7 text-primary-foreground" />
                    </div>
                    <h3 className="font-display text-xl font-semibold mb-2">
                      {role.title}
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      {role.description}
                    </p>
                    <Button variant="outline" className="group/btn hover-glossy">
                      {role.cta}
                      <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                    </Button>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Main CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-3xl overflow-hidden"
        >
          {/* Background */}
          <div className="absolute inset-0 bg-primary" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(43_55%_52%_/_0.2),_transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_hsl(275_60%_30%_/_0.3),_transparent_50%)]" />

          {/* Content */}
          <div className="relative px-8 py-16 md:px-16 md:py-24 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-secondary/20 flex items-center justify-center crown-glow">
                <Crown className="w-8 h-8 text-secondary" />
              </div>
            </div>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-primary-foreground mb-4">
              Sẵn Sàng Tạo <span className="text-secondary">Sự Khác Biệt</span>?
            </h2>
            <p className="text-primary-foreground/80 text-lg mb-4 max-w-2xl mx-auto">
              Tham gia cùng hàng nghìn nhà hảo tâm, tình nguyện viên và tổ chức tạo nên tác động minh bạch, bền vững thông qua công nghệ Web3.
            </p>
            <p className="text-secondary font-medium mb-8">
              Từ thiện là ánh sáng. Minh bạch là vàng.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/campaigns">
                <Button variant="hero" size="xl" className="glossy-btn glossy-btn-gradient">
                  <Heart className="w-5 h-5" fill="currentColor" />
                  Duyệt Chiến Dịch
                </Button>
              </Link>
              <Button variant="wallet" size="xl" className="glossy-btn glossy-btn-purple">
                <Wallet className="w-5 h-5" />
                Kết Nối Ví
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
