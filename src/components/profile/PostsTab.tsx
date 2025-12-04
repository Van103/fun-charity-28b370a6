import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CreatePostForm } from "./CreatePostForm";
import { PostCard } from "./PostCard";
import { FileText } from "lucide-react";

interface MediaItem {
  url: string;
  type: string;
}

interface Post {
  id: string;
  user_id: string;
  content: string | null;
  image_url: string | null;
  media_urls?: MediaItem[] | null;
  created_at: string;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface PostsTabProps {
  profile: {
    user_id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  currentUserId: string | null;
}

export function PostsTab({ profile, currentUserId }: PostsTabProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.user_id) {
      fetchPosts();
    }
  }, [profile?.user_id]);

  const fetchPosts = async () => {
    if (!profile?.user_id) return;

    try {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("user_id", profile.user_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Add profile info to each post
      const postsWithProfile = (data || []).map((post) => ({
        ...post,
        media_urls: post.media_urls as unknown as MediaItem[] | null,
        profiles: {
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
        },
      }));
      
      setPosts(postsWithProfile);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const isOwnProfile = currentUserId === profile?.user_id;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isOwnProfile && (
        <CreatePostForm profile={profile} onPostCreated={fetchPosts} />
      )}

      {posts.length > 0 ? (
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={currentUserId}
              onDelete={fetchPosts}
              onUpdate={fetchPosts}
            />
          ))}
        </div>
      ) : (
        <div className="glass-card p-8 text-center">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Chưa có bài viết</h3>
          <p className="text-muted-foreground">
            {isOwnProfile
              ? "Hãy chia sẻ bài viết đầu tiên của bạn!"
              : "Người dùng này chưa có bài viết nào"}
          </p>
        </div>
      )}
    </div>
  );
}
