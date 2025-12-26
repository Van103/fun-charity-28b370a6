import { useState } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { CreateCampaignModal } from "@/components/campaigns/CreateCampaignModal";
import { CampaignList } from "@/components/campaigns/CampaignList";
import { PlatformStatsDisplay } from "@/components/campaigns/PlatformStatsDisplay";
import { Heart } from "lucide-react";
import { Helmet } from "react-helmet-async";

const Campaigns = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCampaignCreated = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <>
      <Helmet>
        <title>Chiến Dịch Từ Thiện - FUN Charity</title>
        <meta
          name="description"
          content="Khám phá các chiến dịch từ thiện đã được xác minh. Quyên góp minh bạch với blockchain."
        />
      </Helmet>

      <main className="min-h-screen bg-background">
        <Navbar />

        <div className="pt-24 pb-16">
          <div className="container mx-auto px-4">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-8"
            >
              <Badge variant="trending" className="mb-4">
                <Heart className="w-3.5 h-3.5 mr-1" />
                Tạo Tác Động
              </Badge>
              <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
                Khám Phá <span className="gradient-text">Chiến Dịch</span>
              </h1>
              <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
                Duyệt qua các chiến dịch đã được xác minh từ các tổ chức NGO đáng tin cậy.
                Mọi khoản quyên góp đều được ghi nhận on-chain để minh bạch hoàn toàn.
              </p>
              <CreateCampaignModal onCampaignCreated={handleCampaignCreated} />
            </motion.div>

            {/* Platform Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-12"
            >
              <PlatformStatsDisplay />
            </motion.div>

            {/* Campaign List with Edge Function Integration */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <CampaignList
                key={refreshKey}
                showFilters={true}
                limit={12}
              />
            </motion.div>
          </div>
        </div>

        <Footer />
      </main>
    </>
  );
};

export default Campaigns;
