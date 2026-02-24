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
          email: string | null
          full_name: string | null
          username: string | null
          role: 'reader' | 'author' | 'admin'
          avatar_url: string | null
          bio: string | null
          website: string | null
          is_verified: boolean
          coins: number
          interests: string[] | null
          created_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          username?: string | null
          role?: 'reader' | 'author' | 'admin'
          // ... (lahat ng fields na pwede i-insert)
        }
        Update: {
          // ... (lahat ng fields na pwede i-update)
          full_name?: string | null
          bio?: string | null
          // etc.
        }
      }
      books: {
        Row: {
          id: string
          title: string
          author_id: string
          cover_url: string | null
          description: string | null
          genre: string
          status: 'pending_review' | 'approved' | 'rejected' | 'draft'
          price: number
          views_count: number
          rating: number
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          author_id: string
          cover_url?: string | null
          description?: string | null
          genre: string
          status?: 'pending_review' | 'approved' | 'rejected' | 'draft'
          price?: number
          views_count?: number
          rating?: number
          created_at?: string
        }
        Update: {
          title?: string
          author_id?: string
          cover_url?: string | null
          description?: string | null
          genre?: string
          status?: 'pending_review' | 'approved' | 'rejected' | 'draft'
          price?: number
          views_count?: number
          rating?: number
          created_at?: string
        }
      }
      chapters: {
        Row: {
          id: string
          book_id: string
          title: string
          content: string
          sequence_number: number
          is_locked: boolean
          created_at: string
        }
        Insert: {
          id?: string
          book_id: string
          title: string
          content: string
          sequence_number: number
          is_locked: boolean
          created_at?: string
        }
        Update: {
          id?: string
          book_id?: string
          title?: string
          content?: string
          sequence_number?: number
          is_locked?: boolean
          created_at?: string
        }
      }
      interactions: {
        Row: {
          id: string
          user_id: string
          book_id: string
          action_type: string
          created_at: string
        }
      }
    }
  }
}

