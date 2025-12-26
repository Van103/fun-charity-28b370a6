import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Heart,
  Calendar,
  ExternalLink,
  CreditCard,
  Wallet,
  CheckCircle,
  Clock,
  XCircle,
  ChevronRight,
} from 'lucide-react';

interface Donation {
  id: string;
  campaign_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  status: string;
  message: string | null;
  is_anonymous: boolean;
  created_at: string;
  completed_at: string | null;
  tx_hash: string | null;
  chain: string | null;
  campaign?: {
    id: string;
    title: string;
    cover_image_url: string | null;
  };
}

const formatCurrency = (amount: number, currency: string = 'VND'): string => {
  if (currency === 'USD') {
    return `$${amount.toLocaleString()}`;
  }
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M ₫`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}K ₫`;
  }
  return `${amount.toLocaleString()} ₫`;
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'completed':
      return (
        <Badge variant="verified" className="gap-1">
          <CheckCircle className="w-3 h-3" />
          Hoàn thành
        </Badge>
      );
    case 'pending':
      return (
        <Badge variant="secondary" className="gap-1">
          <Clock className="w-3 h-3" />
          Đang chờ
        </Badge>
      );
    case 'failed':
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="w-3 h-3" />
          Thất bại
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="gap-1">
          {status}
        </Badge>
      );
  }
};

const getPaymentMethodIcon = (method: string) => {
  if (method.includes('crypto')) {
    return <Wallet className="w-4 h-4" />;
  }
  return <CreditCard className="w-4 h-4" />;
};

interface DonationHistoryCardProps {
  userId: string | null;
  limit?: number;
  showViewAll?: boolean;
}

export function DonationHistoryCard({
  userId,
  limit = 5,
  showViewAll = true,
}: DonationHistoryCardProps) {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalDonated, setTotalDonated] = useState(0);

  useEffect(() => {
    if (userId) {
      fetchDonations();
    }
  }, [userId]);

  const fetchDonations = async () => {
    try {
      const { data, error } = await supabase
        .from('donations')
        .select(`
          *,
          campaign:campaigns(id, title, cover_image_url)
        `)
        .eq('donor_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      setDonations(data || []);
      
      // Calculate total donated
      const total = (data || [])
        .filter((d) => d.status === 'completed')
        .reduce((sum, d) => sum + Number(d.amount), 0);
      setTotalDonated(total);
    } catch (error) {
      console.error('Error fetching donations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-card p-4 space-y-4">
        <Skeleton className="h-6 w-40" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="w-12 h-12 rounded-lg" />
            <div className="flex-1">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-500" />
            <h3 className="text-lg font-bold">Lịch sử quyên góp</h3>
          </div>
          {totalDonated > 0 && (
            <Badge variant="trending" className="gap-1">
              Tổng: {formatCurrency(totalDonated)}
            </Badge>
          )}
        </div>
      </div>

      <div className="divide-y divide-border">
        {donations.length > 0 ? (
          donations.map((donation, index) => (
            <motion.div
              key={donation.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex gap-3">
                <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-muted">
                  {donation.campaign?.cover_image_url ? (
                    <img
                      src={donation.campaign.cover_image_url}
                      alt={donation.campaign.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Heart className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/campaigns/${donation.campaign_id}`}
                    className="font-medium text-sm line-clamp-1 hover:text-primary transition-colors"
                  >
                    {donation.campaign?.title || 'Chiến dịch'}
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-semibold text-primary">
                      {formatCurrency(donation.amount, donation.currency)}
                    </span>
                    {getStatusBadge(donation.status)}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      {getPaymentMethodIcon(donation.payment_method)}
                      {donation.payment_method.includes('crypto') ? 'Crypto' : 'Thẻ'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(donation.created_at).toLocaleDateString('vi-VN')}
                    </span>
                    {donation.tx_hash && (
                      <a
                        href={`https://polygonscan.com/tx/${donation.tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        TX
                      </a>
                    )}
                  </div>
                </div>
              </div>
              {donation.message && (
                <p className="text-sm text-muted-foreground mt-2 pl-15 italic">
                  "{donation.message}"
                </p>
              )}
            </motion.div>
          ))
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            <Heart className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>Chưa có lịch sử quyên góp</p>
            <Link to="/campaigns">
              <Button variant="link" className="mt-2">
                Khám phá các chiến dịch
              </Button>
            </Link>
          </div>
        )}
      </div>

      {showViewAll && donations.length > 0 && (
        <div className="p-3 border-t border-border">
          <Button variant="ghost" className="w-full justify-center gap-1">
            Xem tất cả
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
