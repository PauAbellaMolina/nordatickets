import { Platform, Pressable, StyleSheet } from 'react-native';
import { EventTicket } from '../types/supabaseplain';
import Colors from '../constants/Colors';
import { Text, View } from './Themed';
import { FeatherIcon, FontAwesomeIcon } from './CustomIcons';
import { useSupabase } from '../context/SupabaseProvider';

export interface TicketCardComponentProps {
  eventSelling: boolean,
  quantityInCart: number,
  onRemoveTicket: (ticket: EventTicket) => void,
  onAddTicket: (ticket: EventTicket) => void,
  ticket: EventTicket
}

export default function EventTicketCardComponent({ticket, eventSelling, quantityInCart, onRemoveTicket, onAddTicket}: TicketCardComponentProps) {
  const { i18n, theme } = useSupabase();

  const onRemove = () => {
    if (quantityInCart === 0) {
      return;
    }
    onRemoveTicket(ticket);
  }
  const onAdd = () => {
    if (quantityInCart === 5) {
      return;
    }
    onAddTicket(ticket);
  }
  
  return (
    <View style={[styles.ticketCard, {backgroundColor: Colors[theme].backgroundContrast}]}>
      <View style={styles.ticketContents}>
        <View style={{flexDirection: 'row', gap: 10}}>
          <FontAwesomeIcon name="ticket" size={23} color={Colors[theme].text} />
          <Text style={styles.eventTitle}>{ticket.name} · {ticket.price/100}€</Text>
        </View>
        <View style={styles.ticketActions}>
          { eventSelling ? <>
            { ticket.selling ? <>
              <Pressable onPress={onRemove}>
                <FeatherIcon name="minus-circle" size={28} color={quantityInCart === 0 ? Colors[theme].text+'60' : Colors[theme].text} />
              </Pressable>
              <Text style={styles.quantityInCart}>{quantityInCart}</Text>
              <Pressable onPress={onAdd}>
                <FeatherIcon name="plus-circle" size={28} color={quantityInCart === 5 ? Colors[theme].text+'60' : Colors[theme].text} />
              </Pressable>
            </> :
              <Text style={styles.notAvailable}>{ i18n?.t('notAvailable') }</Text>
            }
          </> : <></> }
        </View>
      </View>
    </View>
  );
}

const eventCardMobileShadow = {
  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 1
  },
  shadowOpacity: 0.08,
  shadowRadius: 1
};

const styles = StyleSheet.create({
  ticketCard: {
    paddingVertical: 15,
    paddingLeft: 10,
    paddingRight: 15,
    marginBottom: 10,
    borderRadius: 10,
    ...Platform.select({
      web: {
        boxShadow: '0px 1px 1px rgba(0, 0, 0, 0.08)'
      },
      ios: {...eventCardMobileShadow},
      android: {...eventCardMobileShadow, elevation: 3}
    })
  },
  ticketContents: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  ticketActions: {
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
    marginHorizontal: 10
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  eventDescription: {
    marginTop: 5
  }
});