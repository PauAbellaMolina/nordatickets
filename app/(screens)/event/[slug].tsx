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
import { EventTicket, TicketFormSubmit } from '../../../types/supabaseplain';
import { useSupabase } from '../../../context/SupabaseProvider';
import { Picker } from '@react-native-picker/picker';
import { getThemeRandomColor } from '../../../utils/chooseRandomColor';
import { CollapsableComponent } from '../../../components/CollapsableComponent';
import EventAddonTicketCardComponent from '../../../components/EventAddonTicketCardComponent';
import EventAccessTicketCardComponent from '../../../components/EventAccessTicketCardComponent';
import Checkbox from 'expo-checkbox';
import Animated, { Easing, FadeIn, FadeInDown, FadeInUp, FadeOut, FadeOutDown, ReduceMotion } from 'react-native-reanimated';
import { useEventScreens } from '../../../context/EventScreensProvider';
import ImageFullscreen from '../../../components/ImageFullscreen';
import { CartItem } from '../../../context/EventScreensProvider';

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
  const [posterImageExpanded, setPosterImageExpanded] = useState<boolean>(false);
  const [showSentToEmail, setShowSentToEmail] = useState<boolean>(false);

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
  
  const onAddTicketQuantityHandler = (ticket: EventTicket, quantity: number, associatedTicketFormSubmit?: Partial<TicketFormSubmit>) => {
    if (quantity > 0 && ticket.wallet_tickets_limit) {
      if (!eventTicketsWithLimit.some(t => t.id === ticket.id)) {
        setEventTicketsWithLimit([...eventTicketsWithLimit, ticket]);
      }
    }
    if (quantity > 0 && !cart) {
      setCart([{eventTicket: ticket, quantity: quantity, associatedTicketFormSubmit}]);
      return;
    }
    const existingCartItem = cart.find((cartItem) => cartItem.eventTicket.id === ticket.id);
    if (quantity == 0) {
      if (existingCartItem) {
        if (eventTicketsWithLimit.some((t) => t.id === ticket.id)) {
          setEventTicketsWithLimit(eventTicketsWithLimit.filter((t) => t.id !== ticket.id));
        }
        const newCart = cart.filter((cartTicket) => cartTicket.eventTicket.id !== ticket.id);
        setCart(newCart);
      }
      return;
    }
    if (existingCartItem) {
      existingCartItem.quantity = quantity;
      setCart([...cart]);
    } else {
      setCart([...cart, {eventTicket: ticket, quantity: quantity, associatedTicketFormSubmit}]);
    }
  };
  
  const onBuyCart = () => {
    if (!user) {
      setAuthModalAdditionalInfoText(i18n?.t('logInToProceedPurchase'));
      router.navigate('/event/authModal');
      return;
    }
    if (!cart.some((cartItem) => !cartItem.eventTicket.email_qr_pdf)) {
      setShowSentToEmail(true);
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

  const onPosterImagePress = () => {
    setPosterImageExpanded(!posterImageExpanded);
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
    setShowSentToEmail(false);
  };

  const renderItemAccessTickets = useCallback(({item}: {item: EventTicket}) => {
    if (item.hide_from_event_page) return;
    return <EventAccessTicketCardComponent ticket={item} eventSelling={event?.selling_access} quantityInCart={cart?.find((cartItem) => cartItem.eventTicket.id === item.id)?.quantity ?? 0} onRemoveTicket={onRemoveTicketHandler} onAddTicket={onAddTicketHandler} onAddTicketQuantity={onAddTicketQuantityHandler} />;
  }, [cart, event]);

  const renderItemTickets = useCallback(({item}: {item: EventTicket}) => {
    if (item.hide_from_event_page) return;
    if (item.type === "ADDON" || item.type === "ADDON_REFUNDABLE") {
      return <EventAddonTicketCardComponent ticket={item} eventSelling={event?.selling} quantityInCart={cart?.find((cartItem) => cartItem.eventTicket.id === item.id)?.quantity ?? 0} onRemoveTicket={onRemoveTicketHandler} onAddTicket={onAddTicketHandler} />;
    }
    return <EventTicketCardComponent ticket={item} eventSelling={event?.selling} quantityInCart={cart?.find((cartItem) => cartItem.eventTicket.id === item.id)?.quantity ?? 0} onRemoveTicket={onRemoveTicketHandler} onAddTicket={onAddTicketHandler} />;
  }, [cart, event]);

  const renderItemCartTicket = useCallback(({item}: {item: CartItem}) => (
    <Text style={style.cartItemsList}>{ (item.eventTicket.type === "ADDON" || item.eventTicket.type === "ADDON_REFUNDABLE") ? null : item.quantity + '  -  ' }{item.eventTicket.name} · {item.eventTicket.price/100}€</Text>
  ), []);

  //TODO PAU find a better blurhash
  const blurhash = '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[';

  const style = styles(theme);

  return (
    <View style={[style.container, !event || userIsMinor === undefined ? { justifyContent: 'center' } : null]}>
      { posterImageExpanded ?
        <ImageFullscreen
          image={eventPosterImageUrl}
          onClose={onPosterImagePress}
        />
      : null }
      
      { !event || userIsMinor === undefined ? <>
        <ActivityIndicator size="large" />
      </> : <>
        <ScrollView scrollEnabled={!posterImageExpanded} style={posterImageExpanded ? style.posterImageExpandedBlur : null}>
          <Animated.View entering={FadeInUp.duration(205).easing(Easing.inOut(Easing.quad)).reduceMotion(ReduceMotion.Never)} style={[style.eventInfoContainer, {backgroundColor: eventBackgroundColor, paddingBottom: event.more_info_content ? 40 : 10}]}>
            <GoBackArrow />
            <View style={style.stopFollowingButton}>
              <FeatherIcon name="more-horizontal" size={35} color={Colors['light'].text} />
              <Picker
                style={style.optionsPicker}
                selectedValue={selectedOption}
                onValueChange={() => onStopFollowingEvent()}
              >
                <Picker.Item label={ i18n?.t('stopFollowingEventQuestion') } value="misc" enabled={false} />
                <Picker.Item label={ i18n?.t('stopFollowingEventConfirmation') } value="unfollow" />
              </Picker>
            </View>
            <View style={style.eventInfoHeader}>
              { eventPosterImageUrl !== null ?
                <View style={style.eventInfoHeaderLeft}>
                  <Pressable onPress={onPosterImagePress} style={style.eventImageFrame}>
                    <Image
                      style={style.image}
                      source={eventPosterImageUrl}
                      placeholder={{ blurhash }}
                      contentFit="cover"
                      transition={100}
                    />
                  </Pressable>
                </View>
              : null }
              <View style={style.eventInfoHeaderRight}>
                <View style={style.eventInfoHeaderRightHeader}>
                  <Text style={style.title}>{ event?.name }</Text>
                  <Text style={style.eventDescription}>{event.description}</Text>
                </View>
                <View style={style.eventInfoHeaderRightDetails}>
                  { event.start_date ?
                    <View style={style.detailRow}>
                      <FeatherIcon name="calendar" size={16} color={Colors['light'].text} />
                      <Text style={style.detailValue}>{new Date(event.start_date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' })}, {new Date(event.start_date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}h</Text>
                    </View>
                  : null }
                  { event.location ?
                    <View style={style.detailRow}>
                      <FeatherIcon name="map-pin" size={16} color={Colors['light'].text} />
                      <Text style={style.detailValue}>{event.location}</Text>
                    </View>
                  : null }
                  { event.age_required ?
                    <View style={style.detailRow}>
                      <FeatherIcon name="plus" size={16} color={Colors['light'].text} />
                      <Text style={style.detailValue}>{event.age_required}</Text>
                    </View>
                  : null }
                </View>
              </View>
            </View>
            { event.more_info_content ? <>
              <Pressable style={style.moreEventInfo} onPress={onMoreInfo}>
                <FeatherIcon name={moreInfoExpanded ? 'chevron-up' : 'chevron-down'} size={21} color={Colors['light'].text} />
                <Text style={style.moreEventInfoActionable}>{ i18n?.t('moreInfo') }</Text>
              </Pressable>
              <CollapsableComponent expanded={moreInfoExpanded} maxHeight={windowHeight - 350}>
                <Text style={style.moreEventInfoText}>{event.more_info_content}</Text>
              </CollapsableComponent>
            </> : null }
          </Animated.View>
          { eventTickets || accessEventTickets ? <>
            {/* <Animated.View entering={FadeIn.duration(220).easing(Easing.inOut(Easing.quad)).reduceMotion(ReduceMotion.Never)} style={[style.ticketsContainer, {marginTop: event.more_info_content ? 167 : 177}]}> */}
            <Animated.View entering={FadeIn.duration(220).easing(Easing.inOut(Easing.quad)).reduceMotion(ReduceMotion.Never)} style={style.ticketsContainer}>
              { accessEventTickets ? <>
                <View style={style.accessTickets}>
                  { accessEventTicketsExpanded ?
                    <View style={style.sellingStatusContainer}>
                      <View style={[style.sellingStatusDot, {backgroundColor: event.selling_access ? 'green' : 'red'}]}></View>
                      <Text style={[style.sellingStatus, {color: event.selling_access ? 'green' : 'red'}]}>{ i18n?.t(event.selling_access ? 'selling': 'notSelling') }</Text>
                    </View>
                  : null }
                  <Pressable style={style.accessTicketsExpand} onPress={onAccessTicketsExpand}>
                    <Text style={style.subtitle}>{ !event.access_tickets_section_title ? i18n?.t('accessControlTickets') : i18n?.t(event.access_tickets_section_title) }</Text>
                    <FeatherIcon name={accessEventTicketsExpanded ? 'chevron-down' : 'chevron-right'} size={24} color={Colors[theme].text} />
                  </Pressable>
                  <CollapsableComponent expanded={accessEventTicketsExpanded} maxHeight={windowHeight - 35}>
                    <FlatList
                      style={style.ticketsList}
                      data={accessEventTickets}
                      renderItem={renderItemAccessTickets}
                    />
                  </CollapsableComponent>
                </View>
              </> : null }
              { eventTickets ? <>
                <View>
                  { !accessEventTickets || (accessEventTickets && eventTicketsExpanded) ?
                    <View style={style.sellingStatusContainer}>
                      <View style={[style.sellingStatusDot, {backgroundColor: event.selling ? 'green' : 'red'}]}></View>
                      <Text style={[style.sellingStatus, {color: event.selling ? 'green' : 'red'}]}>{ i18n?.t(event.selling ? 'selling': 'notSelling') }</Text>
                    </View>
                  : null }
                  { accessEventTickets ?
                    <Pressable style={style.accessTicketsExpand} onPress={onEventTicketsExpand}>
                      <Text style={style.subtitle}>{ !event.consumable_tickets_section_title ? 'Tickets' : i18n?.t(event.consumable_tickets_section_title) }</Text>
                      <FeatherIcon name={eventTicketsExpanded ? 'chevron-down' : 'chevron-right'} size={24} color={Colors[theme].text} />
                    </Pressable>
                  :
                    <Text style={style.subtitle}>{ !event.consumable_tickets_section_title ? 'Tickets' : i18n?.t(event.consumable_tickets_section_title) }</Text>
                  }
                  { accessEventTickets ?
                    <CollapsableComponent expanded={eventTicketsExpanded} maxHeight={windowHeight - 35}>
                      <FlatList
                        style={style.ticketsList}
                        data={eventTickets}
                        renderItem={renderItemTickets}
                      />
                    </CollapsableComponent>
                  :
                    <FlatList
                      style={style.ticketsList}
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
          <Pressable style={style.orderConfirmedContainer} onPress={showSentToEmail ? onDismissAddedToWallet : onGoToWallet}>
            <Pressable onPress={onDismissAddedToWallet} style={style.dismissAddedToWallet}>
              <FeatherIcon name="x" size={25} color={Colors[theme].text} />
            </Pressable>
            <FeatherIcon name="check-circle" size={40} color={Colors[theme].text} />
            { showSentToEmail ?
              <View style={style.orderConfirmedTextContainerEmail}>
                <Text style={style.orderConfirmedSubtitle}>{ i18n?.t('ticketsSentToEmail')}</Text>
                <Text style={[style.orderConfirmedSubtitle, {fontSize: 18}]}>{ user.email }</Text>
              </View>
              :
              <View style={style.orderConfirmedTextContainer}><Text style={style.orderConfirmedSubtitle}>{ i18n?.t('ticketsAddedToWallet') }</Text><FeatherIcon name="arrow-up-right" size={25} color={Colors[theme].text} /></View>
            }
          </Pressable>
        : <>
          { cart?.length ?
            <Animated.View
              entering={FadeInDown.duration(200).easing(Easing.inOut(Easing.quad)).reduceMotion(ReduceMotion.Never)}
              exiting={FadeOutDown.duration(150).easing(Easing.out(Easing.exp)).reduceMotion(ReduceMotion.Never)}
              style={[style.cartContainer, moreInfoExpanded ? style.cartContainerCollapsedMode : {}]}
            >
              { moreInfoExpanded ?
                <Animated.View
                  entering={FadeIn.duration(200).easing(Easing.inOut(Easing.quad)).reduceMotion(ReduceMotion.Never)}
                  exiting={FadeOut.duration(150).easing(Easing.out(Easing.exp)).reduceMotion(ReduceMotion.Never)}
                >
                  <Pressable style={[style.cartTitleRowContainer, {width: '100%', height: '100%'}]} onPress={onMoreInfo}>
                    <Text style={style.collapsedCartSubtitle}>{ i18n?.t('continueWithCart') }</Text>
                    <FeatherIcon name="arrow-right" size={16} color={Colors[theme].text} />
                  </Pressable>
                </Animated.View>
              : <>
                <View style={style.cartTitleRowContainer}><Text style={style.subtitle}>{ i18n?.t('cart') }</Text><FeatherIcon name="shopping-cart" size={22} color={Colors[theme].text} /></View>
                <FlatList
                  style={style.cartList}
                  data={cart}
                  renderItem={renderItemCartTicket}
                  ItemSeparatorComponent={() => <View style={{height: 3}} />}
                />
                { event.ticket_fee ?
                  <View style={{marginHorizontal: 8, flexDirection: 'row', alignItems: 'flex-end'}}>
                    <Text style={style.transactionFeePrice}>+ {event.ticket_fee * cartTotalQuantity / 100}€ </Text>
                    <Text style={style.creditCardText}>{ i18n?.t('serviceFee') }</Text>
                  </View>
                : null }
                  { cardNumber ?
                    <View style={style.usingCreditCardContainer}>
                      <FeatherIcon name="info" size={15} color={Colors[theme].cartContainerBackgroundContrast} />
                      <Text style={style.creditCardText}>{ i18n?.t('usingCreditCard') } {cardNumber.slice(-7)}</Text>
                    </View>
                  : expiryDate ?
                    <View style={style.usingCreditCardContainer}>
                      <FeatherIcon name="info" size={15} color={Colors[theme].cartContainerBackgroundContrast} />
                      <Text style={style.creditCardText}>{ i18n?.t('usingCardWithExpiryDate') } {expiryDate}</Text>
                    </View>
                  :
                    <View style={style.storeCreditCardContainer}>
                      <Checkbox
                        style={style.storeCreditCardCheckboxInput}
                        color={Colors[theme].cartContainerButtonBackground}
                        value={storeCreditCardChecked}
                        onValueChange={setStoreCreditCardChecked}
                      />
                      <Text style={style.creditCardText}>{ i18n?.t('saveCardForFuturePurchases') }</Text>
                    </View>
                  }
                <Pressable style={[style.buyButton, {marginTop: !cardNumber ? 5 : 3, paddingTop: !user ? 5 : 10, paddingBottom: !user ? 7 : 10}]} onPress={onBuyCart}>
                { loading ?
                  <ActivityIndicator style={{marginVertical: 1.75}} size="small" />
                :
                  <View style={{flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
                    { !user ?
                      <Text style={style.buyButtonTextLoginRequired}>{ i18n?.t('loginRequired') }</Text>
                    : null }
                    <Text style={style.buyButtonText}>{(cartTotalPrice + (event?.ticket_fee ? event.ticket_fee * cartTotalQuantity : 0)) / 100 + '€  ·  '}{ i18n?.t('buy') }</Text>
                  </View>
                }
                </Pressable>
              </> }
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

const styles = (theme: string) => StyleSheet.create({
  container: {
    gap: 5,
    flex: 1
  },
  posterImageExpandedBlur: {
    position: 'relative',
    ...Platform.select({
      web: {
        filter: 'blur(3px)'
      }
    })
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
    flex: 1,
    minWidth: 115,
    maxWidth: 175,
    aspectRatio: 1/1.414,
    alignSelf: 'flex-start'
  },
  eventInfoHeaderRight: {
    flex: 2,
    flexDirection: 'column',
    gap: 12
  },
  eventImageFrame: {
    flex: 1,
    backgroundColor: '#ffffff40',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    padding: 3,
    width: '100%',
    height: '100%'
  },
  image: {
    borderRadius: 7,
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#0553'
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
    fontSize: 14,
    color: Colors['light'].text
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
    fontWeight: '900',
    color: Colors['light'].text
  },
  subtitle: {
    fontSize: 25,
    fontWeight: '800'
  },
  collapsedCartSubtitle: {
    fontSize: 16,
    fontWeight: '800'
  },
  eventDescription: {
    fontSize: 14,
    color: Colors['light'].text
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
    fontWeight: '500',
    color: Colors['light'].text
  },
  moreEventInfoText: {
    fontSize: 16,
    marginTop: 5,
    color: Colors['light'].text
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
    backgroundColor: Colors[theme].cartContainerBackground,
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
  orderConfirmedTextContainerEmail: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3
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
    backgroundColor: Colors[theme].cartContainerBackground,
    ...Platform.select({
      web: {
        boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.15)'
      },
      ios: {...cartContainerMobileShadow},
      android: {...cartContainerMobileShadow, elevation: 3}
    })
  },
  cartContainerCollapsedMode: {
    position: 'absolute',
    justifyContent: 'center',
    bottom: 15,
    height: 35,
    width: '75%',
    margin: 0,
    padding: 0
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
    fontSize: 16,
    color: Colors[theme].cartContainerBackgroundContrast
  },
  creditCardText: {
    fontSize: 14,
    color: Colors[theme].cartContainerBackgroundContrast
  },
  creditCardSubtext: {
    fontSize: 11
  },
  buyButton: {
    width: '100%',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors[theme].cartContainerButtonBackground
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
