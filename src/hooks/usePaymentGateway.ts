import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export interface FiatPaymentIntent {
  campaign_id: string;
  amount: number;
  currency: string;
  payment_method: 'stripe' | 'paypal';
  message?: string;
  is_anonymous?: boolean;
  is_recurring?: boolean;
}

export interface CryptoPaymentIntent {
  campaign_id: string;
  amount: number;
  currency: string;
  chain: string;
  wallet_from: string;
  message?: string;
  is_anonymous?: boolean;
}

export interface FiatPaymentResponse {
  donation_id: string;
  payment: {
    payment_id?: string;
    client_secret?: string;
    order_id?: string;
    approval_url?: string;
    status: string;
  };
  campaign: {
    id: string;
    title: string;
  };
}

export interface CryptoPaymentResponse {
  donation_id: string;
  payment: {
    wallet_to: string;
    amount: number;
    currency: string;
    chain: string;
    amount_usd: number;
  };
  campaign: {
    id: string;
    title: string;
  };
}

export interface Donation {
  id: string;
  campaign_id: string;
  donor_id: string | null;
  amount: number;
  amount_usd: number | null;
  currency: string;
  payment_method: string;
  status: string;
  message: string | null;
  is_anonymous: boolean;
  is_recurring: boolean;
  created_at: string;
  completed_at: string | null;
  tx_hash: string | null;
  wallet_from: string | null;
  wallet_to: string | null;
  chain: string | null;
  stripe_payment_id: string | null;
  stripe_receipt_url: string | null;
  campaign?: {
    id: string;
    title: string;
    cover_image_url: string | null;
  };
}

export interface PaymentMethod {
  id: string;
  name: string;
  description?: string;
  currencies?: string[];
  min_amount?: Record<string, number>;
  fees?: string;
  chain_id?: number;
  enabled: boolean;
}

export interface PaymentMethods {
  fiat: PaymentMethod[];
  crypto: PaymentMethod[];
}

export function usePaymentGateway() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeaders = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Content-Type': 'application/json',
      ...(session?.access_token && {
        'Authorization': `Bearer ${session.access_token}`,
      }),
    };
  }, []);

  const createFiatIntent = useCallback(async (data: FiatPaymentIntent) => {
    setLoading(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/payment-gateway/fiat/create-intent`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(data),
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create payment intent');
      }

      return result.data as FiatPaymentResponse;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      toast.error('Không thể tạo thanh toán');
      return null;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  const confirmFiatPayment = useCallback(async (donationId: string, paymentId: string) => {
    setLoading(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/payment-gateway/fiat/confirm`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ donation_id: donationId, payment_id: paymentId }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to confirm payment');
      }

      toast.success('Thanh toán thành công! Cảm ơn bạn đã quyên góp.');
      return result.data as Donation;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      toast.error('Không thể xác nhận thanh toán');
      return null;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  const createCryptoIntent = useCallback(async (data: CryptoPaymentIntent) => {
    setLoading(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/payment-gateway/crypto/create-intent`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(data),
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create crypto intent');
      }

      return result.data as CryptoPaymentResponse;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      toast.error('Không thể tạo giao dịch crypto');
      return null;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  const confirmCryptoPayment = useCallback(async (donationId: string, txHash: string, blockNumber?: number) => {
    setLoading(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/payment-gateway/crypto/confirm`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ 
            donation_id: donationId, 
            tx_hash: txHash,
            block_number: blockNumber,
          }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to confirm crypto payment');
      }

      toast.success('Giao dịch crypto đã được xác nhận!');
      return result.data as Donation;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      toast.error('Không thể xác nhận giao dịch crypto');
      return null;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  const getDonation = useCallback(async (donationId: string) => {
    setLoading(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/payment-gateway/donation/${donationId}`,
        { headers }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch donation');
      }

      return result.data as Donation;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  const getPaymentMethods = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/payment-gateway/methods`,
        { headers }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch payment methods');
      }

      return result.data as PaymentMethods;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  return {
    loading,
    error,
    createFiatIntent,
    confirmFiatPayment,
    createCryptoIntent,
    confirmCryptoPayment,
    getDonation,
    getPaymentMethods,
  };
}
