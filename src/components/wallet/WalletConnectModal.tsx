import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Wallet, Link2, Check, AlertCircle, ExternalLink, Copy, Edit2 } from "lucide-react";

interface WalletConnectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWalletConnected?: (address: string) => void;
}

export function WalletConnectModal({ open, onOpenChange, onWalletConnected }: WalletConnectModalProps) {
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [manualAddress, setManualAddress] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkMetaMaskInstalled();
    loadSavedWallet();
    // Reset edit mode when modal opens
    if (open) {
      setIsEditMode(false);
      setShowManualInput(false);
      setManualAddress("");
    }
  }, [open]);

  const checkMetaMaskInstalled = () => {
    setIsMetaMaskInstalled(typeof window.ethereum !== "undefined" && window.ethereum.isMetaMask === true);
  };

  const loadSavedWallet = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("wallet_address")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (data?.wallet_address) {
        setConnectedAddress(data.wallet_address);
      }
    }
  };

  const connectMetaMask = async () => {
    if (!window.ethereum) {
      toast({
        title: "MetaMask không được cài đặt",
        description: "Vui lòng cài đặt MetaMask extension để tiếp tục.",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      }) as string[];

      if (accounts && accounts.length > 0) {
        const address = accounts[0];
        await saveWalletAddress(address);
        setConnectedAddress(address);
        setIsEditMode(false);
        onWalletConnected?.(address);
        toast({
          title: "Kết nối thành công!",
          description: `Ví ${shortenAddress(address)} đã được kết nối.`,
        });
      }
    } catch (error: unknown) {
      const err = error as { code?: number; message?: string };
      if (err.code === 4001) {
        toast({
          title: "Bị từ chối",
          description: "Bạn đã từ chối yêu cầu kết nối.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Lỗi kết nối",
          description: "Không thể kết nối với MetaMask. Vui lòng thử lại.",
          variant: "destructive",
        });
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const saveWalletAddress = async (address: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Chưa đăng nhập",
        description: "Vui lòng đăng nhập để lưu địa chỉ ví.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ wallet_address: address })
      .eq("user_id", user.id);

    if (error) {
      console.error("Error saving wallet:", error);
      toast({
        title: "Lỗi lưu địa chỉ ví",
        description: "Không thể lưu địa chỉ ví. Vui lòng thử lại.",
        variant: "destructive",
      });
    }
  };

  const handleManualSubmit = async () => {
    const trimmedAddress = manualAddress.trim();
    
    // Validate Ethereum address format
    if (!trimmedAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      toast({
        title: "Địa chỉ không hợp lệ",
        description: "Vui lòng nhập địa chỉ ví Ethereum hợp lệ (0x...)",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      await saveWalletAddress(trimmedAddress);
      setConnectedAddress(trimmedAddress);
      setManualAddress("");
      setShowManualInput(false);
      setIsEditMode(false);
      onWalletConnected?.(trimmedAddress);
      toast({
        title: "Lưu thành công!",
        description: `Địa chỉ ví ${shortenAddress(trimmedAddress)} đã được lưu.`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const disconnectWallet = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("profiles")
        .update({ wallet_address: null })
        .eq("user_id", user.id);
    }
    setConnectedAddress(null);
    toast({
      title: "Đã ngắt kết nối",
      description: "Ví của bạn đã được ngắt kết nối.",
    });
  };

  const copyAddress = () => {
    if (connectedAddress) {
      navigator.clipboard.writeText(connectedAddress);
      toast({
        title: "Đã sao chép!",
        description: "Địa chỉ ví đã được sao chép vào clipboard.",
      });
    }
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <Wallet className="w-5 h-5 text-secondary" />
            Kết Nối Ví Web3
          </DialogTitle>
          <DialogDescription>
            Kết nối ví MetaMask hoặc nhập địa chỉ ví thủ công
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {connectedAddress && !isEditMode ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 rounded-xl bg-success/10 border border-success/30"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-success" />
                  <span className="font-medium text-success">Đã kết nối</span>
                </div>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => setIsEditMode(true)}
                  className="h-8 px-2 text-muted-foreground hover:text-foreground"
                >
                  <Edit2 className="w-4 h-4 mr-1" />
                  Đổi ví
                </Button>
              </div>
              <div className="flex items-center justify-between gap-2 p-3 rounded-lg bg-background/50">
                <code className="text-sm font-mono">{shortenAddress(connectedAddress)}</code>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={copyAddress} className="h-8 w-8">
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={() => window.open(`https://etherscan.io/address/${connectedAddress}`, "_blank")}
                    className="h-8 w-8"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={disconnectWallet}
                className="mt-3 w-full"
              >
                Ngắt kết nối
              </Button>
            </motion.div>
          ) : (
            <>
              {connectedAddress && isEditMode && (
                <div className="p-3 rounded-lg bg-muted/50 border border-border mb-2">
                  <p className="text-sm text-muted-foreground">
                    Ví hiện tại: <code className="font-mono">{shortenAddress(connectedAddress)}</code>
                  </p>
                  <Button 
                    variant="link" 
                    size="sm" 
                    onClick={() => setIsEditMode(false)}
                    className="p-0 h-auto text-xs"
                  >
                    ← Quay lại
                  </Button>
                </div>
              )}

              {/* MetaMask Connect Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={connectMetaMask}
                disabled={isConnecting}
                className="w-full p-4 rounded-xl border-2 border-secondary/30 hover:border-secondary/60 bg-secondary/5 hover:bg-secondary/10 transition-all flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-[#F6851B]/10 flex items-center justify-center">
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" 
                    alt="MetaMask" 
                    className="w-8 h-8"
                  />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold flex items-center gap-2">
                    MetaMask
                    {isMetaMaskInstalled && (
                      <Badge variant="gold" className="text-xs">Đã cài đặt</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {isConnecting ? "Đang kết nối..." : "Kết nối ví MetaMask của bạn"}
                  </p>
                </div>
              </motion.button>

              {!isMetaMaskInstalled && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-600">MetaMask chưa được cài đặt</p>
                    <a 
                      href="https://metamask.io/download/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-amber-600 underline hover:no-underline"
                    >
                      Tải MetaMask tại đây
                    </a>
                  </div>
                </div>
              )}

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">hoặc</span>
                </div>
              </div>

              {/* Manual Input */}
              <AnimatePresence>
                {showManualInput ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3"
                  >
                    <Label htmlFor="wallet-address">Địa chỉ ví Ethereum</Label>
                    <Input
                      id="wallet-address"
                      placeholder="0x..."
                      value={manualAddress}
                      onChange={(e) => setManualAddress(e.target.value)}
                      className="font-mono text-sm"
                    />
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleManualSubmit} 
                        disabled={isSaving || !manualAddress.trim()}
                        className="flex-1"
                        variant="hero"
                      >
                        {isSaving ? "Đang lưu..." : "Lưu địa chỉ"}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setShowManualInput(false);
                          setManualAddress("");
                        }}
                      >
                        Hủy
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowManualInput(true)}
                    className="w-full p-4 rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-muted-foreground/50 transition-all flex items-center gap-4"
                  >
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                      <Link2 className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold">Nhập thủ công</div>
                      <p className="text-sm text-muted-foreground">
                        Dán địa chỉ ví của bạn (0x...)
                      </p>
                    </div>
                  </motion.button>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
