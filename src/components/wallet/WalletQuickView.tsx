import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Plus, ExternalLink, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
];

interface TokenBalance {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  balance: string;
  isCustom?: boolean;
}

const DEFAULT_TOKENS = [
  { address: "native", name: "Ethereum", symbol: "ETH", decimals: 18 },
  { address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", name: "Wrapped Bitcoin", symbol: "WBTC", decimals: 8 },
];

interface WalletQuickViewProps {
  walletAddress: string;
  onChangeWallet: () => void;
}

export function WalletQuickView({ walletAddress, onChangeWallet }: WalletQuickViewProps) {
  const [tokens, setTokens] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const fetchBalances = useCallback(async () => {
    if (!walletAddress) return;

    setLoading(true);
    try {
      const ethereum = window.ethereum;
      if (!ethereum) return;

      const provider = new ethers.BrowserProvider(ethereum);
      const updatedTokens: TokenBalance[] = [];

      const savedCustomTokens = localStorage.getItem(`customTokens_${walletAddress}`);
      const customTokens = savedCustomTokens ? JSON.parse(savedCustomTokens) : [];
      const allTokens = [...DEFAULT_TOKENS, ...customTokens.map((t: any) => ({ ...t, isCustom: true }))];

      for (const token of allTokens) {
        try {
          if (token.address === "native") {
            const balance = await provider.getBalance(walletAddress);
            updatedTokens.push({
              ...token,
              balance: parseFloat(ethers.formatEther(balance)).toFixed(4),
            });
          } else {
            const contract = new ethers.Contract(token.address, ERC20_ABI, provider);
            const balance = await contract.balanceOf(walletAddress);
            updatedTokens.push({
              ...token,
              balance: parseFloat(ethers.formatUnits(balance, token.decimals)).toFixed(4),
            });
          }
        } catch {
          updatedTokens.push({ ...token, balance: "0.0000" });
        }
      }

      setTokens(updatedTokens);
    } catch (error) {
      console.error("Error fetching balances:", error);
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Đã sao chép địa chỉ ví" });
  };

  const getTokenIcon = (symbol: string) => {
    switch (symbol) {
      case "ETH": return "⟠";
      case "WBTC": return "₿";
      default: return "🪙";
    }
  };

  const shortenAddress = (address: string) => `${address.slice(0, 8)}...${address.slice(-6)}`;

  return (
    <div className="w-80 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-green-500">Đã kết nối</span>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchBalances} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Wallet Address */}
      <div className="p-3 rounded-lg bg-muted/50 border border-border">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-sm">{shortenAddress(walletAddress)}</span>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copyAddress}>
              {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            </Button>
            <a
              href={`https://etherscan.io/address/${walletAddress}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </a>
          </div>
        </div>
      </div>

      {/* Token Balances */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Số dư token</span>
        </div>
        
        {loading && tokens.length === 0 ? (
          <div className="flex justify-center py-4">
            <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {tokens.map((token) => (
              <div
                key={token.address}
                className="flex items-center justify-between p-2.5 rounded-lg bg-background/50 border border-border/50"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getTokenIcon(token.symbol)}</span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium">{token.symbol}</span>
                      {token.isCustom && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0">
                          Tùy chỉnh
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{token.name}</span>
                  </div>
                </div>
                <span className="font-mono text-sm font-semibold">{token.balance}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t border-border">
        <Button variant="outline" size="sm" className="flex-1" onClick={onChangeWallet}>
          Đổi ví
        </Button>
        <a href="/profile" className="flex-1">
          <Button variant="secondary" size="sm" className="w-full gap-1">
            <Plus className="w-3.5 h-3.5" />
            Quản lý token
          </Button>
        </a>
      </div>
    </div>
  );
}
