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

  useEffect(() => { //TODO PAU useMemo could also be used here, although useEffect does the same (and since this screen is only rendered once, it's not a problem) and it takes up cache memory.
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
    flex: 1
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold'
  },
  eventList: {
    marginTop: 10,
    gap: 10
  }
});
