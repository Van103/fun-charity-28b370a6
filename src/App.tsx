import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { MotionProvider } from "@/contexts/MotionContext";
import { CursorProvider } from "@/contexts/CursorContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AnimatedBackground } from "@/components/background/AnimatedBackground";
import { EnergyBokeh } from "@/components/background/EnergyBokeh";
import CustomCursor from "@/components/cursor/CustomCursor";
import { useIncomingCallListener } from "@/hooks/useIncomingCallListener";
import { IncomingCallNotification } from "@/components/chat/IncomingCallNotification";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import Index from "./pages/Index";
import Campaigns from "./pages/Campaigns";
import CampaignDetail from "./pages/CampaignDetail";
import Dashboard from "./pages/Dashboard";
import NeedsMap from "./pages/NeedsMap";
import Profiles from "./pages/Profiles";
import Reviews from "./pages/Reviews";
import Auth from "./pages/Auth";
import UserProfile from "./pages/UserProfile";
import PublicProfile from "./pages/PublicProfile";
import SocialFeed from "./pages/SocialFeed";
import Messages from "./pages/Messages";
import Life from "./pages/Life";
import Academy from "./pages/Academy";
import Trading from "./pages/Trading";
import Investment from "./pages/Investment";
import Farm from "./pages/Farm";
import Play from "./pages/Play";
import Legal from "./pages/Legal";
import Planet from "./pages/Planet";
import Friends from "./pages/Friends";
import MyCampaigns from "./pages/MyCampaigns";
import AdminVerify from "./pages/AdminVerify";
import Volunteer from "./pages/Volunteer";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Background variant selector based on route
function BackgroundWithVariant() {
  const location = useLocation();
  
  const getVariant = () => {
    if (location.pathname === "/") return "home";
    if (location.pathname === "/profile") return "profile";
    if (location.pathname.includes("/campaigns")) return "default";
    return "default";
  };

  return <AnimatedBackground variant={getVariant()} intensity="medium" />;
}

// Global incoming call listener component
function IncomingCallListener() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const { incomingCall, answerCall, declineCall } = useIncomingCallListener({
    userId,
    onAnswerCall: (call) => {
      // Navigate to messages page with call info
      if (location.pathname !== "/messages") {
        navigate(`/messages?answer=${call.id}&conversation=${call.conversationId}&type=${call.callType}`);
      }
    }
  });

  // Don't show notification on messages page (it has its own handling)
  if (location.pathname === "/messages" || !incomingCall) {
    return null;
  }

  return (
    <IncomingCallNotification
      callerName={incomingCall.callerName}
      callerAvatar={incomingCall.callerAvatar}
      callType={incomingCall.callType}
      onAnswer={answerCall}
      onDecline={declineCall}
    />
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <MotionProvider>
        <CursorProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <CustomCursor />
            <BrowserRouter>
              <BackgroundWithVariant />
              <EnergyBokeh />
              <IncomingCallListener />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/campaigns" element={<Campaigns />} />
                <Route path="/campaigns/:id" element={<CampaignDetail />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/needs-map" element={<NeedsMap />} />
                <Route path="/profiles" element={<Profiles />} />
                <Route path="/reviews" element={<Reviews />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/profile" element={<UserProfile />} />
                <Route path="/user/:userId" element={<PublicProfile />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/feed" element={<SocialFeed />} />
                <Route path="/social" element={<SocialFeed />} />
                <Route path="/life" element={<Life />} />
                <Route path="/academy" element={<Academy />} />
                <Route path="/trading" element={<Trading />} />
                <Route path="/investment" element={<Investment />} />
                <Route path="/farm" element={<Farm />} />
                <Route path="/play" element={<Play />} />
                <Route path="/legal" element={<Legal />} />
                <Route path="/planet" element={<Planet />} />
                <Route path="/friends" element={<Friends />} />
                <Route path="/my-campaigns" element={<MyCampaigns />} />
                <Route path="/admin/verify" element={<AdminVerify />} />
                <Route path="/volunteer" element={<Volunteer />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </CursorProvider>
      </MotionProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
