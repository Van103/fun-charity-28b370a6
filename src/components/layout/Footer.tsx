import { Link } from "react-router-dom";
import { Heart, Twitter, Github, Linkedin, Mail, Sparkles, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/Logo";
import { DivineMantrasCarousel } from "./DivineMantrasCarousel";
const footerLinks = {
  "Nền Tảng": [
    { name: "Chiến Dịch", href: "/campaigns" },
    { name: "Bản Đồ Nhu Cầu", href: "/needs-map" },
    { name: "Tổng Quan", href: "/dashboard" },
    { name: "Cách Hoạt Động", href: "/how-it-works" },
  ],
  "Cộng Đồng": [
    { name: "Dành Cho Nhà Hảo Tâm", href: "/donors" },
    { name: "Dành Cho Tình Nguyện Viên", href: "/volunteers" },
    { name: "Dành Cho Tổ Chức", href: "/ngos" },
    { name: "Bảng Xếp Hạng", href: "/leaderboard" },
  ],
  "Tài Nguyên": [
    { name: "Tài Liệu", href: "/docs" },
    { name: "Hợp Đồng Thông Minh", href: "/contracts" },
    { name: "Blog", href: "/blog" },
    { name: "Hỗ Trợ", href: "/support" },
  ],
  "Pháp Lý": [
    { name: "Chính Sách Bảo Mật", href: "/privacy" },
    { name: "Điều Khoản Sử Dụng", href: "/terms" },
    { name: "Chính Sách KYC", href: "/kyc" },
  ],
};

const socialLinks = [
  { icon: Twitter, href: "https://twitter.com" },
  { icon: Github, href: "https://github.com" },
  { icon: Linkedin, href: "https://linkedin.com" },
  { icon: Globe, href: "https://funcharity.org" },
];

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      {/* Divine Mantras Carousel */}
      <DivineMantrasCarousel />
      
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          {/* Brand */}
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <Logo size="md" />
            </Link>
            <p className="text-primary-foreground/70 text-sm mb-4 max-w-xs">
              Từ thiện là ánh sáng. Minh bạch là vàng.
            </p>
            <p className="text-primary-foreground/60 text-xs mb-4 max-w-xs">
              FUN Charity – Nơi lòng tốt trở nên minh bạch – kết nối – và bất tử hóa bằng blockchain.
            </p>
            <div className="flex gap-2">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a key={social.href} href={social.href} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-primary-foreground/70 hover:text-secondary hover:bg-primary-light">
                      <Icon className="w-4 h-4" />
                    </Button>
                  </a>
                );
              })}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-display font-semibold text-secondary mb-4">{category}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-sm text-primary-foreground/70 hover:text-secondary transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-primary-light/30 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-primary-foreground/60">
            © 2024 FUN Charity. Bản quyền thuộc về FUN Charity. Được xây dựng với{" "}
            <Heart className="inline w-3 h-3 text-secondary" fill="currentColor" /> Web3.
          </p>
          <div className="flex items-center gap-2 text-sm text-primary-foreground/60">
            <Sparkles className="w-4 h-4 text-secondary" />
            <span>100% Minh Bạch • Xác Minh On-Chain • Quản Trị Cộng Đồng</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
