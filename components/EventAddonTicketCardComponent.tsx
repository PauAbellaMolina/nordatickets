import { Platform, Pressable, StyleSheet } from 'react-native';
import { EventTicket, TicketFormSubmit } from '../types/supabaseplain';
import Colors from '../constants/Colors';
import { Text, View } from './Themed';
import { EntypoIcon, FeatherIcon } from './CustomIcons';
import { useSupabase } from '../context/SupabaseProvider';
import { useState } from 'react';
import { CollapsableComponent } from './CollapsableComponent';
import EventTicketCardFormComponent from './EventTicketCardFormComponent';

export interface TicketCardComponentProps {
  eventSelling: boolean,
  quantityInCart: number,
  onRemoveTicket: (ticket: EventTicket) => void,
  onAddTicket: (ticket: EventTicket, associatedTicketFormSubmit?: Partial<TicketFormSubmit>) => void,
  ticket: EventTicket
}

export default function EventAddonTicketCardComponent({ticket, eventSelling, quantityInCart, onRemoveTicket, onAddTicket}: TicketCardComponentProps) {
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
    if (quantityInCart === 0) {
      return;
    }
    onRemoveTicket(ticket);
    setFormSubmitted(false);
    setFormExpanded(false);
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
          <EntypoIcon name="cup" size={23} color={Colors[theme].text} />
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
                <Pressable onPress={quantityInCart === 1 ? onRemove : onAdd}>
                  <FeatherIcon name={quantityInCart === 1 ? 'x-circle' : 'plus-circle'} size={28} color={quantityInCart === 100 ? Colors[theme].text+'60' : Colors[theme].text} />
                </Pressable>
              }
            </> :
              <Text style={style.notAvailable}>{ i18n?.t('notAvailable') }</Text>
            }
          </> : <></> }
        </View>
      </View>
      { ticket.ticket_form_templates_id ?
        <CollapsableComponent expanded={formExpanded} maxHeight={200}>
          <EventTicketCardFormComponent event_id={ticket.event_id} ticket_form_templates_id={ticket.ticket_form_templates_id} formSubmitted={formSubmitted} onPriceMultiplierChange={handlePriceMultiplierChange} onSubmit={onFormSubmit} />
        </CollapsableComponent>
      : null }
      { ticket?.additional_info || ticket?.conditions_notice ? <>
        <View style={style.additionalInfoContainer}>
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
    maxWidth: '90%',
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
  additionalInfoContainer: {
    marginLeft: 33
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
