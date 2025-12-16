import { useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Navbar } from "@/components/layout/Navbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Send, ArrowLeft, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface Conversation {
  id: string;
  participant1_id: string;
  participant2_id: string;
  last_message_at: string;
  otherUser?: {
    user_id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  lastMessage?: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export default function Messages() {
  const [searchParams] = useSearchParams();
  const targetUserId = searchParams.get("user");
  
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      
      // If targeting a specific user, create or get conversation
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

    // Load other user profiles
    const enrichedConvos = await Promise.all(
      convos.map(async (convo) => {
        const otherUserId = convo.participant1_id === userId ? convo.participant2_id : convo.participant1_id;
        
        const { data: profile } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .eq("user_id", otherUserId)
          .maybeSingle();

        // Get last message
        const { data: lastMsg } = await supabase
          .from("messages")
          .select("content")
          .eq("conversation_id", convo.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        return {
          ...convo,
          otherUser: profile || undefined,
          lastMessage: lastMsg?.content || ""
        };
      })
    );

    setConversations(enrichedConvos);
  };

  const openConversationWithUser = async (myId: string, theirId: string) => {
    // Check if conversation exists
    const { data: existing } = await supabase
      .from("conversations")
      .select("*")
      .or(`and(participant1_id.eq.${myId},participant2_id.eq.${theirId}),and(participant1_id.eq.${theirId},participant2_id.eq.${myId})`)
      .maybeSingle();

    let convo = existing;

    if (!convo) {
      // Create new conversation
      const { data: newConvo } = await supabase
        .from("conversations")
        .insert({ participant1_id: myId, participant2_id: theirId })
        .select()
        .single();
      
      convo = newConvo;
      await loadConversations(myId);
    }

    if (convo) {
      // Get other user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .eq("user_id", theirId)
        .maybeSingle();

      setActiveConversation({
        ...convo,
        otherUser: profile || undefined
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

    setMessages(data || []);

    // Mark messages as read
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

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConversation || !currentUserId) return;
    
    setIsSending(true);
    
    const { error } = await supabase
      .from("messages")
      .insert({
        conversation_id: activeConversation.id,
        sender_id: currentUserId,
        content: newMessage.trim()
      });

    if (!error) {
      setNewMessage("");
      await loadMessages(activeConversation.id);
      
      // Update conversation last_message_at
      await supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", activeConversation.id);
    }
    
    setIsSending(false);
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

  const filteredConversations = conversations.filter(c => 
    c.otherUser?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              <h2 className="text-lg font-semibold mb-3">Tin nhắn</h2>
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
                    <Avatar>
                      <AvatarImage src={convo.otherUser?.avatar_url || ""} />
                      <AvatarFallback>{convo.otherUser?.full_name?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{convo.otherUser?.full_name || "Người dùng"}</p>
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
                <div className="p-4 border-b border-border flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={() => setActiveConversation(null)}
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <Link to={`/user/${activeConversation.otherUser?.user_id}`}>
                    <Avatar>
                      <AvatarImage src={activeConversation.otherUser?.avatar_url || ""} />
                      <AvatarFallback>{activeConversation.otherUser?.full_name?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                  </Link>
                  <div>
                    <Link 
                      to={`/user/${activeConversation.otherUser?.user_id}`}
                      className="font-medium hover:underline"
                    >
                      {activeConversation.otherUser?.full_name || "Người dùng"}
                    </Link>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map(msg => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                            msg.sender_id === currentUserId
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <p className={`text-xs mt-1 ${
                            msg.sender_id === currentUserId ? 'text-primary-foreground/70' : 'text-muted-foreground'
                          }`}>
                            {formatDistanceToNow(new Date(msg.created_at), { locale: vi })}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="p-4 border-t border-border">
                  <form 
                    onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                    className="flex gap-2"
                  >
                    <Input
                      placeholder="Nhập tin nhắn..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      disabled={isSending}
                      className="flex-1"
                    />
                    <Button type="submit" disabled={isSending || !newMessage.trim()}>
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
    </div>
  );
}