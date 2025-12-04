import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  Heart,
  Users,
  Globe,
  Droplets,
  GraduationCap,
  UtensilsCrossed,
  Home,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Shield,
  Award,
  Star,
  Target,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const donationTrend = [
  { month: "Th7", amount: 125000 },
  { month: "Th8", amount: 180000 },
  { month: "Th9", amount: 220000 },
  { month: "Th10", amount: 310000 },
  { month: "Th11", amount: 450000 },
  { month: "Th12", amount: 520000 },
];

const impactData = [
  { name: "Nước Sạch", value: 35, color: "hsl(200, 70%, 50%)" },
  { name: "Giáo Dục", value: 25, color: "hsl(280, 70%, 50%)" },
  { name: "Lương Thực", value: 20, color: "hsl(16, 85%, 58%)" },
  { name: "Y Tế", value: 12, color: "hsl(174, 62%, 38%)" },
  { name: "Khác", value: 8, color: "hsl(220, 10%, 60%)" },
];

const topDonors = [
  { name: "Sarah N.", total: 15000, campaigns: 23, badge: "Kim Cương", avatar: "S" },
  { name: "Quỹ Tech4Good", total: 12500, campaigns: 5, badge: "Anh Hùng DN", avatar: "T" },
  { name: "Ẩn Danh", total: 10000, campaigns: 45, badge: "Bạch Kim", avatar: "A" },
  { name: "Minh D.", total: 8500, campaigns: 12, badge: "Vàng", avatar: "M" },
  { name: "Lan L.", total: 7200, campaigns: 31, badge: "Vàng", avatar: "L" },
];

const recentActivity = [
  { type: "donation", user: "Sarah N.", amount: 500, campaign: "Nước Sạch Việt Nam", time: "2 phút trước" },
  { type: "milestone", campaign: "Giáo Dục Ấn Độ", milestone: "đạt 75%", time: "15 phút trước" },
  { type: "donation", user: "Ẩn Danh", amount: 1000, campaign: "Cứu Trợ Kenya", time: "32 phút trước" },
  { type: "campaign", campaign: "Vật Tư Y Tế Philippines", status: "vừa ra mắt", time: "1 giờ trước" },
  { type: "donation", user: "Tech4Good", amount: 2500, campaign: "Nhà Ở Brazil", time: "2 giờ trước" },
];

