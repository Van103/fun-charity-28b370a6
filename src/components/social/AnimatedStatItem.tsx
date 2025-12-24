import { useCountAnimation } from "@/hooks/useCountAnimation";
import { useLanguage } from "@/contexts/LanguageContext";

interface AnimatedStatItemProps {
  labelKey: string;
  value: number;
  isCurrency?: boolean;
}

// Format number for display
const formatNumber = (num: number): string => {
  if (num >= 1000000000) {
    return `${(num / 1000000000).toFixed(1)}B`;
  }
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

// Format currency for display
const formatCurrency = (amount: number): string => {
  if (amount >= 1000000000) {
    return `${(amount / 1000000000).toFixed(1)}B ₫`;
  }
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M ₫`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}K ₫`;
  }
  return `${amount} ₫`;
};

export function AnimatedStatItem({ labelKey, value, isCurrency = false }: AnimatedStatItemProps) {
  const { t } = useLanguage();
  const animatedValue = useCountAnimation(value, 800);

  return (
    <div 
      className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-white/95 transition-all duration-300 hover:scale-[1.02]"
      style={{ 
        boxShadow: '0 0 12px 2px rgba(255, 215, 0, 0.5), 0 0 4px 1px rgba(255, 215, 0, 0.3)',
        border: '2px solid rgba(255, 215, 0, 0.6)'
      }}
    >
      <span className="font-bold whitespace-nowrap" style={{ color: '#4C1D95', fontSize: '16px' }}>
        {t(labelKey)}
      </span>
      <span 
        className="font-bold whitespace-nowrap tabular-nums transition-all duration-300" 
        style={{ color: '#4C1D95', fontSize: '16px' }}
      >
        {isCurrency ? formatCurrency(animatedValue) : formatNumber(animatedValue)}
      </span>
    </div>
  );
}
