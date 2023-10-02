import { Button, FlatList, StyleSheet } from 'react-native';

import EditScreenInfo from '../../components/EditScreenInfo';
import { Text, View } from '../../components/Themed';
import { useAuth } from '../../context/AuthProvider';
import { useFunds } from '../../context/WalletProvider';
import { useEffect, useState } from 'react';
import { Link, router } from 'expo-router';
import { FIRESTORE_DB } from '../../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import EventCardComponent from '../components/eventCardComponent';
import { Event } from '../types/Event';

export default function TabOneScreen() {
  const { user } = useAuth();
  const { funds, setFunds } = useFunds();
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    const colRef = collection(FIRESTORE_DB, 'events');
    getDocs(colRef)
    .then((querySnapshot) => {
      const collection: Event[] = [];
      querySnapshot.forEach((doc) => {
        collection.push(doc.data() as Event);
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
      <Text style={styles.title}>Tab One</Text>
      <Text style={styles.title}>Hello, { user?.phoneNumber }</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      <FlatList
        data={events}
        renderItem={({ item }) => <EventCardComponent {...item} />}
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
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});
