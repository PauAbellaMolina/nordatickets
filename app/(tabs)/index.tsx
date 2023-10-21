import { useEffect, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { FIRESTORE_DB } from '../../firebaseConfig';
import { useAuth } from '../../context/AuthProvider';
import { Event } from '../types';
import { Text, View } from '../../components/Themed';
import EventCardComponent from '../components/eventCardComponent';

export default function TabOneScreen() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => { //TODO PAU info useMemo could also be used here, although useEffect does the same (and since this screen is only rendered once, it's not a problem) and it takes up cache memory.
    setEvents([]);
    if (!user?.eventIdsFollowing) {
      return;
    }
    user?.eventIdsFollowing?.forEach((eventId) => {
      const docRef = doc(FIRESTORE_DB, 'events', eventId);
      getDoc(docRef)
      .then((doc) => {
        if (doc.exists()) {
          const event = doc.data() as Event;
          event.id = doc.id;
          setEvents((prevEvents) => [...prevEvents, event]);
        }
      });
    });

    //TODO PAU info following code is for retrieving all events and not just the ones the user is following
    // const colRef = collection(FIRESTORE_DB, 'events');
    // getDocs(colRef)
    // .then((querySnapshot) => {
    //   const collection: Event[] = [];
    //   querySnapshot.forEach((doc) => {
    //     const event = doc.data() as Event;
    //     event.id = doc.id;
    //     collection.push(event);
    //   });
    //   setEvents(collection);
    //   // console.log('PAU LOG-> collection: ', collection);
    // });
  }, [user?.eventIdsFollowing]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Event list</Text>
      <Text style={styles.infoLabel}>Scan the QR code of the event to add</Text>
      <FlatList
        style={styles.eventList}
        data={events}
        renderItem={({ item }) => <EventCardComponent {...item} />}
        ItemSeparatorComponent={() => <View style={{height: 10, backgroundColor: 'transparent'}} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    paddingTop: 60,
    paddingBottom: 5,
    paddingHorizontal: 15,
    flex: 1
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold'
  },
  infoLabel: {
    fontSize: 13,
    marginLeft: 2,
    color: '#8C90A3'
  },
  eventList: {
    marginTop: 20,
    gap: 10
  }
});
