export type User = {
  id: string;
  phoneNumber: string;
  walletFunds: number;
  walletTicketGroups: WalletTicketGroups;
}

export type Event = {
  id: string;
  name: string;
  description: string;
  selling: boolean;
  tickets: { tickets: Ticket[] }
};

export type Ticket = {
  id: string;
  name: string;
  price: number;
};

export type Cart = Array<{ ticket: Ticket, quantity: number }> | null;

// export type WalletTicket = {
//   eventName: string;
//   ticket: Ticket;
// };
// export type WalletTickets = Array<WalletTicket> | null;

export type WalletTicketGroup = {
  eventId: string;
  tickets: Array<Ticket>;
};
export type WalletTicketGroups = Array<WalletTicketGroup> | null;