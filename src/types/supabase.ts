export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          full_name: string | null
          avatar_url: string | null
          university_id: string | null
          year: string | null
          branch: string | null
          badges: string[] | null
          is_free: boolean | null
          bio: string | null
          instagram: string | null
          snapchat: string | null
          created_at: string
        }
        Insert: {
          id: string
          username: string
          full_name?: string | null
          avatar_url?: string | null
          university_id?: string | null
          year?: string | null
          branch?: string | null
          badges?: string[] | null
          is_free?: boolean | null
          bio?: string | null
          instagram?: string | null
          snapchat?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          full_name?: string | null
          avatar_url?: string | null
          university_id?: string | null
          year?: string | null
          branch?: string | null
          badges?: string[] | null
          is_free?: boolean | null
          bio?: string | null
          instagram?: string | null
          snapchat?: string | null
          created_at?: string
        }
      }
      scenes: {
        Row: {
          id: string
          host_id: string
          title: string
          vibe_tag: string
          location: string
          max_participants: number | null
          start_time: string
          end_time: string | null
          is_active: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          host_id: string
          title: string
          vibe_tag: string
          location: string
          max_participants?: number | null
          start_time?: string
          end_time?: string | null
          is_active?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          host_id?: string
          title?: string
          vibe_tag?: string
          location?: string
          max_participants?: number | null
          start_time?: string
          end_time?: string | null
          is_active?: boolean | null
          created_at?: string
        }
      }
      scene_participants: {
        Row: {
          scene_id: string
          user_id: string
          joined_at: string
        }
        Insert: {
          scene_id: string
          user_id: string
          joined_at?: string
        }
        Update: {
          scene_id?: string
          user_id?: string
          joined_at?: string
        }
      }
      friendships: {
        Row: {
          id: string
          user_id1: string
          user_id2: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id1: string
          user_id2: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id1?: string
          user_id2?: string
          status?: string
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          scene_id: string
          sender_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          scene_id: string
          sender_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          scene_id?: string
          sender_id?: string
          content?: string
          created_at?: string
        }
      }
    }
  }
}
