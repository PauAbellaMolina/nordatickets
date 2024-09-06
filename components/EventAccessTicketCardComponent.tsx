import { Platform, Pressable, StyleSheet } from 'react-native';
import { EventTicket, TicketFormSubmit } from '../types/supabaseplain';
import Colors from '../constants/Colors';
import { Text, View } from './Themed';
import { FeatherIcon, FontAwesome6Icon } from './CustomIcons';
import { useSupabase } from '../context/SupabaseProvider';
import EventTicketCardFormComponent from './EventTicketCardFormComponent';
import { CollapsableComponent } from './CollapsableComponent';
import { useState } from 'react';

export interface TicketCardComponentProps {
  eventSelling: boolean,
  quantityInCart: number,
  onRemoveTicket: (ticket: EventTicket) => void,
  onAddTicket: (ticket: EventTicket, associatedTicketFormSubmit?: Partial<TicketFormSubmit>) => void,
  ticket: EventTicket
}

export default function EventAccessTicketCardComponent({ticket, eventSelling, quantityInCart, onRemoveTicket, onAddTicket}: TicketCardComponentProps) {
  const { i18n, theme } = useSupabase();

  const [formExpanded, setFormExpanded] = useState<boolean>(false);
  const [formSubmitted, setFormSubmitted] = useState<boolean>(false);
  const [priceMultiplier, setPriceMultiplier] = useState<number>(1);

  const onExpandForm = () => {
    setFormExpanded(!formExpanded);
  };

  const onRemove = () => {
    setFormSubmitted(false);
    setFormExpanded(false);
    if (quantityInCart === 0) {
      return;
    }
    onRemoveTicket(ticket);
  };
  const onAdd = () => {
    if (quantityInCart === 10) {
      return;
    }
    const newTicket = {...ticket};
    if (priceMultiplier > 1) {
      newTicket.price = newTicket.price * priceMultiplier;
    }
    onAddTicket(newTicket);
  };

  const handlePriceMultiplierChange = (priceMultiplier: number) => {
    setPriceMultiplier(priceMultiplier);
  };

  const onFormSubmit = (ticketFormSubmit: Partial<TicketFormSubmit>) => {
    if (quantityInCart === 10) {
      return;
    }
    setFormSubmitted(true);
    const newTicket = {...ticket};
    if (priceMultiplier > 1) {
      newTicket.price = newTicket.price * priceMultiplier;
    }
    onAddTicket(newTicket, ticketFormSubmit);
  };
  
  return (
    <View style={[styles.ticketCard, {backgroundColor: Colors[theme].backgroundContrast}]}>
      <View style={styles.ticketContents}>
        <View style={styles.ticketInfo}>
          <FontAwesome6Icon name="person-walking-arrow-right" size={20} color={Colors[theme].text} />
          <View style={styles.ticketInfoText}>
            <Text style={styles.ticketName}>{ticket.name} · {ticket.price/100 * priceMultiplier}€</Text>
            { ticket?.description ?
              <Text style={styles.ticketDescription}>{ i18n?.t(ticket.description) }</Text>
            : null}
          </View>
        </View>
        <View style={styles.ticketActions}>
          { eventSelling ? <>
            { ticket.selling ? <>
              { ticket.ticket_form_templates_id ?
                <Pressable onPress={formSubmitted ? onRemove : onExpandForm}>
                  <FeatherIcon name={formSubmitted ? 'x-circle' : formExpanded ? 'chevron-up' : 'chevron-down'} size={28} color={Colors[theme].text} />
                </Pressable>
              :
                <Pressable onPress={quantityInCart === 1 ? onRemove : onAdd}>
                  <FeatherIcon name={quantityInCart === 1 ? 'x-circle' : 'plus-circle'} size={28} color={quantityInCart === 10 ? Colors[theme].text+'60' : Colors[theme].text} />
                </Pressable>
              }
            </> :
              <Text style={styles.notAvailable}>{ i18n?.t('notAvailable') }</Text>
            }
          </> : null }
        </View>
      </View>
      { ticket.ticket_form_templates_id ?
        <CollapsableComponent expanded={formExpanded} maxHeight={200}>
          <EventTicketCardFormComponent event_id={ticket.event_id} ticket_form_templates_id={ticket.ticket_form_templates_id} formSubmitted={formSubmitted} onPriceMultiplierChange={handlePriceMultiplierChange} onSubmit={onFormSubmit} />
        </CollapsableComponent>
      : null }
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
    fontSize: 12,
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
  ticketDescription: {
    fontSize: 14,
    color: '#606175'
  },
  ticketPrice: {
    fontSize: 20,
    fontWeight: 'bold'
  }
});
