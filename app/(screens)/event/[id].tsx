import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Platform, Pressable, ScrollView, StyleSheet, Appearance} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from '../../../components/Themed';
import EventTicketCardComponent from '../../../components/EventTicketCardComponent';
import Colors from '../../../constants/Colors';
import { FeatherIcon } from '../../../components/CustomIcons';
import GoBackArrow from '../../../components/GoBackArrow';
import { supabase } from "../../../supabase";
import { Event, WalletTicket, EventTicket } from '../../../types/supabaseplain';
import { useSupabase } from '../../../context/SupabaseProvider';
import { Picker } from '@react-native-picker/picker';
import { getThemeRandomColor } from '../../../utils/chooseRandomColor';
import { CollapsableComponent } from '../../../components/CollapsableComponent';
import EventAddonTicketCardComponent from '../../../components/EventAddonTicketCardComponent';
import EventAccessTicketCardComponent from '../../../components/EventAccessTicketCardComponent';
import Checkbox from 'expo-checkbox';

type CartItem = { eventTicket: EventTicket, quantity: number };
type Cart = CartItem[] | null;

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, session, i18n, swapFollowingEventsChanged, theme } = useSupabase();
  const [userIsMinor, setUserIsMinor] = useState<boolean>(undefined);
  const [cardNumber, setCardNumber] = useState<string>();
  const [expiryDate, setExpiryDate] = useState<string>();
  const [eventBackgroundColor, setEventBackgroundColor] = useState<string>(Colors[theme].backgroundContrast);
  const [event, setEvent] = useState<Event>();
  const [eventTickets, setEventTickets] = useState<EventTicket[]>();
  const [accessEventTickets, setAccessEventTickets] = useState<EventTicket[]>();
  const [accessEventTicketsExpanded, setAccessEventTicketsExpanded] = useState<boolean>(false);
  const [moreInfoExpanded, setMoreInfoExpanded] = useState<boolean>(false);
  const [cart, setCart] = useState<Cart>();
  const [cartTotalPrice, setCartTotalPrice] = useState<number>(0);
  const [cartTotalQuantity, setCartTotalQuantity] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string>('misc');
  const [storeCreditCardChecked, setStoreCreditCardChecked] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (user.user_metadata?.birthdate) {
      const userBirthdate = new Date(user.user_metadata.birthdate);
      setUserIsMinor(new Date(Date.now() - userBirthdate.getTime()).getUTCFullYear() - 1970 < 18);
    } else {
      setUserIsMinor(true); //fallback set to true if no birthdate
    }

    let unmounted = false;
    supabase.from('events').select().eq('id', id as string).single()
    .then(({ data: event, error }) => {
      if (unmounted || error || !event) return;
      setEvent(event);
    });

    return () => {
      setCart(null);
      unmounted = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    if (!event || (theme === 'dark' && !event?.color_code_dark) || (theme === 'light' && !event?.color_code_light)) {
      setEventBackgroundColor(getThemeRandomColor(theme));
      return;
    };
    if (theme === 'dark') {
      setEventBackgroundColor(event.color_code_dark);
    } else {
      setEventBackgroundColor(event.color_code_light);
    }
  }, [user, event, theme]);

  useEffect(() => {
    if (!user || userIsMinor === undefined || !event) return;
    let unmounted = false;

    supabase.from('event_tickets').select().eq('event_id', id).eq('type', 'ACCESS').order('price')
    .then(({ data: event_tickets, error }) => {
      if (unmounted || error || !event_tickets.length) return;
      setAccessEventTickets(event_tickets);
    });

    if (userIsMinor) {
      supabase.from('event_tickets').select().eq('event_id', id).in('type', ['CONSUMABLE', 'ADDON', 'ADDON_REFUNDABLE']).is('minor_restricted', false).order('type', { ascending: true }).order('name')
      .then(({ data: event_tickets, error }) => {
        if (unmounted || error || !event_tickets.length) return;
        const typeOrder = ['ADDON_REFUNDABLE', 'ADDON'];
        const typeOrderMap = new Map(typeOrder.map((type, index) => [type, index]));
        const orderedEventTickets = event_tickets.sort((a, b) => {
          const aIndex = typeOrderMap.has(a.type) ? typeOrderMap.get(a.type) : typeOrder.length;
          const bIndex = typeOrderMap.has(b.type) ? typeOrderMap.get(b.type) : typeOrder.length;
          return aIndex - bIndex;
        });
        setEventTickets(orderedEventTickets);
      });
    } else {
      supabase.from('event_tickets').select().eq('event_id', id).in('type', ['CONSUMABLE', 'ADDON', 'ADDON_REFUNDABLE']).order('type', { ascending: true }).order('name')
      .then(({ data: event_tickets, error }) => {
        if (unmounted || error || !event_tickets.length) return;
        const typeOrder = ['ADDON_REFUNDABLE', 'ADDON'];
        const typeOrderMap = new Map(typeOrder.map((type, index) => [type, index]));
        const orderedEventTickets = event_tickets.sort((a, b) => {
          const aIndex = typeOrderMap.has(a.type) ? typeOrderMap.get(a.type) : typeOrder.length;
          const bIndex = typeOrderMap.has(b.type) ? typeOrderMap.get(b.type) : typeOrder.length;
          return aIndex - bIndex;
        });
        setEventTickets(orderedEventTickets);
      });
    }

    return () => {
      unmounted = true;
    };
  }, [user, event, userIsMinor]);

  useEffect(() => {
    if (!user) return;
    let unmounted = false;
    if (!user || !event) return;
    supabase.from('users').select().eq('id', user?.id).single()
    .then(({ data: user, error }) => {
      if (error || !user) return;
      if (!unmounted) {
        setCardNumber(user.card_number);
        if (user.expiry_date) {
          setExpiryDate(user.expiry_date.toString().slice(2) + '/' + user.expiry_date.toString().slice(0, 2));
        }
      }
      
      const userEventIdsFollowing = user.event_ids_following ?? [];
      if (userEventIdsFollowing.includes(+id)) {
        return;
      }
      supabase.from('users')
      .update({
        event_ids_following: [...userEventIdsFollowing, +id]
      })
      .eq('id', user?.id).select()
      .then(({ data: users, error }) => {
        if (error || !users.length) return;
        swapFollowingEventsChanged();
      });
    });

    return () => {
      unmounted = true;
    };
  }, [user, event]);

  useEffect(() => {
    if (!user) return;
    if (!cart) {
      setCartTotalPrice(0);
      setCartTotalQuantity(0);
      return;
    }
    const totalPrice = cart.reduce((acc, cartItem) => acc + cartItem.eventTicket.price * cartItem.quantity, 0);
    setCartTotalPrice(totalPrice);
    const totalQuantity = cart.reduce((acc, cartItem) => acc + cartItem.quantity, 0);
    setCartTotalQuantity(totalQuantity);
  }, [user, cart]);

  const onAddTicketHandler = (ticket: EventTicket) => {
    if (!cart) {
      setCart([{eventTicket: ticket, quantity: 1}]);
      return;
    }
    const existingCartItem = cart.find((cartItem) => cartItem.eventTicket.id === ticket.id);
    if (existingCartItem) {
      existingCartItem.quantity++;
      setCart([...cart]);
    } else {
      setCart([...cart, {eventTicket: ticket, quantity: 1}]);
    }
  };
  const onRemoveTicketHandler = (ticket: EventTicket) => {
    if (!cart) {
      return;
    }
    const existingCartItem = cart.find((cartItem) => cartItem.eventTicket.id === ticket.id);
    if (!existingCartItem) {
      return;
    }
    existingCartItem.quantity--;
    if (existingCartItem.quantity === 0) {
      const newCart = cart.filter((cartTicket) => cartTicket.eventTicket.id !== ticket.id);
      setCart(newCart);
    } else {
      setCart([...cart]);
    }
  };
  
  const onBuyCart = () => {
    if (loading) {
      return;
    }
    setLoading(true);
    getPaymentFormInfo();
  };

  const getPaymentFormInfo = () => {
    const finalAmount = cartTotalPrice + ((event?.ticket_fee ? event.ticket_fee * cartTotalQuantity : 0));
    fetch(process.env.EXPO_PUBLIC_FIREBASE_FUNC_GET_FORM_INFO_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + session.access_token
      },
      body: JSON.stringify({
        amount: finalAmount,
        userId: user.id,
        eventId: event.id,
        requestToken: storeCreditCardChecked
      })
    })
    .then((response) => response.json())
    .then((data) => {
      if (!data) {
        return;
      }
      const formUrl: string = data.formUrl.replace(/\//g, '%2F');
      const Ds_MerchantParameters: string = data.Ds_MerchantParameters.replace(/\//g, '%2F');
      const Ds_Signature: string = data.Ds_Signature.replace(/\//g, '%2F');
      const Ds_SignatureVersion: string = data.Ds_SignatureVersion.replace(/\//g, '%2F');

      addPendingTicketsToUser(data.orderId);

      router.navigate({ pathname: '/event/paymentModal', params: { bg: eventBackgroundColor, formUrl, Ds_MerchantParameters, Ds_Signature, Ds_SignatureVersion, savedCard: cardNumber || expiryDate ? 'true' : 'false' } });
    })
    .catch(() => {
      setLoading(false);
    });
  }

  type NewWalletTicket = {
    event_id: WalletTicket['event_id'];
    event_tickets_id: WalletTicket['event_tickets_id'];
    event_tickets_name: WalletTicket['event_tickets_name'];
    order_id: WalletTicket['order_id'];
    price: WalletTicket['price'];
    used_at: WalletTicket['used_at'];
    user_id: WalletTicket['user_id'];
    iva: WalletTicket['iva'];
    type: WalletTicket['type'];
  };

  const addPendingTicketsToUser = (orderId: string) => {
    if (!cart?.length || !event || !user) {
      return;
    }

    cart.forEach((cartItem) => {
      for (let i = 0; i < cartItem.quantity; i++) {
        const ticketToInsert: NewWalletTicket = { event_id: cartItem.eventTicket.event_id, event_tickets_id: cartItem.eventTicket.id, event_tickets_name: cartItem.eventTicket.name, order_id: orderId, price: cartItem.eventTicket.price, used_at: null, user_id: user.id, iva: cartItem.eventTicket.iva, type: cartItem.eventTicket.type };
        supabase.from('wallet_tickets').insert(ticketToInsert)
        .select().then();

        const buyIncludesIds = cartItem.eventTicket.buy_includes_event_tickets_ids;
        if (buyIncludesIds?.length) {
          buyIncludesIds.forEach((id) => {
            let eventTicketToInclude = eventTickets.find((eventTicket) => eventTicket.id === id);
            if (!eventTicketToInclude) {
              eventTicketToInclude = accessEventTickets.find((eventTicket) => eventTicket.id === id);
            }
            if (eventTicketToInclude) {
              const ticketToInsert: NewWalletTicket = { event_id: eventTicketToInclude.event_id, event_tickets_id: eventTicketToInclude.id, event_tickets_name: eventTicketToInclude.name, order_id: orderId, price: 0, used_at: null, user_id: user.id, iva: eventTicketToInclude.iva, type: eventTicketToInclude.type };
              supabase.from('wallet_tickets').insert(ticketToInsert)
              .select().then();
            }
          });
        }
      }
    });

    setTimeout(() => {
      setLoading(false);
      setOrderConfirmed(true); //TODO PAU ideally this should be set to true after payment is confirmed. this will require listening for new redsys_orders docs with the orderId and checking the status field
      setCart(null);
    }, 3000);
  };

  const onGoToWallet = () => {
    router.navigate('/(tabs)/wallet');
  };

  const onStopFollowingEvent = () => {
    setSelectedOption('misc');
    if (!user || !event) return;
    supabase.from('users').select().eq('id', user?.id)
    .then(({ data: users, error }) => {
      if (error || !users.length || !users[0].event_ids_following?.length) return;
      const userEventIdsFollowing = users[0].event_ids_following;
      if (!userEventIdsFollowing.includes(+id)) {
        return;
      }
      const filteredUserEventIdsFollowing = userEventIdsFollowing.filter((eventId) => eventId !== +id);
      supabase.from('users')
      .update({
        event_ids_following: filteredUserEventIdsFollowing
      })
      .eq('id', user?.id).select()
      .then(({ data: users, error }) => {
        if (error || !users.length) return;
        swapFollowingEventsChanged();
      });
    });
  };

  const onMoreInfo = () => {
    setMoreInfoExpanded(!moreInfoExpanded);
  };

  const onAccessTicketsExpand = () => {
    setAccessEventTicketsExpanded(!accessEventTicketsExpanded);
  };

  const onDismissAddedToWallet = () => {
    setOrderConfirmed(false);
  };

  const renderItemAccessTickets = useCallback(({item}: {item: EventTicket}) => {
    if (item.hide_from_event_page) return;
    return <EventAccessTicketCardComponent ticket={item} eventSelling={event?.selling_access} quantityInCart={cart?.find((cartItem) => cartItem.eventTicket.id === item.id)?.quantity ?? 0} onRemoveTicket={onRemoveTicketHandler} onAddTicket={onAddTicketHandler} />;
  }, [cart, event]);

  const renderItemTickets = useCallback(({item}: {item: EventTicket}) => {
    if (item.hide_from_event_page) return;
    if (item.type === "ADDON" || item.type === "ADDON_REFUNDABLE") {
      return <EventAddonTicketCardComponent ticket={item} eventSelling={event?.selling} quantityInCart={cart?.find((cartItem) => cartItem.eventTicket.id === item.id)?.quantity ?? 0} onRemoveTicket={onRemoveTicketHandler} onAddTicket={onAddTicketHandler} />;
    }
    return <EventTicketCardComponent ticket={item} eventSelling={event?.selling} quantityInCart={cart?.find((cartItem) => cartItem.eventTicket.id === item.id)?.quantity ?? 0} onRemoveTicket={onRemoveTicketHandler} onAddTicket={onAddTicketHandler} />;
  }, [cart, event]);

  const renderItemCartTicket = useCallback(({item}: {item: CartItem}) => (
    <Text style={styles.cartItemsList}>{ (item.eventTicket.type === "ADDON" || item.eventTicket.type === "ADDON_REFUNDABLE") ? null : item.quantity + '  -  ' }{item.eventTicket.name} · {item.eventTicket.price/100}€</Text>
  ), []);

  return (
    <View style={[styles.container, !event ? { justifyContent: 'center' } : null]}>
      { !event || userIsMinor === undefined ? <>
        <ActivityIndicator size="large" />
      </> : <>
        <View style={[styles.eventInfoContainer, {backgroundColor: eventBackgroundColor, paddingBottom: event.more_info_content ? 40 : 10}]}>
          <GoBackArrow />
          <View style={styles.stopFollowingButton}>
            <FeatherIcon name="more-horizontal" size={35} color={Colors['light'].text} />
            <Picker
              style={styles.optionsPicker}
              selectedValue={selectedOption}
              onValueChange={() => onStopFollowingEvent()}
            >
              <Picker.Item label={ i18n?.t('stopFollowingEventQuestion') } value="misc" enabled={false} />
              <Picker.Item label={ i18n?.t('stopFollowingEventConfirmation') } value="unfollow" />
            </Picker>
          </View>
          <Text style={[styles.title, {color: Colors['light'].text}]}>{ event?.name }</Text>
          { !event.more_info_content ?
            <ScrollView horizontal>
              <Text style={[styles.eventDescription, {color: Colors['light'].text}]}>{event.description}</Text>
            </ScrollView>
          : <>
            <Pressable style={styles.moreEventInfo} onPress={onMoreInfo}>
              <FeatherIcon name={moreInfoExpanded ? 'chevron-up' : 'chevron-down'} size={21} color={Colors['light'].text} />
              <Text style={[styles.moreEventInfoActionable, {color: Colors['light'].text}]}>{ i18n?.t('moreInfo') }</Text>
            </Pressable>
            <CollapsableComponent expanded={moreInfoExpanded}>
              <Text style={[styles.eventDescription, {color: Colors['light'].text}]}>{event.description}</Text>
              <Text style={[styles.moreEventInfoText, {color: Colors['light'].text}]}>{event.more_info_content}</Text>
            </CollapsableComponent>
          </> }
        </View>
        { eventTickets ? <>
          <View style={[styles.ticketsContainer, {marginTop: event.more_info_content ? 167 : 177}]}>
            { accessEventTickets ? <>
              <View style={styles.accessTickets}>
                { accessEventTicketsExpanded ?
                  <View style={styles.sellingStatusContainer}>
                    <View style={[styles.sellingStatusDot, {backgroundColor: event.selling_access ? 'green' : 'red'}]}></View>
                    <Text style={[styles.sellingStatus, {color: event.selling_access ? 'green' : 'red'}]}>{ i18n?.t(event.selling_access ? 'selling': 'notSelling') }</Text>
                  </View>
                : null }
                <Pressable style={styles.accessTicketsExpand} onPress={onAccessTicketsExpand}>
                  <Text style={styles.subtitle}>{ i18n?.t('accessControlTickets') }</Text>
                  <FeatherIcon name={accessEventTicketsExpanded ? 'chevron-down' : 'chevron-right'} size={24} color={Colors[theme].text} />
                </Pressable>
                <CollapsableComponent expanded={accessEventTicketsExpanded} maxHeight={255}>
                  <FlatList
                    style={styles.ticketsList}
                    data={accessEventTickets}
                    renderItem={renderItemAccessTickets}
                  />
                </CollapsableComponent>
              </View>
            </> : null }
            <View>
              <View style={styles.sellingStatusContainer}>
                <View style={[styles.sellingStatusDot, {backgroundColor: event.selling ? 'green' : 'red'}]}></View>
                <Text style={[styles.sellingStatus, {color: event.selling ? 'green' : 'red'}]}>{ i18n?.t(event.selling ? 'selling': 'notSelling') }</Text>
              </View>
              <Text style={styles.subtitle}>Tickets:</Text>
              <FlatList
                style={styles.ticketsList}
                data={eventTickets}
                renderItem={renderItemTickets}
              />
            </View>
          </View>
          { orderConfirmed ?
            <Pressable style={[styles.orderConfirmedContainer, {backgroundColor: Colors[theme].cartContainerBackground}]} onPress={onGoToWallet}>
              <Pressable onPress={onDismissAddedToWallet} style={styles.dismissAddedToWallet}>
                <FeatherIcon name="x" size={25} color={Colors[theme].text} />
              </Pressable>
              <FeatherIcon name="check-circle" size={40} color={Colors[theme].text} />
              <View style={styles.orderConfirmedTextContainer}><Text style={styles.orderConfirmedSubtitle}>{ i18n?.t('ticketsAddedToWallet') }</Text><FeatherIcon name="arrow-up-right" size={25} color={Colors[theme].text} /></View>
            </Pressable>
          :
            <View style={[styles.cartContainer, {backgroundColor: Colors[theme].cartContainerBackground}]}>
              <View style={styles.cartTitleRowContainer}><Text style={styles.subtitle}>{ i18n?.t('cart') }</Text><FeatherIcon name="shopping-cart" size={22} color={Colors[theme].text} /></View>
              { cart?.length ? <>
                  <FlatList
                    style={styles.cartList}
                    data={cart}
                    renderItem={renderItemCartTicket}
                    ItemSeparatorComponent={() => <View style={{height: 3}} />}
                  />
                  { event.ticket_fee ?
                    <View style={{marginHorizontal: 8, flexDirection: 'row', alignItems: 'flex-end'}}>
                      <Text style={[styles.transactionFeePrice, {color: Colors[theme].cartContainerBackgroundContrast}]}>+ {event.ticket_fee * cartTotalQuantity / 100}€ </Text>
                      <Text style={[styles.transactionFeeText, {color: Colors[theme].cartContainerBackgroundContrast}]}>{ i18n?.t('serviceFee') }</Text>
                    </View>
                  : null }
                    { cardNumber ?
                      <View style={styles.usingCreditCardContainer}>
                        <FeatherIcon name="info" size={15} color={Colors[theme].cartContainerBackgroundContrast} />
                        <Text style={[styles.transactionFeeText, {color: Colors[theme].cartContainerBackgroundContrast}]}>{ i18n?.t('usingCreditCard') } {cardNumber.slice(-7)}</Text>
                      </View>
                    : expiryDate ?
                      <View style={styles.usingCreditCardContainer}>
                        <FeatherIcon name="info" size={15} color={Colors[theme].cartContainerBackgroundContrast} />
                        <Text style={[styles.transactionFeeText, {color: Colors[theme].cartContainerBackgroundContrast}]}>{ i18n?.t('usingCardWithExpiryDate') } {expiryDate}</Text>
                      </View>
                    :
                      <View style={styles.storeCreditCardContainer}>
                        <Checkbox
                          style={styles.storeCreditCardCheckboxInput}
                          color={Colors[theme].cartContainerButtonBackground}
                          value={storeCreditCardChecked}
                          onValueChange={setStoreCreditCardChecked}
                        />
                        <Text style={[styles.transactionFeeText, {color: Colors[theme].cartContainerBackgroundContrast}]}>Guardar tarjeta per futures compres</Text>
                      </View>
                    }
                  <Pressable style={[styles.buyButton, {backgroundColor: Colors[theme].cartContainerButtonBackground, marginTop: !cardNumber ? 5 : 3}]} onPress={onBuyCart}>
                  { loading ?
                    <ActivityIndicator style={{marginVertical: 1.75}} size="small" />
                  :
                    <Text style={styles.buyButtonText}>{(cartTotalPrice + (event?.ticket_fee ? event.ticket_fee * cartTotalQuantity : 0)) / 100 + '€  ·  '}{ i18n?.t('buy') }</Text>
                  }
                  </Pressable>
              </> :
                <Text style={[styles.emptyCard, {color: Colors[theme].cartContainerBackgroundContrast}]}>{ i18n?.t('noTicketsInCart') }</Text>
              }
            </View>
          }
        </> : null }
      </>}

    </View> 
  );
}

const eventInfoContainerMobileShadow = {
  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 2
  },
  shadowOpacity: 0.10,
  shadowRadius: 2.5
};

const orderConfirmedContainerMobileShadow = {
  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 1
  },
  shadowOpacity: 0.15,
  shadowRadius: 3
};

