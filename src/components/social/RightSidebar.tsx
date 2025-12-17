import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Users,
  Cake,
  MessageCircle,
  Plus,
} from "lucide-react";

interface TopRanker {
  rank: number;
  name: string;
  amount: string;
  avatar?: string;
  verified?: boolean;
}

const topRankers: TopRanker[] = [
  { rank: 1, name: "Camly Duong", amount: "8B ₫", verified: true },
  { rank: 2, name: "Elon Musk", amount: "7B ₫" },
  { rank: 3, name: "Lê Minh Trí", amount: "2B ₫", verified: true },
  { rank: 4, name: "Diệu Ngọc", amount: "1B ₫" },
  { rank: 5, name: "Vinh Hào", amount: "500M ₫" },
  { rank: 6, name: "Trang Huyền", amount: "300M ₫" },
  { rank: 7, name: "Tinna Tinh", amount: "100M ₫" },
  { rank: 8, name: "Khôi Phan", amount: "50M ₫" },
  { rank: 9, name: "Thu Thanh Hoàng", amount: "30M ₫", verified: true },
  { rank: 10, name: "Nông Liên", amount: "10M ₫", verified: true },
];

// Rank badge colors
const getRankBadgeStyle = (rank: number) => {
  switch (rank) {
    case 1: return "bg-gradient-to-br from-yellow-300 via-gold-champagne to-yellow-500 text-white glow-gold";
    case 2: return "bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400 text-gray-800 glow-silver";
    case 3: return "bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white glow-bronze";
    default: return "bg-muted text-foreground";
  }
};

// Avatar gradient colors
const getAvatarGradient = (name: string) => {
  const gradients = [
    "from-purple-soft to-purple-light",
    "from-gold-champagne to-gold-light",
    "from-pink-400 to-rose-300",
    "from-sky-400 to-blue-300",
    "from-emerald-400 to-teal-300",
  ];
  const index = (name?.charCodeAt(0) || 0) % gradients.length;
  return gradients[index];
};

const contacts = [
  "Lê Minh Trí",
  "Lê Huỳnh Như",
  "Diệu Ngọc",
  "Vinh Hào",
  "Mỹ Phương",
];

interface HonorStat {
  label: string;
  value: string;
}

const honorStats: HonorStat[] = [
  { label: "Total USDT Donations", value: "5M" },
  { label: "Total Camly Donations", value: "10M" },
  { label: "Total VND", value: "500M" },
  { label: "Total Donations", value: "1.2K" },
  { label: "Total Donors", value: "5.7K" },
];

