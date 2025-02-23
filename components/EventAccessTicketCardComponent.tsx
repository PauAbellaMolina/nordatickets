import { Platform, Pressable, StyleSheet } from 'react-native';
import { EventTicket, TicketFormSubmit } from '../types/supabaseplain';
import Colors from '../constants/Colors';
import { Text, View } from './Themed';
import { FeatherIcon } from './CustomIcons';
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

  const [moreInfoExpanded, setMoreInfoExpanded] = useState<boolean>(false);
  const [formExpanded, setFormExpanded] = useState<boolean>(false);
  const [formSubmitted, setFormSubmitted] = useState<boolean>(false);
  const [priceMultiplier, setPriceMultiplier] = useState<number>(1);

  const onExpandForm = () => {
    setFormExpanded(!formExpanded);
  };

  const onExpandAdditionalInfo = () => {
    setMoreInfoExpanded(!moreInfoExpanded);
  };

  const onRemove = () => {
    setFormSubmitted(false);
    setFormExpanded(false);
    if (quantityInCart === 0) {
      return;
    }
    onRemoveTicket(ticket);
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
          <View style={style.ticketInfoText}>
            <Text style={style.ticketName}>{ticket.name}</Text>
            <View style={style.ticketPricesContainer}>
              { ticket.strikethrough_price != null ? 
                <View style={style.strikethroughTicketPriceContainer}>
                  <Text style={style.strikethroughTicketPrice}>{ticket.strikethrough_price/100 * priceMultiplier}€</Text>
                  <FeatherIcon name="arrow-right" size={12} color='#606175' />
                </View>
              : null }
              <Text style={style.ticketPrice}>{ticket.price/100 * priceMultiplier}€</Text>
            </View>
            { ticket?.description ?
              <Text style={style.ticketDescription}>{ i18n?.t(ticket.description) }</Text>
            : null }
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
      { ticket?.additional_info || ticket?.conditions_notice ? <>
        <View>
          <Pressable style={style.additionalInfoToggle} onPress={onExpandAdditionalInfo}>
            <Text style={style.additionalInfoToggleText}>{ i18n?.t('additionalInfoAndConditions') }</Text>
            <FeatherIcon name={moreInfoExpanded ? 'chevron-down' : 'chevron-right'} size={18} color='#606175' />
          </Pressable>
          <CollapsableComponent expanded={moreInfoExpanded} maxHeight={200}>
            <View style={style.additionalInfoContentContainer}>
              { ticket?.additional_info ? 
                <View style={style.additionalInfoContentSection}>
                  <Text style={[style.ticketDescription, {fontWeight: 'bold'}]}>{ i18n?.t('additionalInfo') }:</Text>
                  <Text style={style.ticketDescription}>{ ticket.additional_info }</Text>
                </View>
              : null}
              { ticket?.conditions_notice ?
                <View style={style.additionalInfoContentSection}>
                  <Text style={[style.ticketDescription, {fontWeight: 'bold'}]}>{ i18n?.t('conditions') }:</Text>
                  <Text style={style.ticketDescription}>{ ticket.conditions_notice }</Text>
                </View>
              : null}
            </View>
          </CollapsableComponent>
        </View>
      </> : null}
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
  ticketPricesContainer: {
    flexDirection: 'row',
    gap: 4
  },
  strikethroughTicketPriceContainer: {
    flexDirection: 'row',
    gap: 3
  },
  ticketPrice: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  strikethroughTicketPrice: {
    fontSize: 18,
    textDecorationLine: 'line-through',
    color: '#606175'
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
  },
  additionalInfoToggle: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 3,
    gap: 2
  },
  additionalInfoToggleText: {
    lineHeight: 18,
    fontSize: 14,
    color: '#606175'
  },
  additionalInfoContentContainer: {
    flexDirection: 'column',
    gap: 10,
    marginTop: 5
  },
  additionalInfoContentSection: {
    flexDirection: 'column',
    gap: 2
  }
});
