import { Platform, Pressable, StyleSheet } from 'react-native';
import { EventTicket, TicketFormSubmit } from '../types/supabaseplain';
import Colors from '../constants/Colors';
import { Text, View } from './Themed';
import { FeatherIcon, FontAwesome6Icon } from './CustomIcons';
import { useSupabase } from '../context/SupabaseProvider';
import EventTicketCardFormComponent from './EventTicketCardFormComponent';
import { CollapsableComponent } from './CollapsableComponent';
import { useState } from 'react';
import { Picker } from '@react-native-picker/picker';

export interface TicketCardComponentProps {
  ticket: EventTicket,
  eventSelling: boolean,
  quantityInCart: number,
  onRemoveTicket: (ticket: EventTicket) => void,
  onAddTicket: (ticket: EventTicket, associatedTicketFormSubmit?: Partial<TicketFormSubmit>) => void,
  onAddTicketQuantity: (ticket: EventTicket, quantity: number, associatedTicketFormSubmit?: Partial<TicketFormSubmit>) => void
}

export default function EventAccessTicketCardComponent({ticket, eventSelling, quantityInCart, onRemoveTicket, onAddTicket, onAddTicketQuantity}: TicketCardComponentProps) {
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
    if (quantityInCart === 100) {
      return;
    }
    const newTicket = {...ticket};
    if (priceMultiplier > 1) {
      newTicket.price = newTicket.price * priceMultiplier;
    }
    onAddTicket(newTicket);
  };

  const onSelectedQuantity = (quantity: number) => {
    if (quantityInCart === 100) {
      return;
    }
    const newTicket = {...ticket};
    if (priceMultiplier > 1) {
      newTicket.price = newTicket.price * priceMultiplier;
    }
    onAddTicketQuantity(newTicket, quantity);
  };

  const handlePriceMultiplierChange = (priceMultiplier: number) => {
    setPriceMultiplier(priceMultiplier);
  };

  const onFormSubmit = (ticketFormSubmit: Partial<TicketFormSubmit>) => {
    if (quantityInCart === 100) {
      return;
    }
    setFormSubmitted(true);
    const newTicket = {...ticket};
    if (priceMultiplier > 1) {
      newTicket.price = newTicket.price * priceMultiplier;
    }
    onAddTicket(newTicket, ticketFormSubmit);
  };

  const style = styles(theme);
  
  return (
    <View style={style.ticketCard}>
      <View style={style.ticketContents}>
        <View style={style.ticketInfo}>
          {/* <FontAwesome6Icon name="person-walking-arrow-right" size={20} color={Colors[theme].text} /> */}
          <View style={style.ticketInfoText}>
            <Text style={style.ticketName}>{ticket.name}</Text>
            <Text style={style.ticketPrice}>{ticket.price/100 * priceMultiplier}€</Text>
            { ticket?.description ?
              <Text style={style.ticketDescription}>{ i18n?.t(ticket.description) }</Text>
            : null}
          </View>
        </View>
        <View style={style.ticketActions}>
          { eventSelling ? <>
            { ticket.selling ? <>
              { ticket.ticket_form_templates_id ?
                <Pressable onPress={formSubmitted ? onRemove : onExpandForm}>
                  <FeatherIcon name={formSubmitted ? 'x-circle' : formExpanded ? 'chevron-up' : 'chevron-down'} size={28} color={Colors[theme].text} />
                </Pressable>
              :
                // <Pressable onPress={quantityInCart === 1 ? onRemove : onAdd}>
                //   <FeatherIcon name={quantityInCart === 1 ? 'x-circle' : 'plus-circle'} size={28} color={quantityInCart === 100 ? Colors[theme].text+'60' : Colors[theme].text} />
                // </Pressable>
                <Picker
                  style={style.quantityPicker}
                  selectedValue={quantityInCart}
                  onValueChange={(itemValue) => onSelectedQuantity(itemValue)}
                >
                  <Picker.Item label="0" value="0" />
                  <Picker.Item label="1" value="1" />
                  <Picker.Item label="2" value="2" />
                  <Picker.Item label="3" value="3" />
                  <Picker.Item label="4" value="4" />
                  <Picker.Item label="5" value="5" />
                  <Picker.Item label="6" value="6" />
                  <Picker.Item label="7" value="7" />
                  <Picker.Item label="8" value="8" />
                  <Picker.Item label="9" value="9" />
                  <Picker.Item label="10" value="10" />
                </Picker>
              }
            </> :
              <Text style={style.notAvailable}>{ i18n?.t('notAvailable') }</Text>
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

const styles = (theme: string) => StyleSheet.create({
  ticketCard: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 10,
    borderRadius: 10,
    backgroundColor: Colors[theme].backgroundContrast,
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
    gap: 15
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
    width: '100%',
    gap: 3
  },
  ticketName: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  ticketPrice: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  ticketDescription: {
    fontSize: 14,
    color: '#606175'
  },
  quantityPicker: {
    textAlign: 'center',
    width: 50,
    height: 40,
    backgroundColor: Colors[theme].inputBackgroundColor,
    borderColor: Colors[theme].inputBorderColor,
    color: Colors[theme].text,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 6,
    fontSize: 15
  }
});
