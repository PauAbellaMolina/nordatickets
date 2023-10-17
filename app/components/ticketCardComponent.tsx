import React from 'react';
import { Button, StyleSheet, useColorScheme } from 'react-native';
import { Ticket } from '../types';
import Colors from '../../constants/Colors';
import { Text, View } from '../../components/Themed';

export interface TicketCardComponentProps {
  showRemoveButton: boolean,
  onRemoveTicket: (ticket: Ticket) => void,
  onAddTicket: (ticket: Ticket) => void,
  ticket: Ticket
}

export default function TicketCardComponent({ showRemoveButton, onRemoveTicket, onAddTicket, ticket}: TicketCardComponentProps) {
  const theme = useColorScheme() ?? 'light';

  const onRemove = () => {
    onRemoveTicket(ticket);
  }

  const onAdd = () => {
    onAddTicket(ticket);
  }
  
  return (
    <View style={[styles.ticketCard, {backgroundColor: Colors[theme].backgroundContrast}]}>
      <View style={styles.ticketContents}>
        <Text style={styles.eventTitle}>{ticket.name} · {ticket.price}€</Text>
        <View style={styles.ticketActions}>
          { showRemoveButton ?
            <Button title='Remove' onPress={onRemove} />
          :
            <></>
          }
          { ticket.selling ?
            <Button title='Add' onPress={onAdd} />
          :
            <Button disabled title='Not available' />
          }
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ticketCard: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10
  },
  ticketContents: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  ticketActions: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  roundedSquare: {
    backgroundColor: '#ff7f50',
    borderRadius: 10,
    width: 90,
    height: 90
  },
  eventInfo: {
    width: '70%',
    marginTop: 5,
    marginHorizontal: 10,
    backgroundColor: 'transparent'
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  eventDescription: {
    marginTop: 5
  }
});