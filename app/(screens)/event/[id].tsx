import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Button, Dimensions, FlatList, Platform, StyleSheet } from 'react-native';

import { Text, View } from '../../../components/Themed';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { FIRESTORE_DB } from '../../../firebaseConfig';
import { Event, Ticket } from '../../types/Event';
import TicketCardComponent from '../../components/ticketCardComponent';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams();
  const [event, setEvent] = useState<Event>();
  const [cart, setCart] = useState<Ticket[]>();

  // const halfWindowsWidth = Dimensions.get('window').height / 2

  useEffect(() => {
    // query(collection(FIRESTORE_DB, 'reminders'), where('groupId', '==', group.id));
    const eventDocRef = doc(FIRESTORE_DB, 'events', id as string);
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
              // console.log('PAU LOG-> event: ', event);
            } else {
              console.log('No references doc found');
            }
          });
        } else {
          setEvent(event);
        }
      } else {
        console.log('No doc found with id: ', id);
      }
    });
  }, []);
  
  return (
    <View style={styles.container}>
      { event ?
        <>
          <Text style={styles.title}>{ event?.name }</Text>
          <Text ellipsizeMode='tail' numberOfLines={2} style={styles.eventDescription}>{event.description || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt'}</Text>
          <View style={styles.ticketsContainer}>
            <Text style={styles.subtitle}>Tickets:</Text>
            <FlatList
              style={styles.ticketsList}
              data={event.tickets.tickets}
              renderItem={({ item }) => <TicketCardComponent {...item} />}
              ItemSeparatorComponent={() => <View style={{height: 10}} />}
            />
          </View>
        </>
        :
        <ActivityIndicator style={{marginTop: '90%'}} size="large" />
      }
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </View> 
  );
}

const styles = StyleSheet.create({
  container: {
    // paddingTop: 55,
    paddingTop: 15,
    paddingHorizontal: 15,
    flex: 1,
    // borderWidth: 1,
    // borderColor: 'red',
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 25,
    fontWeight: 'bold',
  },
  eventDescription: {
    fontSize: 18,
    marginTop: 10,
    marginLeft: 10,
  },
  ticketsContainer: {
    marginTop: 30,
    marginHorizontal: 10,
    // borderWidth: 1,
    // borderColor: 'blue',
  },
  ticketsList: {
    marginTop: 10,
    gap: 10,
  },
  // separator: {
  //   marginVertical: 30,
  //   height: 1,
  //   width: '80%',
  // },
});
