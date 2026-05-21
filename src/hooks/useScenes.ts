import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/supabase';

export type SceneWithHost = Database['public']['Tables']['scenes']['Row'] & {
  host?: {
    username: string;
    full_name: string | null;
    avatar_url: string | null;
    is_free: boolean | null;
  } | null;
  scene_participants?: {
    user_id: string;
  }[] | null;
};

export function useScenes(category?: string) {
  const [scenes, setScenes] = useState<SceneWithHost[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const fetchScenes = async () => {
      let query = supabase
        .from('scenes')
        .select('*, host:profiles!host_id(username, full_name, avatar_url, is_free), scene_participants(user_id)')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
        
      if (category && category !== 'Nearby') {
        query = query.eq('vibe_tag', category.toLowerCase());
      }
        
      const { data, error } = await query;
      if (data) setScenes(data as SceneWithHost[]);
    };

    fetchScenes();

    // Subscribe to live scene updates
    const channel = supabase
      .channel('live-scenes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'scenes' },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const newScene = payload.new as Database['public']['Tables']['scenes']['Row'];
            const { data: profile } = await supabase
              .from('profiles')
              .select('username, full_name, avatar_url, is_free')
              .eq('id', newScene.host_id)
              .single();
              
            const sceneWithHost: SceneWithHost = {
              ...newScene,
              host: profile,
              scene_participants: [{ user_id: newScene.host_id }] // Host is implicitly a participant
            };
            setScenes((prev) => [sceneWithHost, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            const updatedScene = payload.new as Database['public']['Tables']['scenes']['Row'];
            const { data: profile } = await supabase
              .from('profiles')
              .select('username, full_name, avatar_url, is_free')
              .eq('id', updatedScene.host_id)
              .single();
              
            const { data: participants } = await supabase
              .from('scene_participants')
              .select('user_id')
              .eq('scene_id', updatedScene.id);
              
            const sceneWithHost: SceneWithHost = {
              ...updatedScene,
              host: profile,
              scene_participants: participants || []
            };
            setScenes((prev) => prev.map(s => s.id === updatedScene.id ? sceneWithHost : s));
          } else if (payload.eventType === 'DELETE') {
            setScenes((prev) => prev.filter(s => s.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [category, supabase]);

  const filteredScenes = scenes.filter((scene) => {
    const participants = scene.scene_participants?.length || 0;
    if (participants > 0) return true;
    
    // Auto remove empty rooms after 5 minutes
    // Ensure we parse the timestamp as UTC to prevent timezone bugs
    let createdStr = scene.created_at;
    if (!createdStr.endsWith('Z') && !createdStr.includes('+')) {
      createdStr += 'Z';
    }
    const ageMs = Date.now() - new Date(createdStr).getTime();
    return ageMs < 5 * 60 * 1000;
  });

  return { scenes: filteredScenes };
}
