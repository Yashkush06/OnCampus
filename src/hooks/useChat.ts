import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/supabase';

export type MessageWithSender = Database['public']['Tables']['messages']['Row'] & {
  sender?: {
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};

export function useChat(sceneId: string) {
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*, sender:profiles(username, full_name, avatar_url)')
        .eq('scene_id', sceneId)
        .order('created_at', { ascending: true });
        
      if (data) setMessages(data as MessageWithSender[]);
    };

    fetchMessages();

    // Subscribe to real-time inserts
    const channel = supabase
      .channel(`chat_${sceneId}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages', 
          filter: `scene_id=eq.${sceneId}` 
        },
        async (payload) => {
          const newMsg = payload.new as Database['public']['Tables']['messages']['Row'];
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, full_name, avatar_url')
            .eq('id', newMsg.sender_id)
            .single();
            
          const msgWithSender: MessageWithSender = {
            ...newMsg,
            sender: profile
          };
          setMessages((prev) => [...prev, msgWithSender]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sceneId, supabase]);

  const sendMessage = async (content: string, senderId: string) => {
    const { error } = await supabase
      .from('messages')
      .insert([{
        scene_id: sceneId,
        content,
        sender_id: senderId
      }] as any);
      
    if (error) console.error("Error sending message:", error);
    return { error };
  };

  return { messages, sendMessage };
}
