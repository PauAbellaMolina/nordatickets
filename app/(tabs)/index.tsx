import { Button, FlatList, StyleSheet } from 'react-native';

import EditScreenInfo from '../../components/EditScreenInfo';
import { Text, View } from '../../components/Themed';
import { useAuth } from '../../context/AuthProvider';
import { useEffect, useState } from 'react';
import { Link, router } from 'expo-router';
import { FIRESTORE_DB } from '../../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import EventCardComponent from '../components/eventCardComponent';
import { Event } from '../types';
import { useWallet } from '../../context/WalletProvider';

export default function TabOneScreen() {
  const { user } = useAuth();
  // const { funds, setFunds } = useWallet();
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    const colRef = collection(FIRESTORE_DB, 'events');
    getDocs(colRef)
    .then((querySnapshot) => {
      const collection: Event[] = [];
      querySnapshot.forEach((doc) => {
        const event = doc.data() as Event;
        event.id = doc.id;
        collection.push(event);
      });
      setEvents(collection);
      console.log('PAU LOG-> collection: ', collection);
    });
  }, []);

  // const onAddFunds = () => {
  //   setFunds(funds ? funds + 1 : 1);
  // };
  // const onSubstractFunds = () => {
  //   setFunds(funds ? funds - 1 : 0);
  // };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Event list</Text>
      <FlatList
        style={styles.eventList}
        data={events}
        renderItem={({ item }) => <EventCardComponent {...item} />}
        ItemSeparatorComponent={() => <View style={{height: 10}} />}
      />
      {/* <Link href="/wallet/modal" asChild>
        <Button
          title={'Add funds'}
          // onPress={onGoToAddFunds}
        />
      </Link> */}
      {/* <Button
        title={'Substract funds'}
        onPress={onSubstractFunds}
      /> */}
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
  // separator: {
  //   marginVertical: 30,
  //   height: 1,
  //   width: '80%',
  // },
  eventList: {
    marginTop: 10,
    gap: 10,
  },
});
