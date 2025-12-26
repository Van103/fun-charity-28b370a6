import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FiatPaymentIntent {
  campaign_id: string;
  amount: number;
  currency: string;
  payment_method: 'stripe' | 'paypal';
  message?: string;
  is_anonymous?: boolean;
  is_recurring?: boolean;
}

interface CryptoPaymentIntent {
  campaign_id: string;
  amount: number;
  currency: string;
  chain: string;
  wallet_from: string;
  message?: string;
  is_anonymous?: boolean;
}

// Mock Stripe payment processing
async function mockStripePayment(amount: number, currency: string): Promise<{
  payment_id: string;
  client_secret: string;
  status: string;
}> {
  // Simulate API latency
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return {
    payment_id: `pi_mock_${crypto.randomUUID().replace(/-/g, '').substring(0, 24)}`,
    client_secret: `pi_mock_secret_${crypto.randomUUID().replace(/-/g, '')}`,
    status: 'requires_payment_method',
  };
}

// Mock PayPal payment processing
async function mockPayPalPayment(amount: number, currency: string): Promise<{
  order_id: string;
  approval_url: string;
  status: string;
}> {
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const orderId = `PAYPAL_${crypto.randomUUID().replace(/-/g, '').substring(0, 17).toUpperCase()}`;
  return {
    order_id: orderId,
    approval_url: `https://sandbox.paypal.com/checkoutnow?token=${orderId}`,
    status: 'CREATED',
  };
}

