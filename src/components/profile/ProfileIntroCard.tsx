import { useState, useEffect } from "react";
import { 
  Briefcase, 
  GraduationCap, 
  MapPin, 
  Home, 
  Heart,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditDetailsModal } from "./EditDetailsModal";
import { supabase } from "@/integrations/supabase/client";

interface ProfileIntroCardProps {
  profile: {
    full_name: string | null;
    bio: string | null;
    role: string | null;
    user_id?: string;
  } | null;
  onEdit?: () => void;
}

interface DetailItem {
  id: string;
  detail_type: string;
  title: string;
  is_visible: boolean;
}

export function ProfileIntroCard({ profile, onEdit }: ProfileIntroCardProps) {
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [details, setDetails] = useState<DetailItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.user_id) {
      fetchDetails();
    }
  }, [profile?.user_id]);

  const fetchDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("profile_details")
        .select("id, detail_type, title, is_visible")
        .eq("user_id", profile!.user_id)
        .eq("is_visible", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      setDetails(data || []);
    } catch (error) {
      console.error("Error fetching details:", error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'work':
        return Briefcase;
      case 'education':
        return GraduationCap;
      case 'location':
        return MapPin;
      case 'hometown':
        return Home;
      case 'relationship':
        return Heart;
      default:
        return Clock;
    }
  };

  // Default items if no details exist
  const defaultItems = [
    { icon: Clock, text: "Tham gia từ tháng 1 năm 2024", type: "joined" },
  ];

  return (
    <>
      <div className="glass-card overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <h3 className="text-lg font-bold text-foreground">Giới thiệu</h3>
        </div>

        <div className="p-4 space-y-4">
          {/* Bio/Quote */}
          {profile?.bio && (
            <div className="text-center">
              <p className="text-foreground">{profile.bio}</p>
            </div>
          )}

          {/* Edit Bio Button */}
          <Button 
            variant="secondary" 
            className="w-full"
            onClick={onEdit}
          >
            Chỉnh sửa tiểu sử
          </Button>

          {/* Intro Items from Database */}
          <div className="space-y-3">
            {details.length > 0 ? (
              details.map((item) => {
                const Icon = getIcon(item.detail_type);
                return (
                  <div key={item.id} className="flex items-start gap-3">
                    <Icon className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                    <span className="text-sm text-foreground">{item.title}</span>
                  </div>
                );
              })
            ) : (
              defaultItems.map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <item.icon className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                  <span className="text-sm text-foreground">{item.text}</span>
                </div>
              ))
            )}
          </div>

          {/* Edit Details Button */}
          <Button 
            variant="secondary" 
            className="w-full"
            onClick={() => setDetailsModalOpen(true)}
          >
            Chỉnh sửa chi tiết
          </Button>
        </div>
      </div>

      <EditDetailsModal 
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        onSave={fetchDetails}
      />
    </>
  );
}