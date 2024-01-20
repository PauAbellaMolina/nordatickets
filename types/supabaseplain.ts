import type { Database } from './supabase';

export type Event = Database['public']['Tables']['events']['Row'];