const cartContainerMobileShadow = {
  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 1
  },
  shadowOpacity: 0.15,
  shadowRadius: 3
};

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    height: '100%',
    gap: 5,
    overflow: 'hidden'
  },
  eventInfoContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingTop: 71,
    paddingHorizontal: 20,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderRadius: 35,
    zIndex: 1,
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 2.5px rgba(0, 0, 0, 0.10)'
      },
      ios: {...eventInfoContainerMobileShadow},
      android: {...eventInfoContainerMobileShadow, elevation: 4}
    })
  },
  stopFollowingButton: {
    display: 'flex',
    alignItems: 'flex-end',
    position: 'absolute',
    top: 15,
    right: 15
  },
  optionsPicker: {
    position: 'absolute',
    top: 5,
    right: -8,
    height: 30,
    width: 50,
    opacity: 0
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold'
  },
  subtitle: {
    fontSize: 25,
    fontWeight: '800'
  },
  eventDescription: {
    fontSize: 16,
    marginVertical: 10
  },
  moreEventInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    gap: 3,
    position: 'absolute',
    bottom: 10
  },
  moreEventInfoActionable: {
    fontSize: 14,
    fontWeight: '500'
  },
  moreEventInfoText: {
    fontSize: 16
  },
  ticketsContainer: {
    flex: 1,
    marginHorizontal: 20,
    overflow: 'scroll',
    borderRadius: 5
  },
  accessTickets: {
    marginBottom: 7
  },
  accessTicketsExpand: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 5
  },
  ticketsList: {
    marginTop: 5
  },
  sellingStatusContainer: {
    position: 'absolute',
    right: 10,
    top: 10,
    paddingVertical: 3,
    paddingLeft: 5,
    paddingRight: 5,
    borderRadius: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5
  },
  sellingStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5
  },
  sellingStatus: {
    fontSize: 11,
    fontWeight: '600'
  },
  orderConfirmedContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 20,
    width: '95%',
    marginBottom: 15,
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderRadius: 35,
    ...Platform.select({
      web: {
        boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.15)'
      },
      ios: {...orderConfirmedContainerMobileShadow},
      android: {...orderConfirmedContainerMobileShadow, elevation: 3}
    })
  },
  dismissAddedToWallet: {
    opacity: .7,
    position: 'absolute',
    top: 10,
    right: 14
  },
  orderConfirmedTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5
  },
  orderConfirmedSubtitle: {
    fontSize: 20,
    fontWeight: '800'
  },
  cartContainer: {
    gap: 7,
    marginBottom: 15,
    alignSelf: 'center',
    width: '95%',
    paddingTop: 13,
    paddingBottom: 18,
    paddingHorizontal: 16,
    borderRadius: 35,
    ...Platform.select({
      web: {
        boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.15)'
      },
      ios: {...cartContainerMobileShadow},
      android: {...cartContainerMobileShadow, elevation: 3}
    })
  },
  cartTitleRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5
  },
  cartList: {
    marginHorizontal: 18
  },
  cartItemsList: {
    fontSize: 18
  },
  storeCreditCardContainer: {
    marginHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  storeCreditCardCheckboxInput: {
    width: 18,
    height: 18
  },
  usingCreditCardContainer: {
    marginHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5
  },
  transactionFeePrice: {
    fontSize: 16
  },
  transactionFeeText: {
    fontSize: 14
  },
  buyButton: {
    width: '100%',
    paddingVertical: 10,
    borderRadius: 10
  },
  buyButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  emptyCard: {
    textAlign: 'center'
  }
});
