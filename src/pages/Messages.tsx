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
  Phone, Video, Users, Plus 
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const loadConversations = async (userId: string) => {
    const { data: convos } = await supabase
      .from("conversations")
      .select("*")
      .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`)
      .order("last_message_at", { ascending: false });

    if (!convos) return;

    const enrichedConvos = await Promise.all(
      convos.map(async (convo) => {
        // Check if group chat
        if (convo.is_group) {
          // Load all participants for group
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

        // Direct message
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

      // Add participants for new conversation
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

    // For group chats, load sender profiles
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    if (convo.is_group) {
      return null; // Will show group icon
    }
    return convo.otherUser?.avatar_url;
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Tin nhắn | FUN Charity</title>
      </Helmet>
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 pt-4">
        <div className="glass-card overflow-hidden h-[calc(100vh-120px)] flex">
          {/* Conversations List */}
          <div className={`w-full md:w-80 border-r border-border flex flex-col ${activeConversation ? 'hidden md:flex' : ''}`}>
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Tin nhắn</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowCreateGroup(true)}
                  title="Tạo nhóm chat"
                >
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
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
                    className={`flex items-center gap-3 p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                      activeConversation?.id === convo.id ? 'bg-muted/50' : ''
                    }`}
                  >
                    <div className="relative">
                      {convo.is_group ? (
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="w-5 h-5 text-primary" />
                        </div>
                      ) : (
                        <Avatar>
                          <AvatarImage src={getConversationAvatar(convo) || ""} />
                          <AvatarFallback>{getConversationName(convo).charAt(0)}</AvatarFallback>
                        </Avatar>
                      )}
                      {!convo.is_group && (
                        <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card ${
                          convo.isOnline ? 'bg-green-500' : 'bg-muted-foreground'
                        }`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{getConversationName(convo)}</p>
                      <p className="text-xs text-muted-foreground truncate">{convo.lastMessage}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(convo.last_message_at), { locale: vi })}
                    </span>
                  </div>
                ))
              )}
            </ScrollArea>
          </div>

          {/* Messages Area */}
          <div className={`flex-1 flex flex-col ${!activeConversation ? 'hidden md:flex' : ''}`}>
            {activeConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="md:hidden"
                      onClick={() => setActiveConversation(null)}
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                    
                    {activeConversation.is_group ? (
                      <>
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{activeConversation.name || "Nhóm chat"}</p>
                          <p className="text-xs text-muted-foreground">
                            {(activeConversation.participants?.length || 0) + 1} thành viên
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <Link to={`/user/${activeConversation.otherUser?.user_id}`} className="relative">
                          <Avatar>
                            <AvatarImage src={activeConversation.otherUser?.avatar_url || ""} />
                            <AvatarFallback>{activeConversation.otherUser?.full_name?.charAt(0) || "U"}</AvatarFallback>
                          </Avatar>
                          <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card ${
                            activeConversation.isOnline ? 'bg-green-500' : 'bg-muted-foreground'
                          }`} />
                        </Link>
                        <div>
                          <Link 
                            to={`/user/${activeConversation.otherUser?.user_id}`}
                            className="font-medium hover:underline"
                          >
                            {activeConversation.otherUser?.full_name || "Người dùng"}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {activeConversation.isOnline ? (
                              <span className="text-green-500">● Đang hoạt động</span>
                            ) : (
                              "Ngoại tuyến"
                            )}
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Call buttons - only for direct messages */}
                  {!activeConversation.is_group && activeConversation.otherUser && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => startCall("audio")}
                        title="Gọi thoại"
                      >
                        <Phone className="w-5 h-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => startCall("video")}
                        title="Gọi video"
                      >
                        <Video className="w-5 h-5" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map(msg => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
                      >
                        {/* Show avatar for group messages from others */}
                        {activeConversation.is_group && msg.sender_id !== currentUserId && (
                          <Avatar className="w-8 h-8 mr-2 flex-shrink-0">
                            <AvatarImage src={msg.senderProfile?.avatar_url || ""} />
                            <AvatarFallback className="text-xs">
                              {msg.senderProfile?.full_name?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div className="flex flex-col">
                          {/* Show sender name in group */}
                          {activeConversation.is_group && msg.sender_id !== currentUserId && (
                            <span className="text-xs text-muted-foreground mb-1">
                              {msg.senderProfile?.full_name || "Người dùng"}
                            </span>
                          )}
                          <div
                            className={`max-w-[70%] rounded-2xl overflow-hidden ${
                              msg.sender_id === currentUserId
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
                              <div className="px-4 py-2">
                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                              </div>
                            )}
                            <p className={`text-xs px-4 pb-2 ${
                              msg.sender_id === currentUserId ? 'text-primary-foreground/70' : 'text-muted-foreground'
                            }`}>
                              {formatDistanceToNow(new Date(msg.created_at), { locale: vi })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Typing indicator */}
                    {typingUsers.length > 0 && (
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                        <span>
                          {typingUsers.map(u => u.name).join(", ")} đang nhập...
                        </span>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Image Preview */}
                {imagePreview && (
                  <div className="px-4 py-2 border-t border-border">
                    <div className="relative inline-block">
                      <img src={imagePreview} alt="Preview" className="max-h-20 rounded-lg" />
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

                {/* Message Input */}
                <div className="p-4 border-t border-border">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                  <form 
                    onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                    className="flex items-center gap-2"
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isSending}
                    >
                      <ImageIcon className="w-5 h-5 text-muted-foreground" />
                    </Button>
                    <ChatStickerPicker onSelect={handleStickerSelect} />
                    <Input
                      placeholder="Nhập tin nhắn..."
                      value={newMessage}
                      onChange={handleInputChange}
                      disabled={isSending}
                      className="flex-1"
                    />
                    <Button type="submit" disabled={isSending || (!newMessage.trim() && !imageFile)}>
                      {isSending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                Chọn một cuộc trò chuyện để bắt đầu
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
