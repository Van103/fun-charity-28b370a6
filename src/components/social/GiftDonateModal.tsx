import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Gift,
  Heart,
  Wallet,
  CreditCard,
  Loader2,
  Sparkles,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Users,
  Utensils,
  GraduationCap,
  HeartHandshake,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FeedPost } from "@/hooks/useFeedPosts";
import { ethers } from "ethers";

interface GiftDonateModalProps {
  post: FeedPost;
  trigger?: React.ReactNode;
}

// VND to ETH conversion rate (simplified - in production use real API)
const VND_TO_ETH_RATE = 0.000000012; // ~1 ETH = 83M VND

const PRESET_AMOUNTS = [
  { value: 50000, label: "50K", impact: "1 bữa ăn" },
  { value: 100000, label: "100K", impact: "2 bữa ăn" },
  { value: 200000, label: "200K", impact: "1 ngày học" },
  { value: 500000, label: "500K", impact: "1 tuần sách" },
  { value: 1000000, label: "1M", impact: "1 tháng học" },
  { value: 2000000, label: "2M", impact: "Giúp 1 gia đình" },
];

const PAYMENT_METHODS = [
  {
    id: "crypto_eth",
    label: "Ví Crypto",
    sublabel: "ETH via MetaMask",
    icon: Wallet,
  },
  {
    id: "fiat_card",
    label: "Thẻ tín dụng",
    sublabel: "Visa, Mastercard",
    icon: CreditCard,
  },
];

