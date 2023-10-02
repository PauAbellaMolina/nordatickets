import React from 'react';
import { Pressable, StyleSheet, useColorScheme } from 'react-native';
import { Text, View } from '../../components/Themed';
import { Event, Ticket } from '../types/Event';
import Colors from '../../constants/Colors';
import { router } from 'expo-router';

export default function TicketCardComponent(ticket: Ticket ) {
  const theme = useColorScheme() ?? 'light';

  // const goToEventDetail = () => {
  //   router.push(`/event/${event.id}`);
  // }
  
  return (
    // <Pressable onPress={goToEventDetail}>
      <View style={[styles.eventCard, {backgroundColor: Colors[theme].backgroundContrast}]}>
        <Text style={styles.eventTitle}>{ticket.name} · {ticket.price}€</Text>
      </View>
    // </Pressable>
  );
}

const styles = StyleSheet.create({
  eventCard: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    // alignItems: 'center',
  },
  roundedSquare: {
    backgroundColor: '#ff7f50',
    borderRadius: 10,
    width: 90,
    height: 90,
  },
  eventInfo: {
    width: '70%',
    marginTop: 5,
    marginHorizontal: 10,
    backgroundColor: 'transparent'
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  eventDescription: {
    marginTop: 5,
  },
});