import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Platform, Pressable, ScrollView, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from '../../../components/Themed';
import EventTicketCardComponent from '../../../components/EventTicketCardComponent';
import Colors from '../../../constants/Colors';
import { FeatherIcon } from '../../../components/CustomIcons';
import GoBackArrow from '../../../components/GoBackArrow';
import { supabase } from "../../../supabase";
import { Event, EventTicket, TicketFormSubmit } from '../../../types/supabaseplain';
import { useSupabase } from '../../../context/SupabaseProvider';
import { Picker } from '@react-native-picker/picker';
import { getThemeRandomColor } from '../../../utils/chooseRandomColor';
import { CollapsableComponent } from '../../../components/CollapsableComponent';
import EventAddonTicketCardComponent from '../../../components/EventAddonTicketCardComponent';
import EventAccessTicketCardComponent from '../../../components/EventAccessTicketCardComponent';
import Checkbox from 'expo-checkbox';
import Animated, { Easing, FadeIn, FadeInDown, FadeInUp, FadeOutDown, ReduceMotion } from 'react-native-reanimated';
import { useEventScreens } from '../../../context/EventScreensProvider';

type CartItem = { eventTicket: EventTicket, quantity: number, associatedTicketFormSubmit?: Partial<TicketFormSubmit> }; //TODO PAU can be imported from EventScreensProvider?

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, session, i18n, followingEvents, storeFollowingEventsUserData, storeFollowingEventsCookie, theme } = useSupabase();
  const { cart, setCart, eventBackgroundColor, setEventBackgroundColor, setFormUrl, setDs_MerchantParameters, setDs_Signature, setDs_SignatureVersion, cardNumber, setCardNumber, expiryDate, setExpiryDate } = useEventScreens();

  const [userIsMinor, setUserIsMinor] = useState<boolean>(undefined);
  const [event, setEvent] = useState<Event>();
  const [eventTickets, setEventTickets] = useState<EventTicket[]>();
  const [accessEventTickets, setAccessEventTickets] = useState<EventTicket[]>();
  const [accessEventTicketsExpanded, setAccessEventTicketsExpanded] = useState<boolean>(false);
  const [moreInfoExpanded, setMoreInfoExpanded] = useState<boolean>(false);
  const [cartTotalPrice, setCartTotalPrice] = useState<number>(0);
  const [cartTotalQuantity, setCartTotalQuantity] = useState<number>(0);
  const [eventTicketsWithLimit, setEventTicketsWithLimit] = useState<EventTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string>('misc');
  const [storeCreditCardChecked, setStoreCreditCardChecked] = useState(false);
  const [previousFollowingEvents, setPreviousFollowingEvents] = useState<number[]>(undefined);

  useEffect(() => {
    let unmounted = false;

    supabase.from('events').select().eq('id', id as string).single()
    .then(({ data: event, error }) => {
      if (unmounted || error || !event) return;
      setEvent(event);
      setAccessEventTicketsExpanded(event.access_tickets_section_expanded);
    });

    if (user) {
      if (user.user_metadata?.birthdate) {
        const userBirthdate = new Date(user.user_metadata.birthdate);
        setUserIsMinor(new Date(Date.now() - userBirthdate.getTime()).getUTCFullYear() - 1970 < 18);
      } else {
        setUserIsMinor(true); //fallback set to true if no birthdate
      }
  
      supabase.from('users').select().eq('id', user?.id).single()
      .then(({ data: user, error }) => {
        if (error || !user) return;
        if (!unmounted) {
          setCardNumber(user.card_number);
          if (user.expiry_date) {
            setExpiryDate(user.expiry_date.toString().slice(2) + '/' + user.expiry_date.toString().slice(0, 2));
          }
        }
      });
    } else {
      setUserIsMinor(false);
    }

    return () => {
      setCart(null);
      unmounted = true;
    };
  }, [user]);

  useEffect(() => {
    if (!event || !followingEvents) return;

    setPreviousFollowingEvents(followingEvents);
    if (followingEvents && previousFollowingEvents) return;

    if (!followingEvents.includes(+event.id)) {
      storeFollowingEventsCookie([...followingEvents, +event.id], false, !user);
      if (user) { //TODO PAU this is for when we support not signed in users
        storeFollowingEventsUserData([...followingEvents, +event.id], false, true);
      }
    }
  }, [user, event, followingEvents]);

  useEffect(() => {
    if (!event || (theme === 'dark' && !event?.color_code_dark) || (theme === 'light' && !event?.color_code_light)) {
      setEventBackgroundColor(getThemeRandomColor(theme));
      return;
    };
    if (theme === 'dark') {
      setEventBackgroundColor(event.color_code_dark);
    } else {
      setEventBackgroundColor(event.color_code_light);
    }
  }, [event, theme]);

  useEffect(() => {
    if (userIsMinor === undefined || !event) return;
    let unmounted = false;

    supabase.from('event_tickets').select().eq('event_id', id).eq('type', 'ACCESS').order('price')
    .then(({ data: event_tickets, error }) => {
      if (unmounted || error || !event_tickets.length) return;
      setAccessEventTickets(event_tickets);
    });

    const queryAllTickets = () => {
      supabase.from('event_tickets').select().eq('event_id', id).in('type', ['CONSUMABLE', 'ADDON', 'ADDON_REFUNDABLE']).order('type', { ascending: true }).order('price', { ascending: false })
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
    };

    if (!user || (user && !userIsMinor)) {
      queryAllTickets();
    } else {
      supabase.from('event_tickets').select().eq('event_id', id).in('type', ['CONSUMABLE', 'ADDON', 'ADDON_REFUNDABLE']).is('minor_restricted', false).order('type', { ascending: true }).order('price', { ascending: false })
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
    if (!cart) {
      setCartTotalPrice(0);
      setCartTotalQuantity(0);
      return;
    }
    const totalPrice = cart.reduce((acc, cartItem) => acc + cartItem.eventTicket.price * cartItem.quantity, 0);
    setCartTotalPrice(totalPrice);
    const totalQuantity = cart.reduce((acc, cartItem) => acc + cartItem.quantity, 0);
    setCartTotalQuantity(totalQuantity);
  }, [cart]);

  const onAddTicketHandler = (ticket: EventTicket, associatedTicketFormSubmit?: Partial<TicketFormSubmit>) => {
    if (ticket.wallet_tickets_limit) {
      if (!eventTicketsWithLimit.some(t => t.id === ticket.id)) {
        setEventTicketsWithLimit([...eventTicketsWithLimit, ticket]);
      }
    }
    if (!cart) {
      setCart([{eventTicket: ticket, quantity: 1, associatedTicketFormSubmit}]);
      return;
    }
    const existingCartItem = cart.find((cartItem) => cartItem.eventTicket.id === ticket.id);
    if (existingCartItem) {
      existingCartItem.quantity++;
      setCart([...cart]);
    } else {
      setCart([...cart, {eventTicket: ticket, quantity: 1, associatedTicketFormSubmit}]);
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
      if (eventTicketsWithLimit.some((t) => t.id === ticket.id)) {
        setEventTicketsWithLimit(eventTicketsWithLimit.filter((t) => t.id !== ticket.id));
      }
      const newCart = cart.filter((cartTicket) => cartTicket.eventTicket.id !== ticket.id);
      setCart(newCart);
    } else {
      setCart([...cart]);
    }
  };
  
  const onBuyCart = () => {
    if (!user) {
      router.navigate('/event/authModal');
      return;
    }
    if (loading) {
      return;
    }
    setLoading(true);

    if (eventTicketsWithLimit?.length) {
      checkForLimitedTickets();
    } else {
      getPaymentFormInfo();
    }
  };

  const checkForLimitedTickets = async () => {
    try {
      const results = await Promise.all(eventTicketsWithLimit.map(async (ticket) => {
        const cartItem = cart.find((item) => item.eventTicket.id === ticket.id);
        const { data: count, error } = await supabase.rpc('count_wallet_tickets_by_event_tickets_id', { p_event_tickets_id: ticket.id });
        
        return !(error || count > ticket.wallet_tickets_limit || count + cartItem.quantity > ticket.wallet_tickets_limit);
      }));
  
      if (results.every(Boolean)) {
        getPaymentFormInfo();
      } else {
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
    }
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
        eventId: event.id,
        requestToken: storeCreditCardChecked,
        cart: cart
      })
    })
    .then((response) => response.json())
    .then((data) => {
      if (!data) {
        return;
      }
      if (data.zeroAmount) {
        setTimeout(() => {
          setLoading(false);
          setOrderConfirmed(true); //TODO PAU ideally this should be set to true after payment is confirmed. this will require listening for new redsys_orders docs with the orderId and checking the status field
          setCart(null);
        }, 700);
        return;
      }

      setFormUrl(data.formUrl.replace(/\//g, '%2F'));
      setDs_MerchantParameters(data.Ds_MerchantParameters.replace(/\//g, '%2F'));
      setDs_Signature(data.Ds_Signature.replace(/\//g, '%2F'));
      setDs_SignatureVersion(data.Ds_SignatureVersion.replace(/\//g, '%2F'));

      setTimeout(() => {
        setLoading(false);
        setOrderConfirmed(true); //TODO PAU ideally this should be set to true after payment is confirmed. this will require listening for new redsys_orders docs with the orderId and checking the status field
        setCart(null);
      }, 3000);

      router.navigate('/event/paymentModal');
    })
    .catch(() => {
      setLoading(false);
    });
  }

  const onGoToWallet = () => {
    router.navigate('/(tabs)/wallet');
  };

  const onStopFollowingEvent = () => {
    setSelectedOption('misc');
    storeFollowingEventsCookie(followingEvents.filter((eventId) => eventId !== +id), true, !user);
    if (user) { //TODO PAU this is for when we support not signed in users
      storeFollowingEventsUserData(followingEvents.filter((eventId) => eventId !== +id), true, true);
    }
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
    <View style={[styles.container, !event || userIsMinor === undefined ? { justifyContent: 'center' } : null]}>
      { !event || userIsMinor === undefined ? <>
        <ActivityIndicator size="large" />
      </> : <>
        <Animated.View entering={FadeInUp.duration(205).easing(Easing.inOut(Easing.quad)).reduceMotion(ReduceMotion.Never)} style={[styles.eventInfoContainer, {backgroundColor: eventBackgroundColor, paddingBottom: event.more_info_content ? 40 : 10}]}>
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
          <ScrollView horizontal>
            <Text style={[styles.title, {color: Colors['light'].text}]}>{ event?.name }</Text>
          </ScrollView>
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
        </Animated.View>
        { eventTickets ? <>
          <Animated.View entering={FadeIn.duration(220).easing(Easing.inOut(Easing.quad)).reduceMotion(ReduceMotion.Never)} style={[styles.ticketsContainer, {marginTop: event.more_info_content ? 167 : 177}]}>
            { accessEventTickets ? <>
              <View style={styles.accessTickets}>
                { accessEventTicketsExpanded ?
                  <View style={styles.sellingStatusContainer}>
                    <View style={[styles.sellingStatusDot, {backgroundColor: event.selling_access ? 'green' : 'red'}]}></View>
                    <Text style={[styles.sellingStatus, {color: event.selling_access ? 'green' : 'red'}]}>{ i18n?.t(event.selling_access ? 'selling': 'notSelling') }</Text>
                  </View>
                : null }
                <Pressable style={styles.accessTicketsExpand} onPress={onAccessTicketsExpand}>
                  <Text style={styles.subtitle}>{ !event.access_tickets_section_title ? i18n?.t('accessControlTickets') : i18n?.t(event.access_tickets_section_title) }</Text>
                  <FeatherIcon name={accessEventTicketsExpanded ? 'chevron-down' : 'chevron-right'} size={24} color={Colors[theme].text} />
                </Pressable>
                <CollapsableComponent expanded={accessEventTicketsExpanded} maxHeight={300}>
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
          </Animated.View>
          { orderConfirmed ?
            <Pressable style={[styles.orderConfirmedContainer, {backgroundColor: Colors[theme].cartContainerBackground}]} onPress={onGoToWallet}>
              <Pressable onPress={onDismissAddedToWallet} style={styles.dismissAddedToWallet}>
                <FeatherIcon name="x" size={25} color={Colors[theme].text} />
              </Pressable>
              <FeatherIcon name="check-circle" size={40} color={Colors[theme].text} />
              <View style={styles.orderConfirmedTextContainer}><Text style={styles.orderConfirmedSubtitle}>{ i18n?.t('ticketsAddedToWallet') }</Text><FeatherIcon name="arrow-up-right" size={25} color={Colors[theme].text} /></View>
            </Pressable>
          : <>
            { cart?.length ?
              <Animated.View
                entering={FadeInDown.duration(200).easing(Easing.inOut(Easing.quad)).reduceMotion(ReduceMotion.Never)}
                exiting={FadeOutDown.duration(150).easing(Easing.out(Easing.exp)).reduceMotion(ReduceMotion.Never)}
                style={[styles.cartContainer, {backgroundColor: Colors[theme].cartContainerBackground}]}
              >
                <View style={styles.cartTitleRowContainer}><Text style={styles.subtitle}>{ i18n?.t('cart') }</Text><FeatherIcon name="shopping-cart" size={22} color={Colors[theme].text} /></View>
                {/* Uncomment below if we want to show the cart even if it's empty */}
                {/* { cart?.length ? <> */}
                  <FlatList
                    style={styles.cartList}
                    data={cart}
                    renderItem={renderItemCartTicket}
                    ItemSeparatorComponent={() => <View style={{height: 3}} />}
                  />
                  { event.ticket_fee ?
                    <View style={{marginHorizontal: 8, flexDirection: 'row', alignItems: 'flex-end'}}>
                      <Text style={[styles.transactionFeePrice, {color: Colors[theme].cartContainerBackgroundContrast}]}>+ {event.ticket_fee * cartTotalQuantity / 100}€ </Text>
                      <Text style={[styles.creditCardText, {color: Colors[theme].cartContainerBackgroundContrast}]}>{ i18n?.t('serviceFee') }</Text>
                    </View>
                  : null }
                    { cardNumber ?
                      <View style={styles.usingCreditCardContainer}>
                        <FeatherIcon name="info" size={15} color={Colors[theme].cartContainerBackgroundContrast} />
                        <Text style={[styles.creditCardText, {color: Colors[theme].cartContainerBackgroundContrast}]}>{ i18n?.t('usingCreditCard') } {cardNumber.slice(-7)}</Text>
                      </View>
                    : expiryDate ?
                      <View style={styles.usingCreditCardContainer}>
                        <FeatherIcon name="info" size={15} color={Colors[theme].cartContainerBackgroundContrast} />
                        <Text style={[styles.creditCardText, {color: Colors[theme].cartContainerBackgroundContrast}]}>{ i18n?.t('usingCardWithExpiryDate') } {expiryDate}</Text>
                      </View>
                    :
                      <View style={styles.storeCreditCardContainer}>
                        <Checkbox
                          style={styles.storeCreditCardCheckboxInput}
                          color={Colors[theme].cartContainerButtonBackground}
                          value={storeCreditCardChecked}
                          onValueChange={setStoreCreditCardChecked}
                        />
                        <Text style={[styles.creditCardText, {color: Colors[theme].cartContainerBackgroundContrast}]}>{ i18n?.t('saveCardForFuturePurchases') }</Text>
                      </View>
                    }
                  <Pressable style={[styles.buyButton, {backgroundColor: Colors[theme].cartContainerButtonBackground, marginTop: !cardNumber ? 5 : 3, paddingTop: !user ? 5 : 10, paddingBottom: !user ? 7 : 10}]} onPress={onBuyCart}>
                  { loading ?
                    <ActivityIndicator style={{marginVertical: 1.75}} size="small" />
                  :
                    <View style={{flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
                      { !user ?
                        <Text style={styles.buyButtonTextLoginRequired}>{ i18n?.t('loginRequired') }</Text>
                      : null }
                      <Text style={styles.buyButtonText}>{(cartTotalPrice + (event?.ticket_fee ? event.ticket_fee * cartTotalQuantity : 0)) / 100 + '€  ·  '}{ i18n?.t('buy') }</Text>
                    </View>
                  }
                  </Pressable>
                {/* </> :
                  <Text style={[styles.emptyCard, {color: Colors[theme].cartContainerBackgroundContrast}]}>{ i18n?.t('noTicketsInCart') }</Text>
                } */}
              </Animated.View>
            : null }
          </> }
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
    fontSize: 16,
    marginTop: 5
  },
  ticketsContainer: {
    flex: 1,
    marginHorizontal: 20,
    overflow: 'scroll',
    borderRadius: 5
  },
  accessTickets: {
    marginBottom: 10
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
  creditCardText: {
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
  buyButtonTextLoginRequired: {
    fontSize: 12,
    color: '#ffffffBF',
    fontWeight: '500'
  },
  emptyCard: {
    textAlign: 'center'
  }
});
