import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Heart, Users, Globe, Droplets, GraduationCap, UtensilsCrossed, Home, ExternalLink } from "lucide-react";

const impactCategories = [
  { icon: Droplets, title: "Nước Sạch", value: "125K+", description: "Người được tiếp cận nước sạch", color: "text-blue-500", bgColor: "bg-blue-500/10" },
  { icon: GraduationCap, title: "Giáo Dục", value: "48K+", description: "Học sinh được hỗ trợ", color: "text-purple-500", bgColor: "bg-purple-500/10" },
  { icon: UtensilsCrossed, title: "An Ninh Lương Thực", value: "890K+", description: "Bữa ăn được cung cấp", color: "text-secondary", bgColor: "bg-secondary/10" },
  { icon: Home, title: "Nhà Ở", value: "12K+", description: "Gia đình có mái ấm", color: "text-primary", bgColor: "bg-primary/10" },
];

const recentTransactions = [
  { donor: "0x1a2b...3c4d", amount: "$500", campaign: "Nước Sạch Việt Nam", time: "2 phút trước", hash: "0xabc..." },
  { donor: "sarah.eth", amount: "0.5 ETH", campaign: "Giáo Dục Ấn Độ", time: "5 phút trước", hash: "0xdef..." },
  { donor: "0x5e6f...7g8h", amount: "$1,000", campaign: "Cứu Trợ Kenya", time: "8 phút trước", hash: "0xghi..." },
];

export function ImpactStats() {
  return (
    <section className="py-24 relative overflow-hidden bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_hsl(43_55%_52%_/_0.05),_transparent_70%)]" />
      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-16">
          <Badge variant="gold" className="mb-4"><TrendingUp className="w-3.5 h-3.5 mr-1" />Tác Động Thực Sự</Badge>
          <h2 className="font-display text-4xl font-bold mb-4">Cùng Nhau, Chúng Ta Đã Tạo <span className="gradient-text">Sự Khác Biệt</span></h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">Mọi khoản quyên góp đều đóng góp vào tác động có thể đo lường. Theo dõi tất cả trên blockchain.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {impactCategories.map((category, index) => {
            const Icon = category.icon;
            return (
              <motion.div key={category.title} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.1 }} className="glass-card p-6 text-center group hover:shadow-lg transition-shadow luxury-border">
                <div className={`w-14 h-14 rounded-2xl ${category.bgColor} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}><Icon className={`w-7 h-7 ${category.color}`} /></div>
                <div className="font-display text-3xl font-bold gradient-text mb-1">{category.value}</div>
                <div className="font-medium text-foreground mb-1">{category.title}</div>
                <div className="text-sm text-muted-foreground">{category.description}</div>
              </motion.div>
            );
          })}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass-card p-6 max-w-3xl mx-auto luxury-border">
          <div className="flex items-center gap-2 mb-4">
            <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-success"></span></span>
            <span className="font-medium">Hoạt Động Blockchain Trực Tiếp</span>
            <Badge variant="blockchain" className="ml-auto text-xs">Đã Xác Minh On-Chain</Badge>
          </div>
          <div className="space-y-3">
            {recentTransactions.map((tx, index) => (
              <motion.div key={index} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.2 }} className="flex items-center gap-3 text-sm p-3 bg-muted/50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center"><Heart className="w-4 h-4 text-primary-foreground" fill="currentColor" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2"><span className="font-mono text-xs text-muted-foreground">{tx.donor}</span><span className="text-muted-foreground">đã quyên góp</span><span className="font-semibold text-secondary">{tx.amount}</span></div>
                  <span className="text-muted-foreground">cho <span className="text-foreground">{tx.campaign}</span></span>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground hover:text-secondary cursor-pointer"><span className="font-mono">{tx.hash}</span><ExternalLink className="w-3 h-3" /></div>
                  <span className="text-xs text-muted-foreground">{tx.time}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
