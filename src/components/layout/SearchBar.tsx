import { useState, useEffect, useRef } from "react";
import { Search, X, User, Newspaper, FileText } from "lucide-react";
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
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
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
    setQuery("");
    setResults([]);
    setIsFocused(false);

    switch (result.type) {
      case "user":
        navigate(`/user/${result.id}`);
        break;
      case "campaign":
        navigate(`/campaigns/${result.id}`);
        break;
      case "post":
        // Navigate to social feed with post ID in state for scroll + highlight
        navigate("/social", { state: { scrollToPostId: result.id } });
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

  const showResults = isFocused && (query.length >= 2 || results.length > 0);

  return (
    <div ref={containerRef} className="relative hidden md:block">
      {/* Facebook-style always visible search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder="Tìm kiếm trên FUN Charity"
          className="w-[300px] h-10 pl-10 pr-9 bg-muted/50 rounded-full text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-background transition-all border-0"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full transition-colors"
          >
            <X className="w-3 h-3 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 mt-2 w-[320px] bg-popover border border-border rounded-xl shadow-lg overflow-hidden z-50"
          >
            <ScrollArea className="max-h-[400px]">
              {isLoading ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  Đang tìm kiếm...
                </div>
              ) : results.length === 0 && query.length >= 2 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  Không tìm thấy kết quả
                </div>
              ) : (
                <div className="py-2">
                  {results.map((result, index) => (
                    <div
                      key={`${result.type}-${result.id}-${index}`}
                      className="px-3 py-2.5 hover:bg-muted cursor-pointer transition-colors flex items-center gap-3"
                      onClick={() => handleResultClick(result)}
                    >
                      {result.type === "user" && result.image ? (
                        <Avatar className="w-9 h-9">
                          <AvatarImage src={result.image} />
                          <AvatarFallback>{result.title[0]}</AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="w-9 h-9 bg-muted rounded-full flex items-center justify-center">
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
