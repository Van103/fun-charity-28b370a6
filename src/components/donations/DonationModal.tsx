import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { usePaymentGateway, PaymentMethods } from '@/hooks/usePaymentGateway';
import { supabase } from '@/integrations/supabase/client';
import {
  CreditCard,
  Wallet,
  Loader2,
  CheckCircle,
  Copy,
  ExternalLink,
  Heart,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface DonationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  campaignTitle: string;
  campaignWalletAddress?: string | null;
}

type PaymentStep = 'select' | 'fiat-details' | 'crypto-details' | 'processing' | 'success';

export function DonationModal({
  open,
  onOpenChange,
  campaignId,
  campaignTitle,
  campaignWalletAddress,
}: DonationModalProps) {
  const [step, setStep] = useState<PaymentStep>('select');
  const [paymentType, setPaymentType] = useState<'fiat' | 'crypto'>('fiat');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethods | null>(null);
  const [selectedFiatMethod, setSelectedFiatMethod] = useState<'stripe' | 'paypal'>('stripe');
  const [selectedCryptoChain, setSelectedCryptoChain] = useState('polygon');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('VND');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [donationResult, setDonationResult] = useState<{
    donationId: string;
    walletTo?: string;
    paymentUrl?: string;
  } | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const {
    loading,
    createFiatIntent,
    confirmFiatPayment,
    createCryptoIntent,
    confirmCryptoPayment,
    getPaymentMethods,
  } = usePaymentGateway();

  useEffect(() => {
    if (open) {
      loadPaymentMethods();
      checkAuth();
      resetForm();
    }
  }, [open]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);
  };

  const loadPaymentMethods = async () => {
    const methods = await getPaymentMethods();
    if (methods) {
      setPaymentMethods(methods);
    }
  };

  const resetForm = () => {
    setStep('select');
    setAmount('');
    setMessage('');
    setIsAnonymous(false);
    setIsRecurring(false);
    setWalletAddress('');
    setDonationResult(null);
  };

  const handleFiatPayment = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error('Vui lòng nhập số tiền hợp lệ');
      return;
    }

    setStep('processing');

    const result = await createFiatIntent({
      campaign_id: campaignId,
      amount: numAmount,
      currency,
      payment_method: selectedFiatMethod,
      message: message || undefined,
      is_anonymous: isAnonymous,
      is_recurring: isRecurring,
    });

    if (result) {
      // Simulate payment completion for demo
      const paymentId = result.payment.payment_id || result.payment.order_id;
      if (paymentId) {
        const confirmed = await confirmFiatPayment(result.donation_id, paymentId);
        if (confirmed) {
          setDonationResult({
            donationId: result.donation_id,
            paymentUrl: result.payment.approval_url,
          });
          setStep('success');
        } else {
          setStep('fiat-details');
        }
      }
    } else {
      setStep('fiat-details');
    }
  };

  const handleCryptoPayment = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error('Vui lòng nhập số tiền hợp lệ');
      return;
    }

    if (!walletAddress) {
      toast.error('Vui lòng nhập địa chỉ ví của bạn');
      return;
    }

    setStep('processing');

    const result = await createCryptoIntent({
      campaign_id: campaignId,
      amount: numAmount,
      currency: 'MATIC',
      chain: selectedCryptoChain,
      wallet_from: walletAddress,
      message: message || undefined,
      is_anonymous: isAnonymous,
    });

    if (result) {
      setDonationResult({
        donationId: result.donation_id,
        walletTo: result.payment.wallet_to,
      });
      setStep('success');
    } else {
      setStep('crypto-details');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép!');
  };

  const presetAmounts = currency === 'VND' 
    ? [50000, 100000, 200000, 500000, 1000000]
    : [5, 10, 25, 50, 100];

  const formatCurrency = (amt: number) => {
    if (currency === 'VND') {
      return `${amt.toLocaleString('vi-VN')} ₫`;
    }
    return `$${amt}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary" />
            Quyên góp cho chiến dịch
          </DialogTitle>
          <DialogDescription className="line-clamp-1">
            {campaignTitle}
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <Tabs value={paymentType} onValueChange={(v) => setPaymentType(v as 'fiat' | 'crypto')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="fiat" className="gap-2">
                    <CreditCard className="w-4 h-4" />
                    Thẻ / PayPal
                  </TabsTrigger>
                  <TabsTrigger value="crypto" className="gap-2" disabled={!campaignWalletAddress}>
                    <Wallet className="w-4 h-4" />
                    Crypto
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="fiat" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant={selectedFiatMethod === 'stripe' ? 'default' : 'outline'}
                      className="h-20 flex-col gap-2"
                      onClick={() => setSelectedFiatMethod('stripe')}
                    >
                      <CreditCard className="w-6 h-6" />
                      <span>Stripe</span>
                      <span className="text-xs text-muted-foreground">Thẻ tín dụng</span>
                    </Button>
                    <Button
                      variant={selectedFiatMethod === 'paypal' ? 'default' : 'outline'}
                      className="h-20 flex-col gap-2"
                      onClick={() => {
                        setSelectedFiatMethod('paypal');
                        setCurrency('USD');
                      }}
                    >
                      <Wallet className="w-6 h-6" />
                      <span>PayPal</span>
                      <span className="text-xs text-muted-foreground">Tài khoản PayPal</span>
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="crypto" className="space-y-4 mt-4">
                  {!campaignWalletAddress ? (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <AlertCircle className="w-4 h-4" />
                      Chiến dịch này chưa hỗ trợ thanh toán crypto
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {paymentMethods?.crypto.map((method) => (
                        <Button
                          key={method.id}
                          variant={selectedCryptoChain === method.id ? 'default' : 'outline'}
                          className="h-16 flex-col gap-1 text-xs"
                          onClick={() => setSelectedCryptoChain(method.id)}
                        >
                          <span className="font-medium">{method.name}</span>
                          <span className="text-muted-foreground">{method.fees}</span>
                        </Button>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <Button
                className="w-full"
                onClick={() => setStep(paymentType === 'fiat' ? 'fiat-details' : 'crypto-details')}
                disabled={paymentType === 'crypto' && !campaignWalletAddress}
              >
                Tiếp tục
              </Button>
            </motion.div>
          )}

          {step === 'fiat-details' && (
            <motion.div
              key="fiat-details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Số tiền quyên góp</Label>
                <div className="flex gap-2 flex-wrap">
                  {presetAmounts.map((amt) => (
                    <Badge
                      key={amt}
                      variant={amount === String(amt) ? 'default' : 'outline'}
                      className="cursor-pointer hover:bg-primary/20"
                      onClick={() => setAmount(String(amt))}
                    >
                      {formatCurrency(amt)}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Nhập số tiền khác"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="flex-1"
                  />
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="px-3 border rounded-md bg-background"
                  >
                    <option value="VND">VND</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Lời nhắn (tùy chọn)</Label>
                <Textarea
                  placeholder="Gửi lời chúc đến chiến dịch..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="anonymous">Quyên góp ẩn danh</Label>
                <Switch
                  id="anonymous"
                  checked={isAnonymous}
                  onCheckedChange={setIsAnonymous}
                />
              </div>

              {selectedFiatMethod === 'stripe' && (
                <div className="flex items-center justify-between">
                  <Label htmlFor="recurring">Quyên góp hàng tháng</Label>
                  <Switch
                    id="recurring"
                    checked={isRecurring}
                    onCheckedChange={setIsRecurring}
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('select')}>
                  Quay lại
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleFiatPayment}
                  disabled={loading || !amount}
                >
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Xác nhận quyên góp
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'crypto-details' && (
            <motion.div
              key="crypto-details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Số lượng crypto</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="flex-1"
                  />
                  <Badge variant="secondary" className="h-10 px-4 flex items-center">
                    {selectedCryptoChain === 'polygon' ? 'MATIC' : 
                     selectedCryptoChain === 'ethereum' ? 'ETH' : 'BNB'}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Địa chỉ ví của bạn</Label>
                <Input
                  placeholder="0x..."
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Lời nhắn (tùy chọn)</Label>
                <Textarea
                  placeholder="Gửi lời chúc đến chiến dịch..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="anonymous-crypto">Quyên góp ẩn danh</Label>
                <Switch
                  id="anonymous-crypto"
                  checked={isAnonymous}
                  onCheckedChange={setIsAnonymous}
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('select')}>
                  Quay lại
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleCryptoPayment}
                  disabled={loading || !amount || !walletAddress}
                >
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Tạo giao dịch
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 text-center"
            >
              <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Đang xử lý thanh toán...</p>
            </motion.div>
          )}

          {step === 'success' && donationResult && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="py-8 text-center space-y-4"
            >
              <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="font-semibold text-lg">Cảm ơn bạn đã quyên góp!</h3>
              <p className="text-muted-foreground text-sm">
                Quyên góp của bạn sẽ giúp thay đổi cuộc sống của nhiều người.
              </p>

              {donationResult.walletTo && (
                <div className="bg-muted p-4 rounded-lg text-left space-y-2">
                  <p className="text-sm font-medium">Gửi crypto đến địa chỉ:</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-background p-2 rounded flex-1 break-all">
                      {donationResult.walletTo}
                    </code>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => copyToClipboard(donationResult.walletTo!)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              <Button onClick={() => onOpenChange(false)} className="w-full">
                Hoàn tất
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
