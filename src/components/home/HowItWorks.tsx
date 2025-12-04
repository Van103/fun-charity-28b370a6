import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Heart,
  Shield,
  Trophy,
  ArrowRight,
  Sparkles,
  Wallet,
  Link as LinkIcon,
} from "lucide-react";

const steps = [
  {
    icon: Wallet,
    title: "Kết Nối & Khám Phá",
    description:
      "Kết nối ví hoặc đăng ký email. Khám phá các chiến dịch đã được xác minh và Bản Đồ Nhu Cầu để tìm cause phù hợp.",
    color: "text-secondary",
    bgColor: "bg-secondary/10",
  },
  {
    icon: Heart,
    title: "Quyên Góp Tin Tưởng",
    description:
      "Quyên góp bằng tiền mặt hoặc crypto. Mọi giao dịch được ghi nhận on-chain minh bạch 100%.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: LinkIcon,
    title: "Theo Dõi On-Chain",
    description:
      "Theo dõi real-time từng đồng quyên góp đi đâu, chi tiêu như nào. Có hash, có bằng chứng, có tin tưởng.",
    color: "text-success",
    bgColor: "bg-success/10",
  },
  {
    icon: Trophy,
    title: "Nhận Thưởng & Phát Triển",
    description:
      "Xây dựng Uy Tín, nhận huy hiệu, token FUN. Đóng góp nhiều = uy tín cao = được cộng đồng tin tưởng.",
    color: "text-secondary",
    bgColor: "bg-secondary/10",
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="purple" className="mb-4">
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            Đơn Giản & Minh Bạch
          </Badge>
          <h2 className="font-display text-4xl font-bold mb-4">
            Cách <span className="gradient-text">FUN</span> Hoạt Động
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Từ khám phá đến theo dõi tác động – mọi thứ đều minh bạch, đơn giản và có phần thưởng.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative"
              >
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-1/2 w-full">
                    <ArrowRight className="w-6 h-6 text-secondary/30 absolute -right-3" />
                  </div>
                )}

                <div className="glass-card p-6 text-center h-full luxury-border">
                  {/* Step Number */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full gradient-bg-gold text-xs font-bold text-secondary-foreground">
                      {index + 1}
                    </span>
                  </div>

                  {/* Icon */}
                  <div
                    className={`w-16 h-16 rounded-2xl ${step.bgColor} flex items-center justify-center mx-auto mb-4`}
                  >
                    <Icon className={`w-8 h-8 ${step.color}`} />
                  </div>

                  <h3 className="font-display font-semibold text-lg mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
