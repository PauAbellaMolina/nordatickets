import { useEffect, useState } from 'react';
import { ActivityIndicator, Button, FlatList, StyleSheet, useColorScheme } from 'react-native';
import { router } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { FIRESTORE_DB } from '../../firebaseConfig';
import { Event, Ticket, WalletTicketGroup } from '../types';
import Colors from '../../constants/Colors';
import { Text, View } from '../../components/Themed';

export default function WalletTicketGroupCardComponent(walletTicket: WalletTicketGroup) {
  const theme = useColorScheme() ?? 'light';
  const [event, setEvent] = useState<Event>();

  useEffect(() => {
    const eventDocRef = doc(FIRESTORE_DB, 'events', walletTicket.eventId);
    getDoc(eventDocRef)
    .then((doc) => {
      if (doc.exists()) {
        const event = doc.data() as Event;
        event.id = doc.id;
        event.usedTicketBucketId = doc.data().usedTicketBucketRef.id;
        delete (event as any).ticketBucketRef;
        delete (event as any).usedTicketBucketRef;
        setEvent(event);
      } else {
        console.log('No event doc found with id: ', walletTicket.eventId);
      }
    });
  }, []);

  const SingleTicketComponent = ({ ticket }: { ticket: Ticket }) => {
    const onActivateTicket = () => {
      router.push(`/wallet/activateTicket/${event?.id}/${event?.name}/${ticket.id}/${ticket.ticketId}/${ticket.name}/${ticket.price}/${event?.usedTicketBucketId}`);
    };
  
    return (
      <View style={[styles.singleTicketContainer, {backgroundColor: Colors[theme].background}]}>
        <Text style={styles.ticketName}>{ticket.name}</Text>
        <Button title='Activate' onPress={onActivateTicket} />
      </View>
    );
  };
  
  return (
    <>
      { event ?
        <View style={[styles.eventContainer, {backgroundColor: Colors[theme].backgroundContrast}]}>
          <Text style={styles.eventName}>{event.name}</Text>
          <FlatList
            style={styles.ticketsList}
            data={walletTicket.tickets}
            renderItem={({ item }) => <SingleTicketComponent ticket={item} />}
          />
        </View>
      :
        <ActivityIndicator style={{marginTop: '25%'}} size="large" />
      }
    </>
  );
}

const styles = StyleSheet.create({
  eventContainer: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10
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
  }
});