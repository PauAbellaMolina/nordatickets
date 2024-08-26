import { Platform, Pressable, ScrollView, StyleSheet } from 'react-native';
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
    if (quantityInCart === 10) {
      return;
    }
    onAddTicket(ticket);
  }
  
  const getTicketPriceMinWidth = () => {
    if (!ticket.price) return;
    switch ((ticket.price/100).toString().length) {
      case 1:
        return 60;
      case 2:
      case 3:
      case 4:
        return 80;
      case 5:
        return 103;
      case 6:
        return 115;
      default:
        return 103;
    }
  }
  
  return (
    <View style={[styles.ticketCard, {backgroundColor: Colors[theme].backgroundContrast}]}>
      <View style={styles.ticketContents}>
        <View style={styles.ticketInfo}>
          <FontAwesomeIcon name="ticket" size={23} color={Colors[theme].text} />
          <View style={styles.ticketInfoText}>
            <ScrollView horizontal>
              <Text style={styles.ticketName}>{ticket.name}</Text>
            </ScrollView>
            <Text style={[styles.ticketPrice, {minWidth: getTicketPriceMinWidth()}]}> · {ticket.price/100}€</Text>
          </View>
        </View>
        <View style={styles.ticketActions}>
          { eventSelling ? <>
            { ticket.selling ? <>
              <Pressable onPress={onRemove}>
                <FeatherIcon name="minus-circle" size={28} color={quantityInCart === 0 ? Colors[theme].text+'60' : Colors[theme].text} />
              </Pressable>
              <Text style={styles.quantityInCart}>{quantityInCart}</Text>
              <Pressable onPress={onAdd}>
                <FeatherIcon name="plus-circle" size={28} color={quantityInCart === 10 ? Colors[theme].text+'60' : Colors[theme].text} />
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
    padding: 15,
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
    textAlign: 'center',
    fontSize: 13,
    color: '#606175',
    width: 101
  },
  ticketInfo: {
    flex: 1,
    flexDirection: 'row',
    gap: 10
  },
  ticketInfoText: {
    maxWidth: '90%',
    flexDirection: 'row',
    alignItems: 'center'
  },
  ticketName: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  ticketPrice: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  ticketDescription: {
    marginTop: 5
  }
});