const Dashboard = () => {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <Badge variant="accent" className="mb-3">
              <Activity className="w-3.5 h-3.5 mr-1" />
              Tổng Quan Trực Tiếp
            </Badge>
            <h1 className="font-display text-4xl font-bold mb-2">
              Bảng Điều Khiển <span className="gradient-text">Tác Động</span>
            </h1>
            <p className="text-muted-foreground">
              Minh bạch real-time về tác động từ thiện toàn cầu
            </p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              {
                label: "Tổng Quyên Góp",
                value: "$2.4M",
                change: "+12.5%",
                trend: "up",
                icon: TrendingUp,
                color: "text-primary",
              },
              {
                label: "Chiến Dịch Hoạt Động",
                value: "142",
                change: "+8",
                trend: "up",
                icon: Target,
                color: "text-secondary",
              },
              {
                label: "Tổng Nhà Hảo Tâm",
                value: "45.2K",
                change: "+2.3K",
                trend: "up",
                icon: Users,
                color: "text-success",
              },
              {
                label: "Quốc Gia Tiếp Cận",
                value: "84",
                change: "+3",
                trend: "up",
                icon: Globe,
                color: "text-accent",
              },
            ].map((metric, index) => {
              const Icon = metric.icon;
              return (
                <motion.div
                  key={metric.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-card p-5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <Icon className={`w-5 h-5 ${metric.color}`} />
                    <div
                      className={`flex items-center gap-1 text-xs font-medium ${
                        metric.trend === "up" ? "text-success" : "text-destructive"
                      }`}
                    >
                      {metric.trend === "up" ? (
                        <ArrowUpRight className="w-3 h-3" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3" />
                      )}
                      {metric.change}
                    </div>
                  </div>
                  <div className="font-display text-2xl font-bold mb-1">{metric.value}</div>
                  <div className="text-sm text-muted-foreground">{metric.label}</div>
                </motion.div>
              );
            })}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Charts */}
            <div className="lg:col-span-2 space-y-6">
              {/* Donation Trend */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-card p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-display font-semibold text-lg">Xu Hướng Quyên Góp</h3>
                    <p className="text-sm text-muted-foreground">Quyên góp hàng tháng theo thời gian</p>
                  </div>
                  <Badge variant="success">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +18% tháng này
                  </Badge>
                </div>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={donationTrend}>
                      <defs>
                        <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(16, 85%, 58%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(16, 85%, 58%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis
                        className="text-xs"
                        tickFormatter={(value) => `$${value / 1000}k`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "0.75rem",
                        }}
                        formatter={(value: number) => [`$${value.toLocaleString()}`, "Quyên góp"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="amount"
                        stroke="hsl(16, 85%, 58%)"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorAmount)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Impact by Category */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-card p-6"
              >
                <h3 className="font-display font-semibold text-lg mb-6">Tác Động Theo Danh Mục</h3>
                <div className="grid md:grid-cols-2 gap-6 items-center">
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={impactData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {impactData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-3">
                    {impactData.map((item) => (
                      <div key={item.name} className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="flex-1 text-sm">{item.name}</span>
                        <span className="font-semibold">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Live Activity */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="glass-card p-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
                  </span>
                  <h3 className="font-display font-semibold">Hoạt Động Trực Tiếp</h3>
                </div>
                <div className="space-y-4 max-h-[400px] overflow-y-auto scrollbar-hide">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          activity.type === "donation"
                            ? "bg-primary/10 text-primary"
                            : activity.type === "milestone"
                            ? "bg-success/10 text-success"
                            : "bg-secondary/10 text-secondary"
                        }`}
                      >
                        {activity.type === "donation" ? (
                          <Heart className="w-4 h-4" />
                        ) : activity.type === "milestone" ? (
                          <Target className="w-4 h-4" />
                        ) : (
                          <Star className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          {activity.type === "donation" && (
                            <>
                              <span className="font-medium">{activity.user}</span> đã quyên góp{" "}
                              <span className="text-primary font-semibold">
                                ${activity.amount}
                              </span>{" "}
                              cho {activity.campaign}
                            </>
                          )}
                          {activity.type === "milestone" && (
                            <>
                              <span className="font-medium">{activity.campaign}</span>{" "}
                              <span className="text-success font-semibold">
                                {activity.milestone}
                              </span>
                            </>
                          )}
                          {activity.type === "campaign" && (
                            <>
                              Chiến dịch mới{" "}
                              <span className="font-medium">{activity.campaign}</span>{" "}
                              {activity.status}!
                            </>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Top Donors */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="glass-card p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-semibold">Top Nhà Hảo Tâm</h3>
                  <Badge variant="accent">
                    <Award className="w-3 h-3 mr-1" />
                    Bảng Xếp Hạng
                  </Badge>
                </div>
                <div className="space-y-4">
                  {topDonors.map((donor, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="relative">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-primary-foreground ${
                            index === 0
                              ? "bg-gradient-to-br from-amber-400 to-amber-600"
                              : index === 1
                              ? "bg-gradient-to-br from-slate-300 to-slate-500"
                              : index === 2
                              ? "bg-gradient-to-br from-amber-600 to-amber-800"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {donor.avatar}
                        </div>
                        {index < 3 && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-background flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{donor.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {donor.campaigns} chiến dịch
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-sm">
                          ${donor.total.toLocaleString()}
                        </div>
                        <Badge variant="muted" className="text-xs">
                          {donor.badge}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
};

export default Dashboard;
