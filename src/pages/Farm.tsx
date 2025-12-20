import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { LeftSidebar } from "@/components/social/LeftSidebar";
import { RightSidebar } from "@/components/social/RightSidebar";
import { Loader2, Sprout, Coins, TrendingUp, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  wallet_address: string | null;
}

const Farm = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, avatar_url, wallet_address")
        .eq("user_id", user.id)
        .single();

      setProfile(data);
      setProfileLoading(false);
    };

    fetchProfile();
  }, [navigate]);

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const farmPools = [
    { name: "CAMLY/USDT", apr: "125%", tvl: "$1.2M", staked: "0", earned: "0" },
    { name: "CAMLY/ETH", apr: "98%", tvl: "$850K", staked: "0", earned: "0" },
    { name: "CAMLY Single", apr: "45%", tvl: "$2.1M", staked: "0", earned: "0" },
  ];

  return (
    <>
      <Helmet>
        <title>Farm - Camly Charity</title>
        <meta name="description" content="Stake your tokens and earn rewards" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />

        <main className="container mx-auto px-4 pt-20 pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Sidebar */}
            <aside className="hidden lg:block lg:col-span-3">
              <LeftSidebar profile={profile} />
            </aside>

            {/* Main Content */}
            <div className="lg:col-span-6 space-y-6">
              {/* Stats Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="glass-card">
                  <CardContent className="p-4 text-center">
                    <Sprout className="h-6 w-6 mx-auto mb-2 text-green-500" />
                    <p className="text-xs text-muted-foreground">Total Staked</p>
                    <p className="text-lg font-bold">$0.00</p>
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardContent className="p-4 text-center">
                    <Coins className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
                    <p className="text-xs text-muted-foreground">Earned</p>
                    <p className="text-lg font-bold">0 CAMLY</p>
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardContent className="p-4 text-center">
                    <TrendingUp className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="text-xs text-muted-foreground">Avg APR</p>
                    <p className="text-lg font-bold">89%</p>
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardContent className="p-4 text-center">
                    <Clock className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                    <p className="text-xs text-muted-foreground">Lock Time</p>
                    <p className="text-lg font-bold">30 Days</p>
                  </CardContent>
                </Card>
              </div>

              {/* Farm Pools */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sprout className="h-5 w-5 text-green-500" />
                    Farming Pools
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {farmPools.map((pool, index) => (
                    <div key={index} className="p-4 rounded-lg bg-background/50 border border-border/50">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">{pool.name}</h3>
                          <p className="text-sm text-muted-foreground">TVL: {pool.tvl}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-500">{pool.apr}</p>
                          <p className="text-xs text-muted-foreground">APR</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Staked: {pool.staked}</span>
                          <span className="text-muted-foreground">Earned: {pool.earned}</span>
                        </div>
                        <Progress value={0} className="h-2" />
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" className="flex-1 glossy-btn glossy-btn-green">Stake</Button>
                        <Button size="sm" variant="outline" className="flex-1 hover-glossy">Harvest</Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Right Sidebar */}
            <aside className="hidden lg:block lg:col-span-3">
              <RightSidebar />
            </aside>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Farm;