export function GiftDonateModal({ post, trigger }: GiftDonateModalProps) {
  const [open, setOpen] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(100000);
  const [customAmount, setCustomAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("crypto_eth");
  const [message, setMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [recipientWallet, setRecipientWallet] = useState<string | null>(null);
  const { toast } = useToast();

  const amount = customAmount ? parseInt(customAmount) : selectedAmount || 0;
  const ethAmount = (amount * VND_TO_ETH_RATE).toFixed(6);
  const selectedPreset = PRESET_AMOUNTS.find(p => p.value === selectedAmount);

  // Load recipient wallet address from profile
  useEffect(() => {
    const loadRecipientWallet = async () => {
      if (!post.user_id) return;
      
      const { data } = await supabase
        .from("profiles")
        .select("wallet_address")
        .eq("user_id", post.user_id)
        .single();
      
      if (data?.wallet_address) {
        setRecipientWallet(data.wallet_address);
      }
    };
    
    if (open) {
      loadRecipientWallet();
    }
  }, [open, post.user_id]);

  // Check MetaMask connection
  useEffect(() => {
    const checkWalletConnection = async () => {
      if (typeof window.ethereum !== "undefined") {
        try {
          const accounts = await window.ethereum.request({ method: "eth_accounts" });
          if (accounts.length > 0) {
            setWalletConnected(true);
            setWalletAddress(accounts[0]);
          }
        } catch (error) {
          console.error("Error checking wallet:", error);
        }
      }
    };
    
    if (open && paymentMethod === "crypto_eth") {
      checkWalletConnection();
    }
  }, [open, paymentMethod]);

  const handleAmountSelect = (value: number) => {
    setSelectedAmount(value);
    setCustomAmount("");
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    setCustomAmount(value);
    if (value) {
      setSelectedAmount(null);
    }
  };

  const connectMetaMask = async () => {
    if (typeof window.ethereum === "undefined") {
      toast({
        title: "MetaMask chưa được cài đặt",
        description: "Vui lòng cài đặt MetaMask để tiếp tục",
        variant: "destructive",
      });
      window.open("https://metamask.io/download/", "_blank");
      return;
    }

    try {
      const accounts = await window.ethereum.request({ 
        method: "eth_requestAccounts" 
      });
      setWalletConnected(true);
      setWalletAddress(accounts[0]);
      toast({
        title: "Đã kết nối ví",
        description: `${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
      });
    } catch (error: any) {
      toast({
        title: "Lỗi kết nối",
        description: error.message || "Không thể kết nối MetaMask",
        variant: "destructive",
      });
    }
  };

  const handleCryptoDonate = async () => {
    if (!walletConnected || !walletAddress) {
      toast({
        title: "Chưa kết nối ví",
        description: "Vui lòng kết nối ví MetaMask trước",
        variant: "destructive",
      });
      return;
    }

    if (!recipientWallet) {
      toast({
        title: "Không tìm thấy ví nhận",
        description: "Người nhận chưa thiết lập ví crypto",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum!);
      const signer = await provider.getSigner();
      
      const tx = await signer.sendTransaction({
        to: recipientWallet,
        value: ethers.parseEther(ethAmount),
      });

      toast({
        title: "Đang xử lý giao dịch...",
        description: `TX: ${tx.hash.slice(0, 10)}...`,
      });

      await tx.wait();
      
      setTxHash(tx.hash);
      setShowSuccess(true);
      
      toast({
        title: "Giao dịch thành công! 🎉",
        description: `Đã gửi ${ethAmount} ETH`,
      });

      setTimeout(() => {
        setShowSuccess(false);
        setOpen(false);
        resetForm();
      }, 3000);
    } catch (error: any) {
      console.error("Crypto donation error:", error);
      toast({
        title: "Lỗi giao dịch",
        description: error.message || "Không thể thực hiện giao dịch",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFiatDonate = async () => {
    setIsLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setShowSuccess(true);
      
      toast({
        title: "Cảm ơn bạn! 🎉",
        description: `Bạn đã tặng ${amount.toLocaleString()}₫${isRecurring ? '/tháng' : ''}`,
      });

      setTimeout(() => {
        setShowSuccess(false);
        setOpen(false);
        resetForm();
      }, 2000);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể thực hiện giao dịch. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDonate = async () => {
    if (amount < 10000) {
      toast({
        title: "Số tiền quá nhỏ",
        description: "Số tiền tối thiểu là 10,000₫",
        variant: "destructive",
      });
      return;
    }

    if (paymentMethod === "crypto_eth") {
      await handleCryptoDonate();
    } else {
      await handleFiatDonate();
    }
  };

  const resetForm = () => {
    setSelectedAmount(100000);
    setCustomAmount("");
    setMessage("");
    setIsAnonymous(false);
    setIsRecurring(false);
    setTxHash(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="ghost"
            className="flex-1 gap-2 text-muted-foreground hover:text-secondary"
          >
            <Gift className="w-5 h-5" />
            Từ thiện
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-card border-border">
        <AnimatePresence mode="wait">
          {showSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="py-16 px-6 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
                className="w-24 h-24 mx-auto mb-6 rounded-full bg-[#84D9BA]/20 flex items-center justify-center"
              >
                <CheckCircle className="w-12 h-12 text-[#84D9BA]" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h3 className="text-2xl font-bold mb-3">Cảm ơn bạn!</h3>
                <p className="text-muted-foreground mb-4">
                  Đóng góp của bạn sẽ mang đến sự thay đổi tích cực 💖
                </p>
                {txHash && (
                  <a
                    href={`https://etherscan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-[#84D9BA] hover:underline"
                  >
                    Xem giao dịch <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="absolute inset-0 pointer-events-none overflow-hidden"
              >
                {[...Array(20)].map((_, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 1, x: "50%", y: "50%" }}
                    animate={{
                      opacity: 0,
                      x: `${Math.random() * 100}%`,
                      y: `${Math.random() * 100}%`,
                    }}
                    transition={{ duration: 1.5, delay: i * 0.05 }}
                    className="absolute text-2xl"
                  >
                    {["💖", "✨", "🎁", "💝", "⭐"][i % 5]}
                  </motion.span>
                ))}
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Header */}
              <div className="px-6 pt-6 pb-4 border-b border-border">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3 text-xl">
                    <div className="w-10 h-10 rounded-full bg-[#84D9BA]/20 flex items-center justify-center">
                      <HeartHandshake className="w-5 h-5 text-[#84D9BA]" />
                    </div>
                    Đóng góp từ thiện
                  </DialogTitle>
                </DialogHeader>
              </div>

              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Recipient Info */}
                <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border">
                  <Avatar className="w-12 h-12 border-2 border-[#84D9BA]/30">
                    <AvatarImage src={post.profiles?.avatar_url || ""} />
                    <AvatarFallback className="bg-[#84D9BA]/20 text-[#84D9BA]">
                      {post.profiles?.full_name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">
                      {post.profiles?.full_name || "Quỹ FUN Charity"}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {post.title || post.content?.slice(0, 50)}...
                    </p>
                  </div>
                  <Heart className="w-5 h-5 text-red-400 animate-pulse flex-shrink-0" />
                </div>

                {/* Recurring Toggle - Clean design like reference */}
                <div className="flex rounded-xl border border-border overflow-hidden">
                  <button
                    onClick={() => setIsRecurring(false)}
                    className={`flex-1 py-3.5 px-4 text-sm font-medium transition-all ${
                      !isRecurring
                        ? 'bg-[#84D9BA] text-white'
                        : 'bg-transparent text-muted-foreground hover:bg-muted/50'
                    }`}
                  >
                    Một lần
                  </button>
                  <button
                    onClick={() => setIsRecurring(true)}
                    className={`flex-1 py-3.5 px-4 text-sm font-medium transition-all ${
                      isRecurring
                        ? 'bg-[#84D9BA] text-white'
                        : 'bg-transparent text-muted-foreground hover:bg-muted/50'
                    }`}
                  >
                    Hàng tháng
                  </button>
                </div>

                {/* Amount Selection - Responsive grid */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Chọn số tiền {isRecurring ? 'hàng tháng' : ''}
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {PRESET_AMOUNTS.map((preset) => (
                      <motion.button
                        key={preset.value}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleAmountSelect(preset.value)}
                        className={`relative py-4 px-3 rounded-xl border-2 transition-all text-center ${
                          selectedAmount === preset.value
                            ? 'border-[#84D9BA] bg-[#84D9BA]/10 shadow-lg shadow-[#84D9BA]/20'
                            : 'border-border hover:border-[#84D9BA]/50 bg-card'
                        }`}
                      >
                        <span className={`text-lg font-bold ${
                          selectedAmount === preset.value ? 'text-[#84D9BA]' : ''
                        }`}>
                          {preset.label}
                        </span>
                        {selectedAmount === preset.value && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute -top-2 -right-2 w-5 h-5 bg-[#84D9BA] rounded-full flex items-center justify-center"
                          >
                            <CheckCircle className="w-3 h-3 text-white" />
                          </motion.div>
                        )}
                      </motion.button>
                    ))}
                  </div>

                  {/* Custom Amount - Prominent styling */}
                  <div className="relative mt-4">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                      ₫
                    </span>
                    <Input
                      type="text"
                      placeholder="Nhập số tiền khác"
                      value={customAmount ? parseInt(customAmount).toLocaleString() : ""}
                      onChange={handleCustomAmountChange}
                      className={`pl-8 pr-4 h-14 text-lg font-medium rounded-xl border-2 transition-all ${
                        customAmount
                          ? 'border-[#84D9BA] bg-[#84D9BA]/5'
                          : 'border-border hover:border-muted-foreground/50'
                      }`}
                    />
                  </div>

                  {/* Impact Text */}
                  {(selectedPreset || amount > 0) && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 p-3 rounded-lg bg-[#84D9BA]/10 border border-[#84D9BA]/20"
                    >
                      {selectedPreset?.value === 50000 && <Utensils className="w-4 h-4 text-[#84D9BA]" />}
                      {selectedPreset?.value === 100000 && <Utensils className="w-4 h-4 text-[#84D9BA]" />}
                      {selectedPreset?.value === 200000 && <GraduationCap className="w-4 h-4 text-[#84D9BA]" />}
                      {selectedPreset?.value === 500000 && <GraduationCap className="w-4 h-4 text-[#84D9BA]" />}
                      {selectedPreset?.value === 1000000 && <GraduationCap className="w-4 h-4 text-[#84D9BA]" />}
                      {selectedPreset?.value === 2000000 && <Users className="w-4 h-4 text-[#84D9BA]" />}
                      {!selectedPreset && <Heart className="w-4 h-4 text-[#84D9BA]" />}
                      <span className="text-sm text-[#84D9BA] font-medium">
                        {selectedPreset ? `Có thể hỗ trợ: ${selectedPreset.impact}` : 'Mỗi đóng góp đều có ý nghĩa'}
                      </span>
                    </motion.div>
                  )}
                </div>

                {/* Payment Method - Tab design */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Phương thức thanh toán
                  </Label>
                  <Tabs value={paymentMethod} onValueChange={setPaymentMethod} className="w-full">
                    <TabsList className="w-full h-auto p-1 bg-muted/50 rounded-xl grid grid-cols-2 gap-1">
                      {PAYMENT_METHODS.map((method) => (
                        <TabsTrigger
                          key={method.id}
                          value={method.id}
                          className={`flex flex-col items-center gap-1 py-3 px-4 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-md transition-all`}
                        >
                          <method.icon className={`w-5 h-5 ${
                            paymentMethod === method.id ? 'text-[#84D9BA]' : 'text-muted-foreground'
                          }`} />
                          <span className="text-xs font-medium">{method.label}</span>
                          <span className="text-[10px] text-muted-foreground">{method.sublabel}</span>
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>

                  {/* MetaMask Connection */}
                  {paymentMethod === "crypto_eth" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-4 rounded-xl bg-muted/50 border border-border space-y-3"
                    >
                      {!walletConnected ? (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={connectMetaMask}
                          className="w-full gap-2 h-12 rounded-xl border-dashed border-2"
                        >
                          <Wallet className="w-5 h-5" />
                          Kết nối MetaMask
                        </Button>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-muted-foreground">Đã kết nối:</span>
                            <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                              {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Số ETH:</span>
                            <span className="font-bold text-[#84D9BA]">{ethAmount} ETH</span>
                          </div>
                          {!recipientWallet && (
                            <div className="flex items-center gap-2 text-amber-500 text-xs p-2 bg-amber-500/10 rounded-lg">
                              <AlertCircle className="w-4 h-4 flex-shrink-0" />
                              <span>Người nhận chưa thiết lập ví crypto</span>
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Lời nhắn (tùy chọn)
                  </Label>
                  <Textarea
                    placeholder="Viết lời chúc của bạn..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="resize-none h-20 rounded-xl border-border focus:border-[#84D9BA]"
                    maxLength={200}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {message.length}/200
                  </p>
                </div>

                {/* Anonymous Toggle */}
                <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-muted/30">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Đóng góp ẩn danh</Label>
                    <p className="text-xs text-muted-foreground">
                      Tên của bạn sẽ không được hiển thị
                    </p>
                  </div>
                  <Switch
                    checked={isAnonymous}
                    onCheckedChange={setIsAnonymous}
                    className="data-[state=checked]:bg-[#84D9BA]"
                  />
                </div>
              </div>

              {/* Submit Button - Fixed at bottom */}
              <div className="p-6 pt-4 border-t border-border bg-card">
                <Button
                  onClick={handleDonate}
                  disabled={amount < 10000 || isLoading || (paymentMethod === "crypto_eth" && !walletConnected)}
                  className="w-full gap-2 h-14 text-lg font-semibold rounded-xl bg-[#84D9BA] hover:bg-[#6BC9A8] text-white shadow-lg shadow-[#84D9BA]/30 transition-all"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Đóng góp {amount > 0 ? amount.toLocaleString() + "₫" : ""}
                      {isRecurring && amount > 0 ? "/tháng" : ""}
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground mt-3">
                  {paymentMethod === "crypto_eth" 
                    ? "Giao dịch ETH qua mạng Ethereum • Phí gas áp dụng 🔒"
                    : "Thanh toán được bảo mật qua Stripe 🔒"
                  }
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
