import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

// Stripe webhook event types we handle
const STRIPE_EVENTS = {
  PAYMENT_INTENT_SUCCEEDED: 'payment_intent.succeeded',
  PAYMENT_INTENT_FAILED: 'payment_intent.payment_failed',
  CHARGE_REFUNDED: 'charge.refunded',
};

// PayPal webhook event types
const PAYPAL_EVENTS = {
  PAYMENT_COMPLETED: 'PAYMENT.CAPTURE.COMPLETED',
  PAYMENT_DECLINED: 'PAYMENT.CAPTURE.DENIED',
  REFUND_COMPLETED: 'PAYMENT.CAPTURE.REFUNDED',
};

// In production, you would verify webhook signatures
// For now, we use a simple secret token
const WEBHOOK_SECRET = Deno.env.get('WEBHOOK_SECRET') || 'dev_webhook_secret';

function verifyWebhookToken(req: Request): boolean {
  const token = req.headers.get('x-webhook-token');
  // In dev mode, also accept requests without token for testing
  if (Deno.env.get('DENO_ENV') !== 'production' && !token) {
    return true;
  }
  return token === WEBHOOK_SECRET;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Use service role for webhook operations (no user context)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const provider = pathParts[1]; // stripe, paypal, crypto

    console.log(`[payment-webhook] ${req.method} ${url.pathname}`);

    // POST /payment-webhook/stripe - Handle Stripe webhooks
    if (req.method === 'POST' && provider === 'stripe') {
      // In production, verify Stripe signature
      // const sig = req.headers.get('stripe-signature');
      // const event = stripe.webhooks.constructEvent(body, sig, STRIPE_ENDPOINT_SECRET);
      
      if (!verifyWebhookToken(req)) {
        console.log('[payment-webhook] Invalid webhook token');
        return new Response(JSON.stringify({ success: false, error: 'Invalid webhook token' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const event = await req.json();
      console.log(`[payment-webhook] Stripe event: ${event.type}`);

      switch (event.type) {
        case STRIPE_EVENTS.PAYMENT_INTENT_SUCCEEDED: {
          const paymentIntent = event.data.object;
          const paymentId = paymentIntent.id;

          // Find and update donation
          const { data: donation, error } = await supabaseClient
            .from('donations')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
              stripe_receipt_url: paymentIntent.charges?.data?.[0]?.receipt_url || null,
            })
            .eq('stripe_payment_id', paymentId)
            .eq('status', 'pending')
            .select()
            .single();

          if (error) {
            console.error('[payment-webhook] Stripe success update error:', error);
            // Don't throw - Stripe needs 200 response
          } else {
            console.log(`[payment-webhook] Donation ${donation?.id} completed via Stripe`);
            
            // Create notification for campaign owner
            if (donation) {
              const { data: campaign } = await supabaseClient
                .from('campaigns')
                .select('creator_id, title')
                .eq('id', donation.campaign_id)
                .single();

              if (campaign) {
                await supabaseClient.from('notifications').insert({
                  user_id: campaign.creator_id,
                  type: 'donation_received',
                  title: 'Đã nhận quyên góp mới!',
                  message: `Chiến dịch "${campaign.title}" đã nhận được ${donation.amount} ${donation.currency}`,
                  data: {
                    donation_id: donation.id,
                    campaign_id: donation.campaign_id,
                    amount: donation.amount,
                    currency: donation.currency,
                  },
                });
              }
            }
          }
          break;
        }

        case STRIPE_EVENTS.PAYMENT_INTENT_FAILED: {
          const paymentIntent = event.data.object;
          const paymentId = paymentIntent.id;

          const { error } = await supabaseClient
            .from('donations')
            .update({ status: 'failed' })
            .eq('stripe_payment_id', paymentId)
            .eq('status', 'pending');

          if (error) {
            console.error('[payment-webhook] Stripe failed update error:', error);
          } else {
            console.log(`[payment-webhook] Donation with payment ${paymentId} marked as failed`);
          }
          break;
        }

        case STRIPE_EVENTS.CHARGE_REFUNDED: {
          const charge = event.data.object;
          const paymentIntentId = charge.payment_intent;

          const { error } = await supabaseClient
            .from('donations')
            .update({ status: 'refunded' })
            .eq('stripe_payment_id', paymentIntentId);

          if (error) {
            console.error('[payment-webhook] Stripe refund update error:', error);
          } else {
            console.log(`[payment-webhook] Donation with payment ${paymentIntentId} refunded`);
          }
          break;
        }

        default:
          console.log(`[payment-webhook] Unhandled Stripe event: ${event.type}`);
      }

      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /payment-webhook/paypal - Handle PayPal webhooks
    if (req.method === 'POST' && provider === 'paypal') {
      if (!verifyWebhookToken(req)) {
        console.log('[payment-webhook] Invalid webhook token');
        return new Response(JSON.stringify({ success: false, error: 'Invalid webhook token' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const event = await req.json();
      const eventType = event.event_type;
      console.log(`[payment-webhook] PayPal event: ${eventType}`);

      switch (eventType) {
        case PAYPAL_EVENTS.PAYMENT_COMPLETED: {
          const capture = event.resource;
          const orderId = capture.supplementary_data?.related_ids?.order_id;
          
          // In real implementation, we'd store PayPal order ID in donations
          // For now, find by amount and pending status (demo only)
          console.log(`[payment-webhook] PayPal payment completed: ${orderId}`);
          break;
        }

        case PAYPAL_EVENTS.PAYMENT_DECLINED: {
          console.log('[payment-webhook] PayPal payment declined');
          break;
        }

        case PAYPAL_EVENTS.REFUND_COMPLETED: {
          console.log('[payment-webhook] PayPal refund completed');
          break;
        }

        default:
          console.log(`[payment-webhook] Unhandled PayPal event: ${eventType}`);
      }

      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /payment-webhook/crypto - Handle crypto transaction confirmations
    if (req.method === 'POST' && provider === 'crypto') {
      if (!verifyWebhookToken(req)) {
        console.log('[payment-webhook] Invalid webhook token');
        return new Response(JSON.stringify({ success: false, error: 'Invalid webhook token' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const body = await req.json();
      
      // Validate required fields
      if (!body.donation_id || !body.tx_hash || !body.confirmations) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: donation_id, tx_hash, confirmations' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const requiredConfirmations = body.chain === 'ethereum' ? 12 : 30;
      
      if (body.confirmations >= requiredConfirmations) {
        const { data: donation, error } = await supabaseClient
          .from('donations')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            tx_hash: body.tx_hash,
            block_number: body.block_number || null,
          })
          .eq('id', body.donation_id)
          .eq('status', 'pending')
          .select()
          .single();

        if (error) {
          console.error('[payment-webhook] Crypto confirmation error:', error);
          throw error;
        }

        console.log(`[payment-webhook] Crypto donation ${donation?.id} confirmed with ${body.confirmations} confirmations`);

        // Create notification for campaign owner
        if (donation) {
          const { data: campaign } = await supabaseClient
            .from('campaigns')
            .select('creator_id, title')
            .eq('id', donation.campaign_id)
            .single();

          if (campaign) {
            await supabaseClient.from('notifications').insert({
              user_id: campaign.creator_id,
              type: 'donation_received',
              title: 'Đã nhận quyên góp Crypto!',
              message: `Chiến dịch "${campaign.title}" đã nhận được ${donation.amount} ${donation.currency}`,
              data: {
                donation_id: donation.id,
                campaign_id: donation.campaign_id,
                amount: donation.amount,
                currency: donation.currency,
                tx_hash: body.tx_hash,
              },
            });
          }
        }

        return new Response(JSON.stringify({
          success: true,
          data: donation,
          message: 'Crypto donation confirmed',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        console.log(`[payment-webhook] Crypto donation ${body.donation_id} has ${body.confirmations}/${requiredConfirmations} confirmations`);
        
        return new Response(JSON.stringify({
          success: true,
          message: `Waiting for more confirmations: ${body.confirmations}/${requiredConfirmations}`,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // POST /payment-webhook/test - Test webhook endpoint
    if (req.method === 'POST' && provider === 'test') {
      const body = await req.json();
      console.log('[payment-webhook] Test webhook received:', body);
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Test webhook received',
        echo: body,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET /payment-webhook/health - Health check
    if (req.method === 'GET' && provider === 'health') {
      return new Response(JSON.stringify({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: false, error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('[payment-webhook] Error:', error);
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
