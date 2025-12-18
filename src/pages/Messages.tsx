import { useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Navbar } from "@/components/layout/Navbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { 
  Loader2, Send, ArrowLeft, Search, Image as ImageIcon, X, 
  Phone, Video, Users, Plus, Mic, ThumbsUp, MoreHorizontal,
  Minimize2, Maximize2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { usePresence, getOnlineStatus } from "@/hooks/usePresence";
import { useMessageNotifications } from "@/hooks/useMessageNotifications";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";
import { ChatStickerPicker } from "@/components/chat/ChatStickerPicker";
import { VideoCallModal } from "@/components/chat/VideoCallModal";
import { CreateGroupModal } from "@/components/chat/CreateGroupModal";
import { useToast } from "@/hooks/use-toast";

interface Conversation {
  id: string;
  participant1_id: string;
  participant2_id: string;
  last_message_at: string;
  is_group?: boolean;
  name?: string;
  created_by?: string;
  otherUser?: {
    user_id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  participants?: Array<{
    user_id: string;
    full_name: string | null;
    avatar_url: string | null;
  }>;
  lastMessage?: string;
  isOnline?: boolean;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  image_url: string | null;
  is_read: boolean;
  created_at: string;
  senderProfile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface SearchUser {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
}

export default function Messages() {
  const [searchParams] = useSearchParams();
  const targetUserId = searchParams.get("user");
  const { toast } = useToast();
  
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [callType, setCallType] = useState<"video" | "audio">("video");
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Setup presence tracking
  usePresence(currentUserId);
  
  // Setup message notifications
  useMessageNotifications(currentUserId, activeConversation?.id || null);
  
  // Setup typing indicator
  const { typingUsers, handleTyping, setTyping } = useTypingIndicator(
    activeConversation?.id || null,
    currentUserId
  );

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initial load
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setCurrentUserId(user.id);
      await loadConversations(user.id);
      
      if (targetUserId) {
        await openConversationWithUser(user.id, targetUserId);
      }
      
      setIsLoading(false);
    };
    
    init();
  }, [targetUserId]);

  // Search users
  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        setShowSearchDropdown(false);
        return;
      }
      
      setIsSearching(true);
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .ilike("full_name", `%${searchQuery}%`)
        .neq("user_id", currentUserId)
        .limit(10);
      
      setSearchResults(data || []);
      setShowSearchDropdown(true);
      setIsSearching(false);
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, currentUserId]);

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchInputRef.current && !searchInputRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadConversations = async (userId: string) => {
    const { data: convos } = await supabase
      .from("conversations")
      .select("*")
      .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`)
      .order("last_message_at", { ascending: false });

    if (!convos) return;

    const enrichedConvos = await Promise.all(
      convos.map(async (convo) => {
        if (convo.is_group) {
          const { data: participants } = await supabase
            .from("conversation_participants")
            .select("user_id")
            .eq("conversation_id", convo.id);

          const participantIds = participants?.map(p => p.user_id).filter(id => id !== userId) || [];
          
          const { data: profiles } = await supabase
            .from("profiles")
            .select("user_id, full_name, avatar_url")
            .in("user_id", participantIds);

          const { data: lastMsg } = await supabase
            .from("messages")
            .select("content, image_url")
            .eq("conversation_id", convo.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            ...convo,
            participants: profiles || [],
            lastMessage: lastMsg?.image_url ? "📷 Hình ảnh" : lastMsg?.content || "",
            isOnline: false
          };
        }

        const otherUserId = convo.participant1_id === userId ? convo.participant2_id : convo.participant1_id;
        const onlineStatusMap = await getOnlineStatus([otherUserId]);
        
        const { data: profile } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .eq("user_id", otherUserId)
          .maybeSingle();

        const { data: lastMsg } = await supabase
          .from("messages")
          .select("content, image_url")
          .eq("conversation_id", convo.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        return {
          ...convo,
          otherUser: profile || undefined,
          lastMessage: lastMsg?.image_url ? "📷 Hình ảnh" : lastMsg?.content || "",
          isOnline: onlineStatusMap.get(otherUserId) || false
        };
      })
    );

    setConversations(enrichedConvos);
  };

  const openConversationWithUser = async (myId: string, theirId: string) => {
    const { data: existing } = await supabase
      .from("conversations")
      .select("*")
      .eq("is_group", false)
      .or(`and(participant1_id.eq.${myId},participant2_id.eq.${theirId}),and(participant1_id.eq.${theirId},participant2_id.eq.${myId})`)
      .maybeSingle();

    let convo = existing;

    if (!convo) {
      const { data: newConvo } = await supabase
        .from("conversations")
        .insert({ 
          participant1_id: myId, 
          participant2_id: theirId,
          is_group: false
        })
        .select()
        .single();
      
      convo = newConvo;

      if (newConvo) {
        await supabase
          .from("conversation_participants")
          .insert([
            { conversation_id: newConvo.id, user_id: myId },
            { conversation_id: newConvo.id, user_id: theirId }
          ]);
      }
      
      await loadConversations(myId);
    }

    if (convo) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .eq("user_id", theirId)
        .maybeSingle();

      const onlineStatusMap = await getOnlineStatus([theirId]);

      setActiveConversation({
        ...convo,
        otherUser: profile || undefined,
        isOnline: onlineStatusMap.get(theirId) || false
      });
      
      await loadMessages(convo.id);
    }
  };

  const loadMessages = async (conversationId: string) => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (!data) {
      setMessages([]);
      return;
    }

    const senderIds = [...new Set(data.map(m => m.sender_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, avatar_url")
      .in("user_id", senderIds);

    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

    const enrichedMessages = data.map(msg => ({
      ...msg,
      senderProfile: profileMap.get(msg.sender_id)
    }));

    setMessages(enrichedMessages);

    if (currentUserId) {
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("conversation_id", conversationId)
        .neq("sender_id", currentUserId);
    }
  };

  const selectConversation = async (convo: Conversation) => {
    setActiveConversation(convo);
    await loadMessages(convo.id);
  };

  const selectSearchResult = async (user: SearchUser) => {
    if (!currentUserId) return;
    setSearchQuery("");
    setShowSearchDropdown(false);
    await openConversationWithUser(currentUserId, user.user_id);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File quá lớn",
        description: "Vui lòng chọn ảnh dưới 10MB",
        variant: "destructive"
      });
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleStickerSelect = (sticker: string) => {
    setNewMessage(prev => prev + sticker);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    handleTyping();
  };

  const sendMessage = async () => {
    if ((!newMessage.trim() && !imageFile) || !activeConversation || !currentUserId) return;
    
    setIsSending(true);
    setTyping(false);
    
    try {
      let imageUrl = null;

      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const filePath = `${currentUserId}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("post-images")
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("post-images")
          .getPublicUrl(filePath);

        imageUrl = urlData.publicUrl;
      }

      const { error } = await supabase
        .from("messages")
        .insert({
          conversation_id: activeConversation.id,
          sender_id: currentUserId,
          content: newMessage.trim() || (imageUrl ? "" : ""),
          image_url: imageUrl
        });

      if (error) throw error;

      setNewMessage("");
      setImageFile(null);
      setImagePreview(null);
      await loadMessages(activeConversation.id);
      
      await supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", activeConversation.id);
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể gửi tin nhắn",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const sendLike = async () => {
    if (!activeConversation || !currentUserId) return;
    
    try {
      await supabase
        .from("messages")
        .insert({
          conversation_id: activeConversation.id,
          sender_id: currentUserId,
          content: "👍"
        });
      
      await loadMessages(activeConversation.id);
      
      await supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", activeConversation.id);
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const startCall = (type: "video" | "audio") => {
    setCallType(type);
    setShowVideoCall(true);
  };

  // Realtime subscription for messages
  useEffect(() => {
    if (!activeConversation) return;

    const channel = supabase
      .channel(`messages-${activeConversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${activeConversation.id}`
        },
        () => {
          loadMessages(activeConversation.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConversation?.id]);

  // Realtime subscription for presence changes
  useEffect(() => {
    const channel = supabase
      .channel("presence-updates")
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence'
        },
        async () => {
          if (currentUserId) {
            await loadConversations(currentUserId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const filteredConversations = conversations.filter(c => {
    if (!searchQuery.trim()) return true;
    if (c.is_group) {
      return c.name?.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return c.otherUser?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getConversationName = (convo: Conversation) => {
    if (convo.is_group) return convo.name || "Nhóm chat";
    return convo.otherUser?.full_name || "Người dùng";
  };

  const getConversationAvatar = (convo: Conversation) => {
    if (convo.is_group) return null;
    return convo.otherUser?.avatar_url;
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Tin nhắn | FUN Charity</title>
      </Helmet>
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 pt-4">
        <div className="bg-card rounded-xl shadow-lg overflow-hidden h-[calc(100vh-120px)] flex border border-border">
          {/* Conversations List */}
          <div className={`w-full md:w-80 border-r border-border flex flex-col bg-card ${activeConversation ? 'hidden md:flex' : ''}`}>
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-bold">Đoạn chat</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowCreateGroup(true)}
                  title="Tạo nhóm chat"
                  className="rounded-full hover:bg-muted"
                >
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
              
              {/* Search with dropdown */}
              <div className="relative" ref={searchInputRef}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm người dùng..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.trim().length >= 2 && setShowSearchDropdown(true)}
                  className="pl-10 rounded-full bg-muted/50 border-0 focus-visible:ring-1"
                />
                
                {/* Search Results Dropdown */}
                {showSearchDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                    {isSearching ? (
                      <div className="p-4 text-center">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground text-sm">
                        Không tìm thấy người dùng
                      </div>
                    ) : (
                      searchResults.map(user => (
                        <button
                          key={user.user_id}
                          onClick={() => selectSearchResult(user)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left"
                        >
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={user.avatar_url || ""} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {user.full_name?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{user.full_name || "Người dùng"}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <ScrollArea className="flex-1">
              {filteredConversations.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  Chưa có cuộc trò chuyện nào
                </div>
              ) : (
                filteredConversations.map(convo => (
                  <div
                    key={convo.id}
                    onClick={() => selectConversation(convo)}
                    className={`flex items-center gap-3 p-3 mx-2 my-1 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors ${
                      activeConversation?.id === convo.id ? 'bg-primary/10' : ''
                    }`}
                  >
                    <div className="relative">
                      {convo.is_group ? (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-purple-400 flex items-center justify-center">
                          <Users className="w-6 h-6 text-white" />
                        </div>
                      ) : (
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={getConversationAvatar(convo) || ""} />
                          <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {getConversationName(convo).charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      {!convo.is_group && (
                        <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-card ${
                          convo.isOnline ? 'bg-green-500' : 'bg-gray-400'
                        }`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{getConversationName(convo)}</p>
                      <p className="text-sm text-muted-foreground truncate">{convo.lastMessage}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(convo.last_message_at), { locale: vi, addSuffix: false })}
                    </span>
                  </div>
                ))
              )}
            </ScrollArea>
          </div>

          {/* Messages Area */}
          <div className={`flex-1 flex flex-col bg-background ${!activeConversation ? 'hidden md:flex' : ''}`}>
            {activeConversation ? (
              <>
                {/* Chat Header - Messenger Style */}
                <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-card">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="md:hidden rounded-full"
                      onClick={() => setActiveConversation(null)}
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                    
                    {activeConversation.is_group ? (
                      <>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-400 flex items-center justify-center">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold">{activeConversation.name || "Nhóm chat"}</p>
                          <p className="text-xs text-muted-foreground">
                            {(activeConversation.participants?.length || 0) + 1} thành viên
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <Link to={`/user/${activeConversation.otherUser?.user_id}`} className="relative">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={activeConversation.otherUser?.avatar_url || ""} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {activeConversation.otherUser?.full_name?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card ${
                            activeConversation.isOnline ? 'bg-green-500' : 'bg-gray-400'
                          }`} />
                        </Link>
                        <div>
                          <Link 
                            to={`/user/${activeConversation.otherUser?.user_id}`}
                            className="font-semibold hover:underline block"
                          >
                            {activeConversation.otherUser?.full_name || "Người dùng"}
                          </Link>
                          <p className="text-xs">
                            {activeConversation.isOnline ? (
                              <span className="text-green-500 flex items-center gap-1">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                Đang hoạt động
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Ngoại tuyến</span>
                            )}
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Action buttons - Messenger style */}
                  <div className="flex items-center gap-1">
                    {!activeConversation.is_group && activeConversation.otherUser && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => startCall("audio")}
                          title="Gọi thoại"
                          className="rounded-full hover:bg-muted text-primary"
                        >
                          <Phone className="w-5 h-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => startCall("video")}
                          title="Gọi video"
                          className="rounded-full hover:bg-muted text-primary"
                        >
                          <Video className="w-5 h-5" />
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setActiveConversation(null)}
                      title="Đóng"
                      className="rounded-full hover:bg-muted hidden md:flex"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-2">
                    {messages.map((msg, index) => {
                      const isCurrentUser = msg.sender_id === currentUserId;
                      const showAvatar = !isCurrentUser && (
                        index === 0 || 
                        messages[index - 1]?.sender_id !== msg.sender_id
                      );
                      
                      return (
                        <div
                          key={msg.id}
                          className={`flex items-end gap-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                        >
                          {/* Avatar for other user's messages */}
                          {!isCurrentUser && (
                            <div className="w-7 h-7 flex-shrink-0">
                              {showAvatar && (
                                <Avatar className="w-7 h-7">
                                  <AvatarImage src={msg.senderProfile?.avatar_url || activeConversation.otherUser?.avatar_url || ""} />
                                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                    {(msg.senderProfile?.full_name || activeConversation.otherUser?.full_name || "U").charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                            </div>
                          )}
                          
                          <div className={`flex flex-col max-w-[70%] ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                            {/* Sender name for group */}
                            {activeConversation.is_group && !isCurrentUser && showAvatar && (
                              <span className="text-xs text-muted-foreground mb-1 ml-1">
                                {msg.senderProfile?.full_name || "Người dùng"}
                              </span>
                            )}
                            
                            <div
                              className={`rounded-2xl overflow-hidden ${
                                isCurrentUser
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              {msg.image_url && (
                                <img 
                                  src={msg.image_url} 
                                  alt="Shared image" 
                                  className="max-w-full max-h-60 object-cover cursor-pointer"
                                  onClick={() => window.open(msg.image_url!, '_blank')}
                                />
                              )}
                              {msg.content && (
                                <div className={`px-3 py-2 ${msg.content === '👍' ? 'text-3xl py-1' : ''}`}>
                                  <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                                </div>
                              )}
                            </div>
                            
                            {/* Timestamp - show on hover or for last message */}
                            <span className={`text-[10px] mt-1 ${
                              isCurrentUser ? 'text-muted-foreground mr-1' : 'text-muted-foreground ml-1'
                            }`}>
                              {formatDistanceToNow(new Date(msg.created_at), { locale: vi, addSuffix: false })}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Typing indicator */}
                    {typingUsers.length > 0 && (
                      <div className="flex items-end gap-2">
                        <Avatar className="w-7 h-7">
                          <AvatarImage src={activeConversation.otherUser?.avatar_url || ""} />
                          <AvatarFallback className="text-xs">
                            {activeConversation.otherUser?.full_name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="bg-muted rounded-2xl px-4 py-3">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                            <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                            <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Image Preview */}
                {imagePreview && (
                  <div className="px-4 py-2 border-t border-border bg-card">
                    <div className="relative inline-block">
                      <img src={imagePreview} alt="Preview" className="max-h-24 rounded-lg" />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                        onClick={removeImage}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Message Input - Messenger Style */}
                <div className="p-3 border-t border-border bg-card">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                  <div className="flex items-center gap-2">
                    {/* Left action buttons */}
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-full hover:bg-muted text-primary"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isSending}
                        title="Đính kèm ảnh/video"
                      >
                        <ImageIcon className="w-5 h-5" />
                      </Button>
                      <ChatStickerPicker onSelect={handleStickerSelect} />
                    </div>
                    
                    {/* Message input */}
                    <div className="flex-1 relative">
                      <Input
                        placeholder="Aa"
                        value={newMessage}
                        onChange={handleInputChange}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                        disabled={isSending}
                        className="w-full rounded-full bg-muted/50 border-0 pr-10 focus-visible:ring-1"
                      />
                    </div>
                    
                    {/* Send/Like button */}
                    {newMessage.trim() || imageFile ? (
                      <Button 
                        onClick={sendMessage}
                        disabled={isSending}
                        size="icon"
                        className="h-9 w-9 rounded-full"
                      >
                        {isSending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-full hover:bg-muted text-primary"
                        onClick={sendLike}
                        title="Gửi like"
                      >
                        <ThumbsUp className="w-5 h-5" />
                      </Button>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <Send className="w-10 h-10 text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-lg text-foreground">Tin nhắn của bạn</p>
                  <p className="text-sm">Chọn một cuộc trò chuyện để bắt đầu</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Video/Audio Call Modal */}
      {showVideoCall && activeConversation?.otherUser && currentUserId && (
        <VideoCallModal
          open={showVideoCall}
          onClose={() => setShowVideoCall(false)}
          conversationId={activeConversation.id}
          currentUserId={currentUserId}
          otherUser={activeConversation.otherUser}
          callType={callType}
        />
      )}

      {/* Create Group Modal */}
      {currentUserId && (
        <CreateGroupModal
          open={showCreateGroup}
          onClose={() => setShowCreateGroup(false)}
          currentUserId={currentUserId}
          onGroupCreated={async (conversationId) => {
            await loadConversations(currentUserId);
            const newConvo = conversations.find(c => c.id === conversationId);
            if (newConvo) {
              setActiveConversation(newConvo);
              await loadMessages(conversationId);
            }
          }}
        />
      )}
    </div>
  );
}
