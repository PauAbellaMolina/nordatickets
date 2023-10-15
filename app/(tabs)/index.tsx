import { FlatList, StyleSheet } from 'react-native';

import { Text, View } from '../../components/Themed';
import { useAuth } from '../../context/AuthProvider';
import { useEffect, useState } from 'react';
import { FIRESTORE_DB } from '../../firebaseConfig';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import EventCardComponent from '../components/eventCardComponent';
import { Event } from '../types';

export default function TabOneScreen() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    setEvents([]);
    
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
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Event list</Text>
      <FlatList
        style={styles.eventList}
        data={events}
        renderItem={({ item }) => <EventCardComponent {...item} />}
        ItemSeparatorComponent={() => <View style={{height: 10}} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 55,
    paddingHorizontal: 15,
    flex: 1,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
  },
  eventList: {
    marginTop: 10,
    gap: 10,
  },
});
