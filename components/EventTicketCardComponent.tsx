import { Platform, Pressable, StyleSheet } from 'react-native';
import { EventTicket } from '../types/supabaseplain';
import Colors from '../constants/Colors';
import { Text, View } from './Themed';
import { FeatherIcon, FontAwesomeIcon } from './CustomIcons';
import { useSupabase } from '../context/SupabaseProvider';
import { useState } from 'react';
import { CollapsableComponent } from './CollapsableComponent';

export interface TicketCardComponentProps {
  eventSelling: boolean,
  quantityInCart: number,
  onRemoveTicket: (ticket: EventTicket) => void,
  onAddTicket: (ticket: EventTicket) => void,
  ticket: EventTicket
}

export default function EventTicketCardComponent({ticket, eventSelling, quantityInCart, onRemoveTicket, onAddTicket}: TicketCardComponentProps) {
  const { i18n, theme } = useSupabase();

  const [moreInfoExpanded, setMoreInfoExpanded] = useState(false);

  const onExpandAdditionalInfo = () => {
    setMoreInfoExpanded(!moreInfoExpanded);
  }

  const onRemove = () => {
    if (quantityInCart === 0) {
      return;
    }
    onRemoveTicket(ticket);
  }
  const onAdd = () => {
    if (quantityInCart === 100) {
      return;
    }
    onAddTicket(ticket);
  }

  const style = styles(theme);
  
  return (
    <View style={style.ticketCard}>
      <View style={style.ticketContents}>
        <View style={style.ticketInfo}>
          <FontAwesomeIcon name="ticket" size={23} color={Colors[theme].text} />
          <View style={style.ticketInfoText}>
            <Text style={style.ticketName}>{ticket.name}</Text>
            <View style={style.ticketPricesContainer}>
              { ticket.strikethrough_price != null ? 
                <View style={style.strikethroughTicketPriceContainer}>
                  <Text style={style.strikethroughTicketPrice}>{ticket.strikethrough_price/100}€</Text>
                  <FeatherIcon name="arrow-right" size={12} color='#606175' />
                </View>
              : null }
              <Text style={style.ticketPrice}>{ticket.price/100}€</Text>
            </View>
            { ticket?.description ?
              <Text style={style.ticketDescription}>{ i18n?.t(ticket.description) }</Text>
            : null}
          </View>
        </View>
        <View style={style.ticketActions}>
          { eventSelling ? <>
            { ticket.selling ? <>
              <Pressable onPress={onRemove}>
                <FeatherIcon name="minus-circle" size={28} color={quantityInCart === 0 ? Colors[theme].text+'60' : Colors[theme].text} />
              </Pressable>
              <Text style={style.quantityInCart}>{quantityInCart}</Text>
              <Pressable onPress={onAdd}>
                <FeatherIcon name="plus-circle" size={28} color={quantityInCart === 100 ? Colors[theme].text+'60' : Colors[theme].text} />
              </Pressable>
            </> :
              <Text style={style.notAvailable}>{ i18n?.t('notAvailable') }</Text>
            }
          </> : <></> }
        </View>
      </View>
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
    width: 40,
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
    maxWidth: '85%',
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