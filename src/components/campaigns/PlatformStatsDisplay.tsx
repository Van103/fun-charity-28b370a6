import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useCampaignApi, PlatformStats } from '@/hooks/useCampaignApi';
import { useCountAnimation } from '@/hooks/useCountAnimation';
import {
  Heart,
  Users,
  Target,
  TrendingUp,
  CheckCircle,
  Loader2,
} from 'lucide-react';

const formatLargeNumber = (num: number): string => {
  if (num >= 1000000000) {
    return `${(num / 1000000000).toFixed(1)}B`;
  }
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toLocaleString();
};

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
  color: string;
  delay?: number;
}

function StatCard({ icon, label, value, suffix = '', color, delay = 0 }: StatCardProps) {
  const animatedValue = useCountAnimation(value, 2000);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay / 1000 }}
      className="glass-card p-6 text-center"
    >
      <div
        className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-4 ${color}`}
      >
        {icon}
      </div>
      <div className="font-display text-3xl font-bold mb-1">
        {formatLargeNumber(animatedValue)}
        {suffix}
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
    </motion.div>
  );
}

interface PlatformStatsDisplayProps {
  className?: string;
}

export function PlatformStatsDisplay({ className = '' }: PlatformStatsDisplayProps) {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const { loading, getPlatformStats } = useCampaignApi();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const data = await getPlatformStats();
    if (data) {
      setStats(data);
    }
  };

  if (loading && !stats) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 ${className}`}>
      <StatCard
        icon={<Target className="w-6 h-6 text-white" />}
        label="Chiến dịch"
        value={stats.total_campaigns}
        color="bg-primary"
        delay={0}
      />
      <StatCard
        icon={<TrendingUp className="w-6 h-6 text-white" />}
        label="Đang hoạt động"
        value={stats.active_campaigns}
        color="bg-blue-500"
        delay={100}
      />
      <StatCard
        icon={<CheckCircle className="w-6 h-6 text-white" />}
        label="Hoàn thành"
        value={stats.completed_campaigns}
        color="bg-green-500"
        delay={200}
      />
      <StatCard
        icon={<Heart className="w-6 h-6 text-white" />}
        label="Đã quyên góp"
        value={stats.total_raised}
        suffix=" ₫"
        color="bg-pink-500"
        delay={300}
      />
      <StatCard
        icon={<Users className="w-6 h-6 text-white" />}
        label="Nhà hảo tâm"
        value={stats.total_donors}
        color="bg-purple-500"
        delay={400}
      />
      <StatCard
        icon={<Heart className="w-6 h-6 text-white" />}
        label="Lượt quyên góp"
        value={stats.total_donations}
        color="bg-orange-500"
        delay={500}
      />
    </div>
  );
}
