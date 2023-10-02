import React from 'react';
import { Button, Pressable, StyleSheet, useColorScheme } from 'react-native';
import { Text, View } from '../../components/Themed';
import { Event, Ticket, WalletTicket } from '../types';
import Colors from '../../constants/Colors';
import { router } from 'expo-router';

export interface Props {
  onRemoveTicket: (ticket: Ticket) => void,
  onAddTicket: (ticket: Ticket) => void,
  ticket: Ticket
}

export default function TicketCardComponent(walletTicket: WalletTicket) {
  const theme = useColorScheme() ?? 'light';

  // const goToEventDetail = () => {
  //   router.push(`/event/${event.id}`);
  // }

  return (
    // <Pressable onPress={goToEventDetail}>
      <View style={[styles.ticketCard, {backgroundColor: Colors[theme].backgroundContrast}]}>
        <View style={styles.ticketContents}><Text style={styles.ticketName}>{walletTicket.ticket.name}</Text><Text style={styles.eventName}>{walletTicket.eventName}</Text></View>
      </View>
    // </Pressable>
  );
}

const styles = StyleSheet.create({
  ticketCard: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    // alignItems: 'center',
  },
  ticketContents: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  eventName: {
    fontSize: 12,
  }
});