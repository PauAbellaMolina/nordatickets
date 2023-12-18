import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, TextInput, useColorScheme } from 'react-native';
import { collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { FIRESTORE_DB } from '../../firebaseConfig';
import { useAuth } from '../../context/AuthProvider';
import { Event } from '../types';
import { Text, View } from '../../components/Themed';
import EventCardComponent from '../components/eventCardComponent';
import { FeatherIcon } from '../components/icons';
import Colors from '../../constants/Colors';

export default function TabOneScreen() {
  const theme = useColorScheme() ?? 'light';
  const { user, setUser } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [eventInput, setEventInput] = useState<string>('');
  const [showEventInput, setShowEventInput] = useState<boolean>(false);
  const [inputEventLoading, setInputEventLoading] = useState<boolean>(false);

  useEffect(() => { //TODO PAU info useMemo could also be used here, although useEffect does the same (and since this screen is only rendered once, it's not a problem) and it takes up cache memory.
    setEvents([]);
    if (!user?.eventIdsFollowing) {
      return;
    }
    user?.eventIdsFollowing?.forEach((eventId) => {
      const docRef = doc(FIRESTORE_DB, 'events', eventId);
      getDoc(docRef)
      .then((doc) => {
        if (!doc.exists()) {
          return;
        }
        const event = doc.data() as Event;
        event.id = doc.id;
        setEvents((prevEvents) => [...prevEvents, event]);
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

  const onAddEvent = () => {
    setShowEventInput(!showEventInput);
  };

  const onAddEventInput = () => {
    if (!eventInput) {
      return;
    }
    const alreadyFollowingEvent = events.find((event) => event.code === +eventInput);
    if (alreadyFollowingEvent) {
      setShowEventInput(false);
      return;
    }
    setInputEventLoading(true);
    const c = collection(FIRESTORE_DB, 'events');
    const q = query(c, where('code', '==', +eventInput));
    getDocs(q)
    .then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        if (!doc.exists()) {
          return;
        }
        addEventToUser(doc.id);
      });
    });
  };

  const addEventToUser = (eventId: string) => {
    if (!eventId || !user || user.eventIdsFollowing.includes(eventId as string)) {
      return;
    }
    const userDocRef = doc(FIRESTORE_DB, 'users', user.id);
    updateDoc(userDocRef, {
      eventIdsFollowing: [...user.eventIdsFollowing, eventId]
    }).then(() => {
      setUser({
        ...user,
        eventIdsFollowing: [...user.eventIdsFollowing, eventId as string]
      });
    })
    .finally(() => {
      setInputEventLoading(false);
      setShowEventInput(false);
    });
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{backgroundColor: 'transparent'}}>
          <Text style={styles.title}>Esdeveniments</Text>
          <Text style={styles.infoLabel}>Afegeix un esdeveniment pel el seu codi</Text>
        </View>
        <Pressable onPress={onAddEvent}>
          <FeatherIcon name="plus-circle" size={30} color={Colors[theme].text} />
        </Pressable>
      </View>
      { showEventInput ? <>
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, {color: Colors[theme].text}]}
            keyboardType={'number-pad'}
            placeholder="Codi"
            onChangeText={setEventInput}
          />
          { inputEventLoading ?
            <ActivityIndicator style={{marginHorizontal: 12}} size="small" />
          :
            <Pressable onPress={onAddEventInput}><Text style={{color: '#007aff', textAlign: 'center'}}>Afegir</Text></Pressable>
          }
        </View>
      </> : null }
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
    flex: 1,
    gap: 20
  },
  header: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginRight: 10
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
  inputContainer: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10
  },
  input: {
    flex: 1,
    paddingVertical: 3,
    pointerEvents: 'box-only',
    borderColor: '#007aff',
    borderRadius: 15,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 25,
    textAlign: 'center',
    maxWidth: 250,
    minWidth: 50
  },
  eventList: {
    gap: 10
  }
});
