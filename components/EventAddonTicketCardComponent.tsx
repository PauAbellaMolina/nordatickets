import { Platform, Pressable, ScrollView, StyleSheet } from 'react-native';
import { EventTicket } from '../types/supabaseplain';
import Colors from '../constants/Colors';
import { Text, View } from './Themed';
import { EntypoIcon, FeatherIcon } from './CustomIcons';
import { useSupabase } from '../context/SupabaseProvider';

export interface TicketCardComponentProps {
  eventSelling: boolean,
  quantityInCart: number,
  onRemoveTicket: (ticket: EventTicket) => void,
  onAddTicket: (ticket: EventTicket) => void,
  ticket: EventTicket
}

export default function EventAddonTicketCardComponent({ticket, eventSelling, quantityInCart, onRemoveTicket, onAddTicket}: TicketCardComponentProps) {
  const { i18n, theme } = useSupabase();

  const onRemove = () => {
    if (quantityInCart === 0) {
      return;
    }
    onRemoveTicket(ticket);
  };
  const onAdd = () => {
    if (quantityInCart === 5) {
      return;
    }
    onAddTicket(ticket);
  };
  
  return (
    <View style={[styles.ticketCard, {backgroundColor: Colors[theme].backgroundContrast}]}>
      <View style={styles.ticketContents}>
        <View style={styles.ticketInfo}>
          <EntypoIcon name="cup" size={23} color={Colors[theme].text} />
          <View style={styles.ticketInfoText}>
            <ScrollView horizontal>
              <Text style={styles.ticketName}>{ticket.name} · {ticket.price/100}€</Text>
            </ScrollView>
            <Text style={styles.ticketSubtitle}>{ ticket.type === 'ADDON_REFUNDABLE' ? i18n?.t('eventTicketRefundableAddonExplanation') : i18n?.t('eventTicketNonRefundableAddonExplanation') }</Text>
          </View>
        </View>
        <View style={styles.ticketActions}>
          { eventSelling ? <>
            { ticket.selling ? <>
              <Pressable onPress={quantityInCart === 1 ? onRemove : onAdd}>
                <FeatherIcon name={quantityInCart === 1 ? 'x-circle' : 'plus-circle'} size={28} color={quantityInCart === 5 ? Colors[theme].text+'60' : Colors[theme].text} />
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
    alignItems: 'center',
    gap: 25
  },
  ticketActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  quantityInCart: {
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
    flexDirection: 'column',
    maxWidth: '90%',
    gap: 3
  },
  ticketName: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  ticketSubtitle: {
    fontSize: 14,
    color: '#606175'
  },
  ticketPrice: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  ticketDescription: {
    marginTop: 5
  }
});