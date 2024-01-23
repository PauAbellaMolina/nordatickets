import type { Database } from './supabase';

export type Event = Database['public']['Tables']['events']['Row'];
export type WalletTickets = Database['public']['Tables']['wallet_tickets']['Row'];