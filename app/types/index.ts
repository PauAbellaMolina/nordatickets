import { DocumentReference } from "firebase/firestore";

export type User = {
  id: string;
  email: string;
  walletTicketGroups: WalletTicketGroups;
  eventIdsFollowing: string[];
  redsysToken?: string;
  cardNumber?: string;
  expiryDate?: string;
}

export class Event {
  public id?: string;
  public code?: number;
  public name?: string;
  public description?: string;
  public selling?: boolean;
  public ticketFee?: number; //in cents of euro (e.g. 0.25€ = 25)
  // public visible?: boolean; //TODO PAU make this a thing (basically not showing visible == false events in the list)
  public usedTicketBucketRef?: DocumentReference;
  public eventTickets?: EventTicket[]

  constructor(event: Event) {
    if (!event) {
      return;
    }
    Object.keys(event).forEach(key => {
      switch (key) {
        case 'eventTickets':
          this[key] = event[key].map(ticket => new EventTicket(ticket));
          break;
        default:
          this[key] = event[key];
          break;
      }
    });
  }
}

export class EventTicket {
  public eventTicketId?: string;
  public name?: string;
  public price?: number;
  public selling?: boolean;

  constructor(eventTicket: EventTicket) {
    if (!eventTicket) {
      return;
    }
    Object.keys(eventTicket).forEach(key => {
      this[key] = eventTicket[key];
    });
  }
};

export type WalletTicket = {
  id?: string;
  eventTicketId?: string;
  name?: string;
  price?: number;
  selling?: boolean;
  orderId?: string;
  orderStatus?: string;
  // activable?: boolean; //for the future, definetly not needed for the MVP
};

export type Cart = { eventTicket: EventTicket, quantity: number }[] | null;

export type WalletTicketGroup = {
  eventId: string;
  walletTickets: WalletTicket[];
};
export type WalletTicketGroups = WalletTicketGroup[] | null;