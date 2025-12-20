import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { LeftSidebar } from "@/components/social/LeftSidebar";
import { RightSidebar } from "@/components/social/RightSidebar";
import { Loader2, Gamepad2, Trophy, Star, Gift, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  wallet_address: string | null;
}

const Play = () => {
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

  const games = [
    { name: "Spin to Win", description: "Spin the wheel for CAMLY rewards", icon: "🎰", reward: "Up to 100 CAMLY", status: "active" },
    { name: "Daily Quiz", description: "Answer questions, earn tokens", icon: "❓", reward: "10 CAMLY/day", status: "active" },
    { name: "Prediction Game", description: "Predict crypto prices", icon: "📈", reward: "Variable", status: "coming" },
    { name: "NFT Lottery", description: "Win exclusive NFTs", icon: "🎟️", reward: "Rare NFTs", status: "coming" },
  ];

  const achievements = [
    { name: "First Steps", description: "Complete your first game", icon: "🏃", progress: 0 },
    { name: "Lucky Seven", description: "Win 7 times in a row", icon: "🍀", progress: 0 },
    { name: "High Roller", description: "Stake 1000+ CAMLY", icon: "💰", progress: 0 },
  ];

  return (
    <>
      <Helmet>
        <title>Play - Camly Charity</title>
        <meta name="description" content="Play games and earn rewards" />
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
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="glass-card">
                  <CardContent className="p-4 text-center">
                    <Trophy className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
                    <p className="text-xs text-muted-foreground">Total Wins</p>
                    <p className="text-lg font-bold">0</p>
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardContent className="p-4 text-center">
                    <Star className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="text-xs text-muted-foreground">Points</p>
                    <p className="text-lg font-bold">0</p>
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardContent className="p-4 text-center">
                    <Gift className="h-6 w-6 mx-auto mb-2 text-pink-500" />
                    <p className="text-xs text-muted-foreground">Rewards</p>
                    <p className="text-lg font-bold">0 CAMLY</p>
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardContent className="p-4 text-center">
                    <Zap className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                    <p className="text-xs text-muted-foreground">Streak</p>
                    <p className="text-lg font-bold">0 Days</p>
                  </CardContent>
                </Card>
              </div>

              {/* Games */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gamepad2 className="h-5 w-5 text-primary" />
                    Mini Games
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {games.map((game, index) => (
                    <div key={index} className="p-4 rounded-lg bg-background/50 border border-border/50 hover:border-primary/50 transition-colors">
                      <div className="flex items-start gap-3">
                        <span className="text-3xl">{game.icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{game.name}</h3>
                            {game.status === "coming" && (
                              <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{game.description}</p>
                          <p className="text-xs text-primary mt-1">🎁 {game.reward}</p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        className={`w-full mt-3 ${game.status === "coming" ? "" : "glossy-btn glossy-btn-gradient"}`}
                        variant={game.status === "coming" ? "secondary" : "default"}
                        disabled={game.status === "coming"}
                      >
                        {game.status === "coming" ? "Coming Soon" : "Play Now"}
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Achievements */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {achievements.map((achievement, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border/50">
                      <span className="text-2xl">{achievement.icon}</span>
                      <div className="flex-1">
                        <h4 className="font-medium">{achievement.name}</h4>
                        <p className="text-xs text-muted-foreground">{achievement.description}</p>
                      </div>
                      <Badge variant="outline">{achievement.progress}%</Badge>
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

export default Play;
