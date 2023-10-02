export interface Event {
  id: string;
  name: string;
  description: string;
  selling: boolean;
  tickets: { tickets: Ticket[] }
}

export interface Ticket {
  id: string;
  name: string;
  price: number;
}
