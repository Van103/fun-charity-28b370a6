import { useState, useEffect, useRef } from "react";
import { Search, X, User, Newspaper, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

interface SearchResult {
  type: "user" | "campaign" | "post";
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
}

export function SearchBar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
        setQuery("");
        setResults([]);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (query.trim().length >= 2) {
        performSearch(query.trim());
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    setIsLoading(true);
    const allResults: SearchResult[] = [];

    try {
      // Search profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .ilike("full_name", `%${searchQuery}%`)
        .limit(5);

      if (profiles) {
        profiles.forEach((p) => {
          allResults.push({
            type: "user",
            id: p.user_id,
            title: p.full_name || "Người dùng",
            image: p.avatar_url || undefined,
          });
        });
      }

      // Search campaigns
      const { data: campaigns } = await supabase
        .from("campaigns")
        .select("id, title, short_description, cover_image_url")
        .or(`title.ilike.%${searchQuery}%,short_description.ilike.%${searchQuery}%`)
        .eq("status", "active")
        .limit(5);

      if (campaigns) {
        campaigns.forEach((c) => {
          allResults.push({
            type: "campaign",
            id: c.id,
            title: c.title,
            subtitle: c.short_description || undefined,
            image: c.cover_image_url || undefined,
          });
        });
      }

      // Search feed posts
      const { data: posts } = await supabase
        .from("feed_posts")
        .select("id, title, content")
        .or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
        .eq("is_active", true)
        .limit(5);

      if (posts) {
        posts.forEach((p) => {
          allResults.push({
            type: "post",
            id: p.id,
            title: p.title || p.content?.substring(0, 50) || "Bài viết",
            subtitle: p.content?.substring(0, 80) || undefined,
          });
        });
      }

      setResults(allResults);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    setIsExpanded(false);
    setQuery("");
    setResults([]);

    switch (result.type) {
      case "user":
        navigate(`/profile/${result.id}`);
        break;
      case "campaign":
        navigate(`/campaigns/${result.id}`);
        break;
      case "post":
        navigate(`/social`);
        break;
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "user":
        return <User className="w-4 h-4" />;
      case "campaign":
        return <Newspaper className="w-4 h-4" />;
      case "post":
        return <FileText className="w-4 h-4" />;
      default:
        return <Search className="w-4 h-4" />;
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          <motion.div
            key="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-muted/50 hover:bg-muted"
              onClick={() => setIsExpanded(true)}
            >
              <Search className="w-4 h-4" />
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="input"
            initial={{ width: 40, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 40, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Tìm kiếm người dùng, chiến dịch..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 pr-8 h-9 bg-muted/50 border-0 focus-visible:ring-1"
            />
            {query && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6"
                onClick={() => {
                  setQuery("");
                  setResults([]);
                }}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {isExpanded && (query.length >= 2 || results.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-lg shadow-lg overflow-hidden z-50"
          >
            <ScrollArea className="max-h-[300px]">
              {isLoading ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  Đang tìm kiếm...
                </div>
              ) : results.length === 0 && query.length >= 2 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  Không tìm thấy kết quả
                </div>
              ) : (
                <div className="py-1">
                  {results.map((result, index) => (
                    <div
                      key={`${result.type}-${result.id}-${index}`}
                      className="px-3 py-2 hover:bg-muted cursor-pointer transition-colors flex items-center gap-3"
                      onClick={() => handleResultClick(result)}
                    >
                      {result.type === "user" && result.image ? (
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={result.image} />
                          <AvatarFallback>{result.title[0]}</AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                          {getIcon(result.type)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{result.title}</p>
                        {result.subtitle && (
                          <p className="text-xs text-muted-foreground truncate">
                            {result.subtitle}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground capitalize">
                        {result.type === "user" ? "Người dùng" : result.type === "campaign" ? "Chiến dịch" : "Bài viết"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
