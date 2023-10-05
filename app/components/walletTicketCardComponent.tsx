import React, { useEffect, useState } from 'react';
import { Button, FlatList, Pressable, StyleSheet, useColorScheme } from 'react-native';
import { Text, View } from '../../components/Themed';
import { Event, Ticket, WalletTicketGroup } from '../types';
import Colors from '../../constants/Colors';
import { router } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { FIRESTORE_DB } from '../../firebaseConfig';

export interface Props {
  onRemoveTicket: (ticket: Ticket) => void,
  onAddTicket: (ticket: Ticket) => void,
  ticket: Ticket
}

export default function TicketCardComponent(walletTicket: WalletTicketGroup) {
  const theme = useColorScheme() ?? 'light';

  const [event, setEvent] = useState<Event>();

  useEffect(() => {
    const eventDocRef = doc(FIRESTORE_DB, 'events', walletTicket.eventId);
    getDoc(eventDocRef)
    .then((doc) => {
      if (doc.exists()) {
        const event = doc.data() as Event;
        event.id = doc.id;
        delete (event as any).ticketBucketRef;
        const ticketBucketRef = doc.data().ticketBucketRef;
        if (ticketBucketRef) {
          getDoc(ticketBucketRef)
          .then((doc) => {
            if (doc.exists()) {
              event.tickets = doc.data() as { tickets: Ticket[] };
              setEvent(event);
              console.log('PAU LOG-> event: ', event);
            } else {
              console.log('No tickets doc found');
            }
          });
        } else {
          setEvent(event);
        }
      } else {
        console.log('No event doc found with id: ', walletTicket.eventId);
      }
    });
  }, [walletTicket]);

  return (
    <>
      { event ?
        <>
          <View style={[styles.eventContainer, {backgroundColor: Colors[theme].backgroundContrast}]}>
            <Text style={styles.eventName}>{event.name}</Text>
            <FlatList
              style={styles.ticketsList}
              data={walletTicket.tickets}
              renderItem={({ item }) => <SingleTicketComponent ticket={item} />}
            />
          </View>
        </>
      :
        <></>
      }
    </>
  );
}

function SingleTicketComponent({ ticket }: { ticket: Ticket }) {
  const theme = useColorScheme() ?? 'light';

  return (
    <View style={[styles.singleTicketContainer, {backgroundColor: Colors[theme].background}]}>
      <Text style={styles.ticketName}>{ticket.name}</Text>
      <Button title='Activate' />
    </View>
  );
}

const styles = StyleSheet.create({
  eventContainer: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  eventName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5
  },
  ticketsList: {
    marginTop: 10,
    gap: 9
  },
  singleTicketContainer: {
    marginHorizontal: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#f2f2f2',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  ticketName: {
    fontSize: 19
  },
});