import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Platform, Pressable, ScrollView, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
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
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { height: windowHeight } = Dimensions.get('window');
  const { user, i18n, followingEvents, storeFollowingEventsUserData, storeFollowingEventsCookie, theme } = useSupabase();
  const { cart,
    setCart,
    eventBackgroundColor,
    setEventBackgroundColor,
    cardNumber,
    setCardNumber,
    expiryDate,
    setExpiryDate,
    eventTicketsWithLimit,
    setEventTicketsWithLimit,
    event,
    setEvent,
    loading,
    storeCreditCardChecked,
    setStoreCreditCardChecked,
    orderConfirmed,
    setOrderConfirmed,
    setAuthModalAdditionalInfoText,
    buyCartProcess
  } = useEventScreens();

  const [userIsMinor, setUserIsMinor] = useState<boolean>(undefined);
  const [eventTickets, setEventTickets] = useState<EventTicket[]>();
  const [accessEventTickets, setAccessEventTickets] = useState<EventTicket[]>();
  const [accessEventTicketsExpanded, setAccessEventTicketsExpanded] = useState<boolean>(false);
  const [eventTicketsExpanded, setEventTicketsExpanded] = useState<boolean>(false);
  const [moreInfoExpanded, setMoreInfoExpanded] = useState<boolean>(false);
  const [cartTotalPrice, setCartTotalPrice] = useState<number>(0);
  const [cartTotalQuantity, setCartTotalQuantity] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string>('misc');
  const [previousFollowingEvents, setPreviousFollowingEvents] = useState<number[]>(undefined);
  const [eventPosterImageUrl, setEventPosterImageUrl] = useState<string>(undefined);

  useEffect(() => {
    if (!event) return;
    supabase.storage.from('event_posters').list('', { search: event.id.toString() })
    .then(({ data, error }) => {
      if (error || !data.length) {
        setEventPosterImageUrl(null);
        return;
      };
      const { data: publicUrl } = supabase.storage.from('event_posters').getPublicUrl(data[0].name);
      setEventPosterImageUrl(publicUrl.publicUrl);
    });
  }, [event]);

  useEffect(() => {
    let unmounted = false;

    supabase.from('events').select().eq('slug', slug).single()
    .then(({ data: event, error }) => {
      if (unmounted || error || !event) return;
      setEvent(event);
      setAccessEventTicketsExpanded(event.access_tickets_section_expanded);
      setEventTicketsExpanded(event.consumable_tickets_section_expanded);
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
      unmounted = true;
    };
  }, [user]);

  useEffect(() => {
    if (!event || !followingEvents) return;

    setPreviousFollowingEvents(followingEvents);
    if (followingEvents && previousFollowingEvents) return;

    if (!followingEvents.includes(+event.id)) {
      storeFollowingEventsCookie([...followingEvents, +event.id], false, !user);
      if (user) {
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

    supabase.from('event_tickets').select().eq('event_id', event.id).eq('type', 'ACCESS').order('price')
    .then(({ data: event_tickets, error }) => {
      if (unmounted || error || !event_tickets.length) return;
      setAccessEventTickets(event_tickets);
    });

    const queryAllTickets = () => {
      supabase.from('event_tickets').select().eq('event_id', event.id).in('type', ['CONSUMABLE', 'ADDON', 'ADDON_REFUNDABLE']).order('type', { ascending: true }).order('price', { ascending: false })
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
      supabase.from('event_tickets').select().eq('event_id', event.id).in('type', ['CONSUMABLE', 'ADDON', 'ADDON_REFUNDABLE']).is('minor_restricted', false).order('type', { ascending: true }).order('price', { ascending: false })
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
      setAuthModalAdditionalInfoText(i18n?.t('logInToProceedPurchase'));
      router.navigate('/event/authModal');
      return;
    }
    buyCartProcess();
  };

  const onGoToWallet = () => {
    router.navigate('/(tabs)/wallet');
  };

  const onStopFollowingEvent = () => {
    setSelectedOption('misc');
    storeFollowingEventsCookie(followingEvents.filter((eventId) => eventId !== +event.id), true, !user);
    if (user) {
      storeFollowingEventsUserData(followingEvents.filter((eventId) => eventId !== +event.id), true, true);
    }
  };

  const onMoreInfo = () => {
    setMoreInfoExpanded(!moreInfoExpanded);
  };

  const onAccessTicketsExpand = () => {
    setAccessEventTicketsExpanded(!accessEventTicketsExpanded);
  };

  const onEventTicketsExpand = () => {
    setEventTicketsExpanded(!eventTicketsExpanded);
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

  //TODO PAU find a better blurhash
  const blurhash = '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[';

  return (
    <View style={[styles.container, !event || userIsMinor === undefined ? { justifyContent: 'center' } : null]}>
      { !event || userIsMinor === undefined ? <>
        <ActivityIndicator size="large" />
      </> : <>
        <ScrollView>
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
            <View style={styles.eventInfoHeader}>
              { eventPosterImageUrl !== null ?
                <View style={styles.eventInfoHeaderLeft}>
                  <View style={styles.eventImageFrame}>
                    {/* TODO PAU implement the no image case */}
                    <Image
                      style={styles.image}
                      source={eventPosterImageUrl}
                      placeholder={{ blurhash }}
                      contentFit="cover"
                      transition={100}
                    />
                  </View>
                </View>
              : null }
              <View style={styles.eventInfoHeaderRight}>
                <View style={styles.eventInfoHeaderRightHeader}>
                  <Text style={[styles.title, {color: Colors['light'].text}]}>{ event?.name }</Text>
                  <Text style={[styles.eventDescription, {color: Colors['light'].text}]}>{event.description}</Text>
                </View>
                <View style={styles.eventInfoHeaderRightDetails}>
                  { event.start_date ?
                    <View style={styles.detailRow}>
                      <FeatherIcon name="calendar" size={16} color={Colors['light'].text} />
                      <Text style={[styles.detailValue, {color: Colors['light'].text}]}>{new Date(event.start_date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' })}, {new Date(event.start_date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}h</Text>
                    </View>
                  : null }
                  { event.location ?
                    <View style={styles.detailRow}>
                      <FeatherIcon name="map-pin" size={16} color={Colors['light'].text} />
                      <Text style={[styles.detailValue, {color: Colors['light'].text}]}>{event.location}</Text>
                    </View>
                  : null }
                  { event.age_required ?
                    <View style={styles.detailRow}>
                      <FeatherIcon name="plus" size={16} color={Colors['light'].text} />
                      <Text style={[styles.detailValue, {color: Colors['light'].text}]}>{event.age_required}</Text>
                    </View>
                  : null }
                </View>
              </View>
            </View>
            { event.more_info_content ? <>
              <Pressable style={styles.moreEventInfo} onPress={onMoreInfo}>
                <FeatherIcon name={moreInfoExpanded ? 'chevron-up' : 'chevron-down'} size={21} color={Colors['light'].text} />
                <Text style={[styles.moreEventInfoActionable, {color: Colors['light'].text}]}>{ i18n?.t('moreInfo') }</Text>
              </Pressable>
              <CollapsableComponent expanded={moreInfoExpanded} maxHeight={windowHeight - 350}>
                <Text style={[styles.moreEventInfoText, {color: Colors['light'].text}]}>{event.more_info_content}</Text>
              </CollapsableComponent>
            </> : null }
          </Animated.View>
          { eventTickets || accessEventTickets ? <>
            {/* <Animated.View entering={FadeIn.duration(220).easing(Easing.inOut(Easing.quad)).reduceMotion(ReduceMotion.Never)} style={[styles.ticketsContainer, {marginTop: event.more_info_content ? 167 : 177}]}> */}
            <Animated.View entering={FadeIn.duration(220).easing(Easing.inOut(Easing.quad)).reduceMotion(ReduceMotion.Never)} style={styles.ticketsContainer}>
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
              { eventTickets ? <>
                <View>
                  { !accessEventTickets || (accessEventTickets && eventTicketsExpanded) ?
                    <View style={styles.sellingStatusContainer}>
                      <View style={[styles.sellingStatusDot, {backgroundColor: event.selling ? 'green' : 'red'}]}></View>
                      <Text style={[styles.sellingStatus, {color: event.selling ? 'green' : 'red'}]}>{ i18n?.t(event.selling ? 'selling': 'notSelling') }</Text>
                    </View>
                  : null }
                  { accessEventTickets ?
                    <Pressable style={styles.accessTicketsExpand} onPress={onEventTicketsExpand}>
                      <Text style={styles.subtitle}>{ !event.consumable_tickets_section_title ? 'Tickets' : i18n?.t(event.consumable_tickets_section_title) }</Text>
                      <FeatherIcon name={eventTicketsExpanded ? 'chevron-down' : 'chevron-right'} size={24} color={Colors[theme].text} />
                    </Pressable>
                  :
                    <Text style={styles.subtitle}>{ !event.consumable_tickets_section_title ? 'Tickets' : i18n?.t(event.consumable_tickets_section_title) }</Text>
                  }
                  { accessEventTickets ?
                    <CollapsableComponent expanded={eventTicketsExpanded} maxHeight={windowHeight - 35}>
                      <FlatList
                        style={styles.ticketsList}
                        data={eventTickets}
                        renderItem={renderItemTickets}
                      />
                    </CollapsableComponent>
                  :
                    <FlatList
                      style={styles.ticketsList}
                      data={eventTickets}
                      renderItem={renderItemTickets}
                    />
                  }
                </View>
              </> : null }
            </Animated.View>
            
          </> : null }
        </ScrollView>
        { (eventTickets || accessEventTickets) && orderConfirmed ?
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
    gap: 5,
    flex: 1
  },
  eventInfoContainer: {
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
  eventInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12
  },
  eventInfoHeaderLeft: {
    flex: 1
  },
  eventInfoHeaderRight: {
    flex: 2,
    flexDirection: 'column',
    gap: 12
  },
  eventImageFrame: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    padding: 5,
    aspectRatio: 1/1.414
  },
  image: {
    borderRadius: 5,
    flex: 1,
    width: '100%',
    backgroundColor: '#0553',
  },
  eventInfoHeaderRightHeader: {
    flexDirection: 'column',
    gap: 2
  },
  eventInfoHeaderRightDetails: {
    flexDirection: 'column',
    gap: 8
  },
  detailRow: {
    flexDirection: 'row',
    gap: 5
  },
  detailValue: {
    fontSize: 14
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
    fontSize: 24,
    fontWeight: '900'
  },
  subtitle: {
    fontSize: 25,
    fontWeight: '800'
  },
  eventDescription: {
    fontSize: 14
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
    marginTop: 20,
    marginHorizontal: 20,
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
  creditCardSubtext: {
    fontSize: 11
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
