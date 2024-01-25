import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, useColorScheme } from 'react-native';
import { EventTicket } from '../types';
import Colors from '../constants/Colors';
import { Text, View } from './Themed';
import { FeatherIcon, FontAwesomeIcon } from './CustomIcons';

export interface TicketCardComponentProps {
  eventSelling: boolean,
  quantityInCart: number,
  onRemoveTicket: (ticket: EventTicket) => void,
  onAddTicket: (ticket: EventTicket) => void,
  ticket: EventTicket
}

export default function EventTicketCardComponent({eventSelling, quantityInCart, onRemoveTicket, onAddTicket, ticket}: TicketCardComponentProps) {
  const theme = useColorScheme() ?? 'light';
  const [eventBackgroundColor, setEventBackgroundColor] = useState<string>(Colors[theme].backgroundContrast);

  const chooseRandomColor = (): string => {
    const colors = Colors.eventBackgroundColorsArray[theme]
    const randomIndex = Math.floor(Math.random() * colors.length);
    return colors[randomIndex];
  };

  useEffect(() => {
    setEventBackgroundColor(chooseRandomColor);
  }, []);

  const onRemove = () => {
    if (quantityInCart === 0) {
      return;
    }
    onRemoveTicket(ticket);
  }
  const onAdd = () => {
    onAddTicket(ticket);
  }
  
  return (
    <View style={styles.ticketCard}>
      <View style={styles.ticketContents}>
        <View style={{flexDirection: 'row', gap: 10}}>
          <FontAwesomeIcon name="ticket" size={23} color={Colors[theme].text} />
          <Text style={styles.eventTitle}>{ticket.name} · {ticket.price/100}€</Text>
        </View>
        <View style={styles.ticketActions}>
          { eventSelling ? <>
            { ticket.selling ? <>
              <Pressable onPress={onRemove}>
                <FeatherIcon name="minus-circle" size={28} color={Colors[theme].text} />
              </Pressable>
              <Text style={styles.quantityInCart}>{quantityInCart}</Text>
              <Pressable onPress={onAdd}>
                <FeatherIcon name="plus-circle" size={28} color={Colors[theme].text} />
              </Pressable>
            </> :
              <Text style={styles.notAvailable}>No disponible</Text>
            }
          </> :
            <></>
          }
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ticketCard: {
    paddingVertical: 15,
    paddingLeft: 10,
    paddingRight: 15,
    marginBottom: 10,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 1,
    elevation: 10
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
  quantityInCart: {
    width: 45,
    fontSize: 18,
    textAlign: 'center'
  },
  notAvailable: {
    fontSize: 13,
    color: '#606175'
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