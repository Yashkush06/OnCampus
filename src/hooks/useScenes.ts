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

export function useScenes(category?: string, currentUserId?: string) {
  const [scenes, setScenes] = useState<SceneWithHost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
        
      const { data, error: fetchError } = await query;
      if (fetchError) {
        setError(fetchError.message);
      } else if (data) {
        setScenes(data as SceneWithHost[]);
        setError(null);
      }
      setLoading(false);
    };

    setLoading(true);
    fetchScenes();

    // Subscribe to live scene updates
    const channel = supabase
      .channel('live-scenes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'scenes' },
        async (payload: any) => {
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
              scene_participants: [{ user_id: newScene.host_id }]
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

    // Fallback polling every 30 seconds
    const intervalId = setInterval(() => {
      fetchScenes();
    }, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(intervalId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const filteredScenes = scenes.filter((scene) => {
    const participants = scene.scene_participants?.length || 0;
    if (participants > 0) return true;
    
    let createdStr = scene.created_at;
    if (!createdStr) return true;
    
    createdStr = createdStr.replace(' ', 'T');
    
    if (!createdStr.endsWith('Z') && !createdStr.includes('+')) {
      createdStr += 'Z';
    }
    
    const createdDate = new Date(createdStr);
    
    if (isNaN(createdDate.getTime())) return true;
    
    const ageMs = Date.now() - createdDate.getTime();
    
    if (ageMs < 0) return true;
    
    return ageMs < 5 * 60 * 1000;
  });

  return { scenes: filteredScenes, loading, error };
}
