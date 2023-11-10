export type User = {
  id: string;
  email: string;
  walletTicketGroups: WalletTicketGroups;
  eventIdsFollowing: Array<string>;
}

export type Event = {
  id: string;
  name: string;
  description: string;
  selling: boolean;
  ticketFee: number; //in cents of euro (e.g. 0.25€ = 25)
  // visible: boolean; //TODO PAU make this a thing (basically not showing visible == false events in the list)
  usedTicketBucketId: string;
  tickets: { tickets: Array<Ticket> }
};

export type Ticket = {
  id: string;
  ticketId: string;
  name: string;
  price: number;
  selling?: boolean;
  orderId?: string;
  // activable: boolean; //for the future, definetly not needed for the MVP
};

export type Cart = Array<{ ticket: Ticket, quantity: number }> | null;

export type WalletTicketGroup = {
  eventId: string;
  tickets: Array<Ticket>;
};
export type WalletTicketGroups = Array<WalletTicketGroup> | null;