// Calculate USD equivalent for crypto
function calculateUsdAmount(amount: number, chain: string): number {
  // Mock exchange rates
  const rates: Record<string, number> = {
    'polygon': 0.85,  // 1 MATIC = $0.85
    'ethereum': 2300, // 1 ETH = $2300
    'bsc': 300,       // 1 BNB = $300
  };
  return amount * (rates[chain.toLowerCase()] || 1);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const action = pathParts[pathParts.length - 1];

    console.log(`[payment-gateway] ${req.method} ${url.pathname}`);

    // POST /payment-gateway/fiat/create-intent - Create fiat payment intent
    if (req.method === 'POST' && action === 'create-intent' && url.pathname.includes('/fiat/')) {
      const { data: { user } } = await supabaseClient.auth.getUser();
      
      const body: FiatPaymentIntent = await req.json();
      
      // Validate required fields
      if (!body.campaign_id || !body.amount || !body.payment_method) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Missing required fields: campaign_id, amount, payment_method',
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Verify campaign exists and is active
      const { data: campaign, error: campaignError } = await supabaseClient
        .from('campaigns')
        .select('id, title, status, wallet_address')
        .eq('id', body.campaign_id)
        .in('status', ['active', 'approved'])
        .single();

      if (campaignError || !campaign) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Campaign not found or not active',
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      let paymentResult;
      
      if (body.payment_method === 'stripe') {
        paymentResult = await mockStripePayment(body.amount, body.currency || 'VND');
      } else if (body.payment_method === 'paypal') {
        paymentResult = await mockPayPalPayment(body.amount, body.currency || 'USD');
      } else {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid payment method. Use "stripe" or "paypal"',
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Create pending donation record
      const stripePaymentId = body.payment_method === 'stripe' && 'payment_id' in paymentResult 
        ? paymentResult.payment_id 
        : null;
      
      const donationData = {
        campaign_id: body.campaign_id,
        donor_id: user?.id || null,
        amount: body.amount,
        currency: body.currency || 'VND',
        payment_method: body.payment_method,
        status: 'pending',
        message: body.message,
        is_anonymous: body.is_anonymous || false,
        is_recurring: body.is_recurring || false,
        stripe_payment_id: stripePaymentId,
      };

      const { data: donation, error: donationError } = await supabaseClient
        .from('donations')
        .insert(donationData)
        .select()
        .single();

      if (donationError) {
        console.error('[payment-gateway] Donation create error:', donationError);
        throw donationError;
      }

      console.log(`[payment-gateway] Created fiat intent for donation ${donation.id}`);

      return new Response(JSON.stringify({
        success: true,
        data: {
          donation_id: donation.id,
          payment: paymentResult,
          campaign: {
            id: campaign.id,
            title: campaign.title,
          },
        },
      }), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /payment-gateway/fiat/confirm - Confirm fiat payment (webhook simulation)
    if (req.method === 'POST' && action === 'confirm' && url.pathname.includes('/fiat/')) {
      const body = await req.json();
      
      if (!body.donation_id || !body.payment_id) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Missing donation_id or payment_id',
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Update donation to completed
      const { data: donation, error } = await supabaseClient
        .from('donations')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          stripe_receipt_url: `https://receipt.stripe.com/${body.payment_id}`,
        })
        .eq('id', body.donation_id)
        .select()
        .single();

      if (error) {
        console.error('[payment-gateway] Confirm error:', error);
        throw error;
      }

      console.log(`[payment-gateway] Confirmed donation ${donation.id}`);

      return new Response(JSON.stringify({
        success: true,
        data: donation,
        message: 'Payment confirmed successfully',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /payment-gateway/crypto/create-intent - Create crypto donation intent
    if (req.method === 'POST' && action === 'create-intent' && url.pathname.includes('/crypto/')) {
      const { data: { user } } = await supabaseClient.auth.getUser();
      
      const body: CryptoPaymentIntent = await req.json();
      
      if (!body.campaign_id || !body.amount || !body.chain || !body.wallet_from) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Missing required fields: campaign_id, amount, chain, wallet_from',
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Verify campaign exists and is active
      const { data: campaign, error: campaignError } = await supabaseClient
        .from('campaigns')
        .select('id, title, status, wallet_address')
        .eq('id', body.campaign_id)
        .in('status', ['active', 'approved'])
        .single();

      if (campaignError || !campaign) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Campaign not found or not active',
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (!campaign.wallet_address) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Campaign does not have a wallet address for crypto donations',
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Calculate USD equivalent
      const amountUsd = calculateUsdAmount(body.amount, body.chain);

      // Create pending donation record
      const donationData = {
        campaign_id: body.campaign_id,
        donor_id: user?.id || null,
        amount: body.amount,
        amount_usd: amountUsd,
        currency: body.currency || 'MATIC',
        payment_method: 'crypto',
        status: 'pending',
        message: body.message,
        is_anonymous: body.is_anonymous || false,
        wallet_from: body.wallet_from,
        wallet_to: campaign.wallet_address,
        chain: body.chain,
      };

      const { data: donation, error: donationError } = await supabaseClient
        .from('donations')
        .insert(donationData)
        .select()
        .single();

      if (donationError) {
        console.error('[payment-gateway] Crypto donation create error:', donationError);
        throw donationError;
      }

      console.log(`[payment-gateway] Created crypto intent for donation ${donation.id}`);

      return new Response(JSON.stringify({
        success: true,
        data: {
          donation_id: donation.id,
          payment: {
            wallet_to: campaign.wallet_address,
            amount: body.amount,
            currency: body.currency || 'MATIC',
            chain: body.chain,
            amount_usd: amountUsd,
          },
          campaign: {
            id: campaign.id,
            title: campaign.title,
          },
        },
      }), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /payment-gateway/crypto/confirm - Confirm crypto payment
    if (req.method === 'POST' && action === 'confirm' && url.pathname.includes('/crypto/')) {
      const body = await req.json();
      
      if (!body.donation_id || !body.tx_hash) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Missing donation_id or tx_hash',
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Update donation with blockchain data
      const { data: donation, error } = await supabaseClient
        .from('donations')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          tx_hash: body.tx_hash,
          block_number: body.block_number || null,
        })
        .eq('id', body.donation_id)
        .select()
        .single();

      if (error) {
        console.error('[payment-gateway] Crypto confirm error:', error);
        throw error;
      }

      console.log(`[payment-gateway] Confirmed crypto donation ${donation.id} with tx ${body.tx_hash}`);

      return new Response(JSON.stringify({
        success: true,
        data: donation,
        message: 'Crypto payment confirmed successfully',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET /payment-gateway/donation/:id - Get donation status
    if (req.method === 'GET' && pathParts.includes('donation')) {
      const donationId = pathParts[pathParts.length - 1];

      const { data: donation, error } = await supabaseClient
        .from('donations')
        .select(`
          *,
          campaign:campaigns(id, title, cover_image_url)
        `)
        .eq('id', donationId)
        .single();

      if (error) {
        console.error('[payment-gateway] Get donation error:', error);
        throw error;
      }

      return new Response(JSON.stringify({
        success: true,
        data: donation,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET /payment-gateway/methods - Get available payment methods
    if (req.method === 'GET' && action === 'methods') {
      const methods = {
        fiat: [
          {
            id: 'stripe',
            name: 'Stripe',
            description: 'Credit/Debit Card via Stripe',
            currencies: ['VND', 'USD', 'EUR'],
            min_amount: { VND: 10000, USD: 1, EUR: 1 },
            fees: '2.9% + 30¢',
            enabled: true,
          },
          {
            id: 'paypal',
            name: 'PayPal',
            description: 'PayPal Account',
            currencies: ['USD', 'EUR'],
            min_amount: { USD: 1, EUR: 1 },
            fees: '2.9% + 30¢',
            enabled: true,
          },
        ],
        crypto: [
          {
            id: 'polygon',
            name: 'Polygon (MATIC)',
            chain_id: 137,
            currencies: ['MATIC', 'USDC', 'USDT'],
            fees: '~$0.01',
            enabled: true,
          },
          {
            id: 'ethereum',
            name: 'Ethereum',
            chain_id: 1,
            currencies: ['ETH', 'USDC', 'USDT', 'DAI'],
            fees: '~$2-20',
            enabled: true,
          },
          {
            id: 'bsc',
            name: 'BNB Smart Chain',
            chain_id: 56,
            currencies: ['BNB', 'BUSD'],
            fees: '~$0.10',
            enabled: true,
          },
        ],
      };

      return new Response(JSON.stringify({
        success: true,
        data: methods,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: false, error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('[payment-gateway] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