export function RightSidebar() {
  return (
    <aside className="w-80 shrink-0 space-y-4 sticky top-20">
      {/* Honor Board */}
      <div className="rounded-2xl overflow-hidden relative" style={{ backgroundImage: 'url(/images/purple-light-bg.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0 bg-purple-900/20 backdrop-blur-[1px]" />
        <div className="relative border-b border-yellow-400/30">
          <h3 className="py-3 px-2 font-extrabold text-center tracking-widest drop-shadow-lg w-full bg-gradient-to-r from-purple-900/70 via-purple-800/80 to-purple-900/70" style={{ color: '#FFD700', fontSize: '22px' }}>
            <span className="animate-sparkle inline-block">✨</span> HONOR BOARD <span className="animate-sparkle-delay inline-block">✨</span>
          </h3>
        </div>
        <div className="relative p-3 space-y-3">
          {honorStats.map((stat) => (
            <div 
              key={stat.label} 
              className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-white/95 transition-colors"
              style={{ 
                boxShadow: '0 0 12px 2px rgba(255, 215, 0, 0.5), 0 0 4px 1px rgba(255, 215, 0, 0.3)',
                border: '2px solid rgba(255, 215, 0, 0.6)'
              }}
            >
              <span className="font-bold whitespace-nowrap" style={{ color: '#4C1D95', fontSize: '16px' }}>{stat.label}</span>
              <span className="font-bold whitespace-nowrap" style={{ color: '#4C1D95', fontSize: '16px' }}>
                {stat.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Ranking */}
      <div className="rounded-2xl overflow-hidden relative" style={{ backgroundImage: 'url(/images/purple-light-bg.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0 bg-purple-900/20 backdrop-blur-[1px]" />
        <div className="relative border-b border-yellow-400/30">
          <h3 className="py-3 px-2 font-extrabold text-center tracking-widest drop-shadow-lg w-full bg-gradient-to-r from-purple-900/70 via-purple-800/80 to-purple-900/70" style={{ color: '#FFD700', fontSize: '22px' }}>
            <span className="animate-sparkle inline-block">👑</span> TOP RANKING <span className="animate-sparkle-delay inline-block">👑</span>
          </h3>
        </div>
        <ScrollArea className="h-[360px]">
          <div className="relative p-3 space-y-2.5">
            {topRankers.map((ranker) => (
              <div
                key={ranker.rank}
                className="flex items-center gap-2 px-3 py-3 rounded-xl bg-white/95 cursor-pointer mb-1.5 transition-colors"
                style={{ 
                  boxShadow: '0 0 12px 2px rgba(255, 215, 0, 0.5), 0 0 4px 1px rgba(255, 215, 0, 0.3)',
                  border: '2px solid rgba(255, 215, 0, 0.6)'
                }}
              >
                {/* Rank badge with avatar */}
                <div className="relative">
                  <div className="p-0.5 rounded-full bg-gradient-to-br from-yellow-400/60 to-yellow-500/30">
                    <Avatar className="w-10 h-10 border-2 border-yellow-400/40">
                      <AvatarImage src={ranker.avatar} />
                      <AvatarFallback className={`bg-gradient-to-br ${getAvatarGradient(ranker.name)} text-white font-medium`} style={{ fontSize: '16px' }}>
                        {ranker.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className={`absolute -bottom-1 -left-1 w-6 h-6 rounded-full flex items-center justify-center font-bold shadow-md ${getRankBadgeStyle(ranker.rank)}`} style={{ fontSize: '11px' }}>
                    #{ranker.rank}
                  </div>
                </div>
                <div className="flex-1 min-w-0 ml-1">
                  <div className="flex items-center gap-1">
                    <span className="font-bold truncate" style={{ color: '#4C1D95', fontSize: '16px' }}>{ranker.name}</span>
                    {ranker.verified && (
                      <span style={{ color: '#4C1D95', fontSize: '12px' }}>✓</span>
                    )}
                  </div>
                </div>
                <span className="font-bold shrink-0 whitespace-nowrap" style={{ color: '#4C1D95', fontSize: '16px' }}>
                  {ranker.amount}
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Birthdays */}
      <div className="glass-card p-4 hover-luxury-glow">
        <div className="flex items-center gap-2 mb-3">
          <Cake className="w-4 h-4 text-gold-champagne" />
          <h3 className="text-sm font-semibold text-foreground">Birthdays</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Today is the birthday of <span className="font-medium text-foreground">Nhật Thống</span> and{" "}
          <span className="text-primary cursor-pointer hover:underline">6 others</span>
        </p>
      </div>

      {/* Contacts */}
      <div className="glass-card p-4 hover-luxury-glow">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Contacts</h3>
        </div>
        <div className="space-y-1">
          {contacts.map((name, index) => (
            <div 
              key={name}
              className="flex items-center gap-3 p-2 -mx-2 rounded-xl hover:bg-muted/50 cursor-pointer transition-colors"
            >
              <div className="p-0.5 rounded-full bg-gradient-to-br from-gold-champagne/30 to-transparent">
                <Avatar className="w-8 h-8 border border-border">
                  <AvatarFallback className={`bg-gradient-to-br ${getAvatarGradient(name)} text-white text-xs`}>
                    {name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <span className="text-sm text-foreground">{name}</span>
              <div className="ml-auto w-2 h-2 rounded-full bg-success" />
            </div>
          ))}
        </div>
      </div>

      {/* Group Chats */}
      <div className="glass-card p-4 hover-luxury-glow">
        <div className="flex items-center gap-2 mb-3">
          <MessageCircle className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Group Chats</h3>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-3 p-2 -mx-2 rounded-xl hover:bg-muted/50 cursor-pointer transition-colors">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-gradient-to-br from-purple-soft to-purple-light text-white text-xs">M</AvatarFallback>
            </Avatar>
            <span className="text-sm text-foreground">Mother Earth Service Group</span>
          </div>
          <button className="flex items-center gap-3 p-2 -mx-2 rounded-xl hover:bg-muted/50 w-full text-left transition-colors">
            <div className="w-8 h-8 rounded-full border-2 border-dashed border-muted-foreground/50 flex items-center justify-center">
              <Plus className="w-4 h-4 text-muted-foreground" />
            </div>
            <span className="text-sm text-muted-foreground">Add new group</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
