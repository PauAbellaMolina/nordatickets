import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated as RNAnimated, Platform, Pressable, StyleSheet} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Colors from '../../../../constants/Colors';
import { Text, View } from '../../../../components/Themed';
import { EntypoIcon, FeatherIcon, FontAwesomeIcon } from '../../../../components/CustomIcons';
import { supabase } from "../../../../supabase";
import { useSupabase } from '../../../../context/SupabaseProvider';
import { getThemeRandomColor } from '../../../../utils/chooseRandomColor';
import { TicketFormSubmit, WalletTicket } from '../../../../types/supabaseplain';
import { CollapsableComponent } from '../../../../components/CollapsableComponent';
import Animated, { Easing, FadeIn, FadeInDown, ReduceMotion } from 'react-native-reanimated';

export default function ActivateTicketScreen() {
  const { i18n, user, theme } = useSupabase();
  const [loading, setLoading] = useState<boolean>(false);
  const [showConfirm, setShowConfirm] = useState<boolean>(false);
  const [lightTicketThemeColor, setLightTicketThemeColor] = useState<string>();
  const [darkTicketThemeColor, setDarkTicketThemeColor] = useState<string>();
  const [ticketThemeColor, setTicketThemeColor] = useState<string>();
  const [buttonTicketBackgroundColor, setButtonTicketBackgroundColor] = useState<string>();
  const [buttonTicketBorderColor, setButtonTicketBorderColor] = useState<string>();
  const [eventName, setEventName] = useState<string>('');
  const [ticketDeactivable, setTicketDeactivable] = useState<boolean>(false);
  const [ticketName, setTicketName] = useState<string>('');
  const [ticketUsedAt, setTicketUsedAt] = useState<string>(undefined);
  const [ticketRefundedAt, setTicketRefundedAt] = useState<string>(undefined);
  const [ticketUsedTimeAgo, setTicketUsedTimeAgo] = useState<string>();
  const [ticketType, setTicketType] = useState<string>();
  const [addonTicket, setAddonTicket] = useState<WalletTicket>(undefined);
  const [purchasedAdditionalInfo, setPurchasedAdditionalInfo] = useState<string>();
  const [purchasedConditionsNotice, setPurchasedConditionsNotice] = useState<string>();
  const [ticketFormSubmit, setTicketFormSubmit] = useState<TicketFormSubmit>();
  const [formSubmitExpanded, setFormSubmitExpanded] = useState<boolean>(false);
  const [purchasedAdditionalInfoExpanded, setPurchasedAdditionalInfoExpanded] = useState<boolean>(false);

  const { id } = useLocalSearchParams<{ id: string }>();

  useEffect(() => {
    if (!user) return;
    let unmounted = false;
    fetchWalletTickets(unmounted);

    return () => {
      unmounted = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user || !ticketUsedAt) return;
    calculateTimeAgo();
    const i = setInterval(calculateTimeAgo, 1000);

    return () => clearInterval(i);
  }, [ticketUsedAt]);

  useEffect(() => {
    setTicketThemeColor(theme === 'dark' ? darkTicketThemeColor : lightTicketThemeColor);
  }, [theme]);

  useEffect(() => {
    if (!ticketThemeColor) return;
    if (theme === 'dark') {
      const fullOpacityHex = ticketThemeColor.slice(0, 7);
      setButtonTicketBackgroundColor(fullOpacityHex + '47');
      setButtonTicketBorderColor(fullOpacityHex + '66');
    } else {
      setButtonTicketBackgroundColor(ticketThemeColor + 'BF');
      setButtonTicketBorderColor('#00000040');
    }
  }, [ticketThemeColor]);

  const calculateTimeAgo = () => {
    const usedAt = new Date(new Date(ticketUsedAt).setMilliseconds(0));
    const now = new Date();
    const diff = now.getTime() - usedAt.getTime();
    const seconds = Math.floor(diff / 1000) % 60;
    const minutes = Math.floor(diff / 1000 / 60) % 60;
    const hours = Math.floor(diff / 1000 / 60 / 60) % 24;
    const days = Math.floor(diff / 1000 / 60 / 60 / 24);

    let timeAgo = '';
    if (days > 0) {
      timeAgo += `${days} ${i18n?.t('days')} `;
    }
    if (hours > 0) {
      timeAgo += `${hours} ${i18n?.t('hours')} `;
    }
    if (minutes > 0) {
      timeAgo += `${minutes} ${i18n?.t('minutes')} `;
    }
    if (seconds >= 0) {
      timeAgo += `${seconds} ${i18n?.t('seconds')}`;
    }

    setTicketUsedTimeAgo(timeAgo.trim());
  };

  const fetchWalletTickets = (unmounted: boolean) => {
    supabase.from('wallet_tickets').select().eq('id', id).single()
    .then(({ data: wallet_ticket, error }) => {
      if (error || !wallet_ticket) {
        router.navigate('/(tabs)/wallet');
        return;
      };

      if (wallet_ticket.ticket_form_submits_id) {
        supabase.from('ticket_form_submits').select().eq('id', wallet_ticket.ticket_form_submits_id).single()
        .then(({ data: ticket_form_submit, error }) => {
          if (error || !ticket_form_submit) return;
          setTicketFormSubmit(ticket_form_submit);
        });
      }

      if (wallet_ticket.event_tickets_purchased_additional_info) {
        setPurchasedAdditionalInfo(wallet_ticket.event_tickets_purchased_additional_info);
      }
      if (wallet_ticket.event_tickets_purchased_conditions_notice) {
        setPurchasedConditionsNotice(wallet_ticket.event_tickets_purchased_conditions_notice);
      }

      if (wallet_ticket.order_id === 'free') {
        proceedWalletTickets(wallet_ticket, unmounted);
        return;
      }

      supabase.from('redsys_orders').select().eq('order_id', wallet_ticket.order_id).single()
      .then(({ data: redsys_order, error }) => {
        if (error || !redsys_order) return;
        if (redsys_order.order_status === 'PAYMENT_PENDING') {
          router.navigate('/(tabs)/wallet');
          return;
        }

        proceedWalletTickets(wallet_ticket, unmounted);
      });
    });
  };
  
  const proceedWalletTickets = (wallet_ticket: WalletTicket, unmounted: boolean) => {
    if (wallet_ticket.type === 'ADDON' || wallet_ticket.type === 'ADDON_REFUNDABLE') {
      router.navigate('/(tabs)/wallet');
      return;
    }

    setTicketName(wallet_ticket.event_tickets_name);
    setTicketUsedAt(wallet_ticket.used_at);
    setTicketRefundedAt(wallet_ticket.refunded_at);
    setTicketType(wallet_ticket.type);

    supabase.from('event_tickets').select().eq('id', wallet_ticket.event_tickets_id).single()
    .then(({ data: event_ticket, error }) => {
      if (unmounted || error || !event_ticket) return;
      if ((theme === 'dark' && !event_ticket?.color_code_dark) || (theme === 'light' && !event_ticket?.color_code_light)) {
        setTicketThemeColor(getThemeRandomColor(theme));
        setDarkTicketThemeColor(getThemeRandomColor('dark'));
        setLightTicketThemeColor(getThemeRandomColor('light'));
        return;
      };

      setDarkTicketThemeColor(event_ticket?.color_code_dark ? event_ticket.color_code_dark : getThemeRandomColor('dark'));
      setLightTicketThemeColor(event_ticket?.color_code_light ? event_ticket.color_code_light : getThemeRandomColor('light'));

      if (theme === 'dark') {
        setTicketThemeColor(event_ticket.color_code_dark);
      } else {
        setTicketThemeColor(event_ticket.color_code_light);
      }
    });
    
    supabase.from('events').select().eq('id', wallet_ticket.event_id).single()
    .then(({ data: event, error }) => {
      if (unmounted || error || !event) return;
      setEventName(event.name);
      setTicketDeactivable(event.tickets_deactivable);
    });

    if (wallet_ticket.type === 'CONSUMABLE') {
      if (wallet_ticket.used_at === null && wallet_ticket.refunded_at === null) {
        supabase.from('wallet_tickets').select().eq('event_id', wallet_ticket.event_id).eq('user_id', user.id).in('type', ['ADDON', 'ADDON_REFUNDABLE']).is('used_at', null).is('refunded_at', null)
        .then(async ({ data: addon_wallet_tickets, error }) => {
          if (unmounted || error || !addon_wallet_tickets.length) {
            setAddonTicket(null);
            return;
          };

          let didFindSucceededPayment = false;
          for (let i = 0; i < addon_wallet_tickets.length; i++) {
            if (addon_wallet_tickets[i].order_id === 'free') {
              didFindSucceededPayment = true;
              setAddonTicket(addon_wallet_tickets[i]);
              break;
            }
            const { data: addon_redsys_order, error } = await supabase.from('redsys_orders').select().eq('order_id', addon_wallet_tickets[i].order_id).single();
            if (error || !addon_redsys_order) return false;
            if (addon_redsys_order.order_status === 'PAYMENT_SUCCEEDED') {
              didFindSucceededPayment = true;
              setAddonTicket(addon_wallet_tickets[i]);
              break;
            }
          }
          if (!didFindSucceededPayment) {
            setAddonTicket(null);
          }
        });
      } else if (wallet_ticket.used_with_addon_id) {
        supabase.from('wallet_tickets').select().eq('id', wallet_ticket.used_with_addon_id).single()
        .then(({ data: addon_wallet_ticket, error }) => {
          if (unmounted || error) {
            setAddonTicket(null);
            return;
          };
          setAddonTicket(addon_wallet_ticket);
        });
      } else {
        setAddonTicket(null);
      }
    } else {
      setAddonTicket(null);
    }
  };

  const onDeactivateTicket = async () => {
    if (loading) {
      return;
    }
    setShowConfirm(true);

    // Native/Browser confirm dialog code (might not work just uncommenting it)
    // if (Platform.OS === 'web') {
    //   if (!window.confirm(i18n?.t('deactivateTicketConfirmationQuestion'))) {
    //     return;
    //   }
    // } 
    // // else { //Uncomment if on mobile and import Alert from react-native
    // //   const AsyncAlert = async () => new Promise<boolean>((resolve) => {
    // //     Alert.prompt(i18n?.t('deactivateTicket'), i18n?.t('deactivateTicketConfirmationQuestion'),
    // //       [{
    // //         text: "No",
    // //         onPress: () => {
    // //           resolve(true);
    // //         },
    // //         style: "cancel"
    // //       },
    // //       {
    // //         text: i18n?.t('yesDeactivate'),
    // //         onPress: () => {
    // //           resolve(false);
    // //         }
    // //       }],
    // //       "default");
    // //   });
    // //   if (await AsyncAlert()) {
    // //     return;
    // //   };
    // // }
  };

  const onConfirmDeactivateTicket = async () => {
    if (loading) {
      return;
    }

    setShowConfirm(false);
    setLoading(true);
    if (addonTicket) {
      supabase.rpc('update_wallet_tickets_used_at', { req_user_id: user.id, wallet_tickets_id: addonTicket.id, addon_id: null })
      .then(() => {
        deactivateWalletTicket();
      });
      return;
    }
    deactivateWalletTicket();
  };

  const deactivateWalletTicket = () => {
    supabase.rpc('update_wallet_tickets_used_at', { req_user_id: user.id, wallet_tickets_id: +id, addon_id: addonTicket ? addonTicket.id : null })
    .then(({ data: usedAt }) => {
      if (!usedAt) return;
      setTicketUsedAt(usedAt);
      setLoading(false);
    });
  }

  const scale = useRef(new RNAnimated.Value(1));
  const opacity = useRef(new RNAnimated.Value(1));

  useEffect(() => {
    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(opacity.current, { toValue: .1, duration: 800, useNativeDriver: true }),
        RNAnimated.timing(opacity.current, { toValue: 1, duration: 750, useNativeDriver: true })
      ])
    ).start();
  }, []);

  const style = styles(theme);
  
  return (
    <View style={style.container}>
      { Platform.OS !== 'web' ? <View style={style.expanderNotch}></View> : <></> }
      { !ticketThemeColor || !eventName || !ticketName || addonTicket === undefined ? <>
        <ActivityIndicator size="large" />
      </> : <>
        <Animated.View entering={FadeInDown.duration(300).easing(Easing.inOut(Easing.quad)).reduceMotion(ReduceMotion.Never)} style={[style.ticketContainer, {backgroundColor: ticketThemeColor}]}>
          <View style={[style.ticketInfoContainer, { gap: ticketFormSubmit ? 20 : 8 }]}>
            <RNAnimated.View style={[style.pulseContainer, {transform: [{ scale: scale.current }], opacity: opacity.current }]}>
              <View style={[style.pulseDot, {backgroundColor: ticketUsedAt === undefined || ticketRefundedAt === undefined ? 'transparent' : ticketUsedAt != null || ticketRefundedAt != null ? '#ff3737' : '#3fde7a'}]} />
            </RNAnimated.View>
            <View style={[style.ticketInfoTextsContainer, addonTicket || ticketFormSubmit ? {justifyContent: 'flex-end'} : {justifyContent: 'center'}]}>
              <Text style={style.ticketName} numberOfLines={4}>{ ticketName }</Text>
              <Text style={style.eventName}>{ eventName }</Text>
            </View>
            { addonTicket ?
              <View style={style.plusAddonTicketContainer}>
                <FeatherIcon name="plus" size={26} color={Colors['light'].text} />
                <View style={style.addonTicketContainer}>
                  <View style={style.addonTicketIconWrapper}>
                    <EntypoIcon name="cup" size={30} color={Colors['light'].text} />
                  </View>
                  <View style={style.addonTicketNameWrapper}>
                    <Text style={[style.addonTicketName, {color: Colors['light'].text}]} numberOfLines={1}>{addonTicket.event_tickets_name}</Text>
                    <Text style={[style.addonTicketSubtitle, {color: theme === 'dark' ? 'lightgray' : 'gray'}]}>{ addonTicket.type === 'ADDON_REFUNDABLE' ? i18n?.t('activateTicketRefundableAddonExplanation') : i18n?.t('activateTicketNonRefundableAddonExplanation') }</Text>
                  </View>
                </View>
              </View>
            : null }
            { ticketFormSubmit ? 
              <View style={style.formSubmitContainer}>
                <Pressable onPress={() => setFormSubmitExpanded(!formSubmitExpanded)}>
                  <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3, opacity: .8}}>
                    <FeatherIcon name={formSubmitExpanded ? 'chevron-up' : 'chevron-down'} size={20} color={Colors[theme].text} />
                    <Text>{ i18n?.t('showFormSubmit') }</Text>
                  </View>
                </Pressable>
                <CollapsableComponent expanded={formSubmitExpanded} maxHeight={125}>
                  <View style={style.formSubmitContent}>
                    { ticketFormSubmit.entries.map((entry, index) => {
                      return <View key={index} style={{flexBasis: '48%', minWidth: 125, flexWrap: 'wrap', alignItems: index % 2 === 0 ? 'flex-end' : 'flex-start'}}><Text key={index} style={index % 2 === 0 ? style.formSubmitQuestion : style.formSubmitAnswer}>{ entry + (index % 2 === 0 ? ':' : '') }</Text></View>
                    })}
                  </View>
                </CollapsableComponent>
              </View>
            : null }
            { purchasedAdditionalInfo ?
              <View style={style.additionalInfoContainer}>
                <Pressable onPress={() => setPurchasedAdditionalInfoExpanded(!purchasedAdditionalInfoExpanded)}>
                  <View style={style.additionalInfoCollapsableContainer}>
                    <FeatherIcon name={purchasedAdditionalInfoExpanded ? 'chevron-up' : 'chevron-down'} size={20} color={Colors[theme].text} />
                    <Text style={style.additionalInfoTitle}>{ i18n?.t('additionalInfoAndConditions') }</Text>
                  </View>
                </Pressable>
                <CollapsableComponent expanded={purchasedAdditionalInfoExpanded} maxHeight={125}>
                  <View style={style.additionalInfoContent}>
                    <Text style={style.additionalInfoTitle}>{ i18n?.t('additionalInfo') }:</Text>
                    <Text style={style.additionalInfoText}>{ purchasedAdditionalInfo }</Text>
                    <Text style={style.additionalInfoTitle}>{ i18n?.t('conditions') }:</Text>
                    <Text style={style.additionalInfoText}>{ purchasedConditionsNotice }</Text>
                  </View>
                </CollapsableComponent>
              </View>
            : null }
          </View>
          <View style={style.ticketDecorContainer}>
            <View style={style.ticketLeftCutout}></View>
            <View style={style.ticketDivider}></View>
            <View style={style.ticketRightCutout}></View>
          </View>
          <View style={[style.ticketStatusContainer, {backgroundColor: ticketUsedAt === undefined || ticketRefundedAt === undefined ? 'transparent' : ticketUsedAt != null || ticketRefundedAt != null ? '#ff3737' : '#3fde7a', paddingVertical: ticketUsedAt === undefined || ticketRefundedAt === undefined || !ticketUsedTimeAgo ? 30 : 21.25}]}>
            { ticketUsedAt === undefined || ticketRefundedAt === undefined ? <>
              <Text style={[style.statusText, {color: Colors['light'].text}]}>{ i18n?.t('loading') } ticket...</Text>
              <Text style={style.statusInfoText}> </Text>
            </> : <>{ ticketUsedAt === null && ticketRefundedAt === null ? <>
                <Text style={[style.statusText, {color: Colors['light'].text}]}>{ i18n?.t('ticketActive') }</Text>
                <Text style={[style.statusInfoText, {color: Colors['light'].text}]}>{ ticketType === 'CONSUMABLE' ? i18n?.t('deactivateTicketOnDrinkExplanation') : i18n?.t('deactivateTicketOnAccessExplanation') }</Text>
              </> : <>
                <Text style={[style.statusText, {color: Colors['light'].text}]}>{ i18n?.t('ticketUnactive') }</Text>
                <View style={{ alignItems: 'center' }}>
                  { ticketRefundedAt != null ? <>
                    <Text style={[style.statusInfoText, {color: Colors['light'].text}]}>{ i18n?.t('ticketRefundedExplanation') }</Text>
                    { ticketUsedAt != null ? <>
                      <Text style={[style.statusInfoText, {color: Colors['light'].text}]}>{ !ticketUsedTimeAgo ? i18n?.t('ticketAlreadyUsedExplanation') : i18n?.t('ticketUsedTimeAgoExplanation') }</Text>
                      <Text style={[style.statusInfoTextTime, {color: Colors['light'].text}]}>{ ticketUsedTimeAgo }</Text>
                    </> : null }
                  </> : <>
                    { ticketUsedAt != null ? <>
                      <Text style={[style.statusInfoText, {color: Colors['light'].text}]}>{ !ticketUsedTimeAgo ? i18n?.t('ticketAlreadyUsedExplanation') : i18n?.t('ticketUsedTimeAgoExplanation') }</Text>
                      <Text style={[style.statusInfoTextTime, {color: Colors['light'].text}]}>{ ticketUsedTimeAgo }</Text>
                    </> : null }
                  </> }
                </View>
              </>}</>
            }
          </View>
        </Animated.View>
        { !showConfirm ? <>
          <Animated.View entering={FadeIn.delay(255).duration(200).easing(Easing.inOut(Easing.quad)).withInitialValues({opacity: 0}).reduceMotion(ReduceMotion.Never)} style={[style.actionsButtonsContainer, {opacity: 1}]} >
            <Pressable disabled={loading} onPress={() => router.navigate('/(tabs)/wallet')} style={[style.button, loading ? {opacity: .7} : {}, {height: '100%', flex: 1, justifyContent: 'center'}, {borderColor: buttonTicketBorderColor, backgroundColor: buttonTicketBackgroundColor}]}>
              <FeatherIcon name="arrow-left" size={28} color={Colors[theme].text} />
            </Pressable>
            <Pressable disabled={!ticketDeactivable || ticketUsedAt === undefined || ticketUsedAt != null || ticketRefundedAt === undefined || ticketRefundedAt != null} onPress={onDeactivateTicket} style={[style.button, !ticketDeactivable || ticketUsedAt === undefined || ticketUsedAt != null || ticketRefundedAt === undefined || ticketRefundedAt != null || loading ? {opacity: .7} : {}, {borderColor: buttonTicketBorderColor, backgroundColor: buttonTicketBackgroundColor}]}>
              {loading ?
                <ActivityIndicator style={style.buttonLoading} size="small" />
              :
                <Text style={style.buttonText}>{ i18n?.t('deactivateTicket') }</Text>
              }
            </Pressable>
          </Animated.View>
        </> : <>
          <View style={style.actionsConfirmContainer}>
            <Text style={style.confirmPrompt}>{ i18n?.t('deactivateTicketConfirmationQuestion') }</Text>
            <View style={style.actionsConfirmButtonsContainer}>
              <Pressable onPress={() => setShowConfirm(false)} style={[style.button, style.buttonConfirm, {flex: 1, borderWidth: 1.25, borderColor: '#E84F44', backgroundColor: buttonTicketBackgroundColor}]}>
                <Text style={style.buttonText}>No</Text>
              </Pressable>
              <Pressable onPress={onConfirmDeactivateTicket} style={[style.button, style.buttonConfirm, {flex: 1.5, borderColor: '#79D475', backgroundColor: buttonTicketBackgroundColor}]}>
                <Text style={style.buttonText}>{ i18n?.t('yesDeactivate') }</Text>
              </Pressable>
            </View>
          </View>
        </>}
      </> }

      {/* Use a light status bar on iOS to account for the black space above the modal */}
      {/* PAU info might sometime need this for iOS native app; and everywhere the screen is a modal */}
      {/* <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} /> */}
    </View> 
  );
}

const ticketContainerMobileShadow = {
  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 1,
  },
  shadowOpacity: 0.12,
  shadowRadius: 5
};

const buttonMobileShadow = {
  shadowColor: "#000",
  shadowOffset: {
    width: 1,
    height: 2,
  },
  shadowOpacity: 0.2,
  shadowRadius: 5
};

const styles = (theme: string) => StyleSheet.create({
  container: {
    borderTopLeftRadius: 75,
    borderTopRightRadius: 75,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 25,
    paddingTop: 15,
    paddingBottom: 10
  },
  expanderNotch: {
    position: 'absolute',
    top: 10,
    width: 60,
    height: 5,
    borderRadius: 10,
    backgroundColor: 'lightgray',
  },
  ticketContainer: {
    flex: 1,
    flexDirection: 'column',
    width: '100%',
    borderRadius: 50,
    ...Platform.select({
      web: {
        boxShadow: '0px 1px 5px rgba(0, 0, 0, 0.12)'
      },
      ios: {...ticketContainerMobileShadow},
      android: {...ticketContainerMobileShadow, elevation: 7}
    })
  },
  ticketInfoContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginTop: 25
  },
  ticketInfoTextsContainer: {
    flex: 1.2,
    alignItems: 'center',
    gap: 5
  },
  plusAddonTicketContainer: {
    flex: 1,
    alignItems: 'center',
    gap: 8
  },
  addonTicketContainer: {
    marginHorizontal: 30,
    borderRadius: 16,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors[theme].backgroundHalfOpacity
  },
  addonTicketIconWrapper: {
    paddingVertical: 20,
    paddingHorizontal: 23,
    borderWidth: 2,
    borderRadius: 16,
    margin: -2
  },
  addonTicketNameWrapper: {
    flex: 1,
    paddingHorizontal: 5
  },
  addonTicketName: {
    fontSize: 19,
    textAlign: 'center',
    fontWeight: '400',
    overflow: 'hidden'
  },
  addonTicketSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginHorizontal: 14
  },
  formSubmitContainer: {
    flex: 1,
    gap: 10
  },
  formSubmitContent: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    columnGap: 5,
    rowGap: 6,
    marginHorizontal: 15,
    paddingVertical: 13,
    paddingHorizontal: 5,
    borderRadius: 16,
    borderWidth: 2,
    backgroundColor: Colors[theme].backgroundHalfOpacity
  },
  formSubmitQuestion: {
    fontSize: 14
  },
  formSubmitAnswer: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  additionalInfoContainer: {
    marginBottom: 10
  },
  additionalInfoCollapsableContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    opacity: .8
  },
  additionalInfoContent: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 5,
    rowGap: 3,
    marginHorizontal: 15,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: Colors[theme].backgroundHalfOpacity
  },
  additionalInfoTitle: {
    fontSize: 14,
    fontWeight: 'bold'
  },
  additionalInfoText: {
    fontSize: 14,
    marginLeft: 3
  },
  ticketDecorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%'
  },
  ticketLeftCutout: {
    height: 40,
    width: 53,
    marginLeft: -20,
    borderTopRightRadius: 50,
    borderBottomRightRadius: 50,
    backgroundColor: Colors[theme].background,
    ...Platform.select({
      web: {
        boxShadow: 'inset -8px 0 15px -10px rgba(0, 0, 0, 0.12)'
      },
      ios: {},
      android: {}
    })
  },
  ticketDivider: {
    height: 2,
    width: '68%',
    backgroundColor: Colors[theme].background
  },
  ticketRightCutout: {
    height: 40,
    width: 53,
    marginRight: -20,
    borderTopLeftRadius: 50,
    borderBottomLeftRadius: 50,
    backgroundColor: Colors[theme].background,
    ...Platform.select({
      web: {
        boxShadow: 'inset 8px 0 15px -10px rgba(0, 0, 0, 0.12)'
      },
      ios: {},
      android: {}
    })
  },
  ticketName: {
    fontSize: 45,
    fontWeight: '900',
    lineHeight: 48,
    textAlign: 'center',
    marginHorizontal: 15
  },
  eventName: {
    fontSize: 20,
    textAlign: 'center'
  },
  topContainer: {
    flex: 1,
    gap: 100,
    width: '100%'
  },
  ticketStatusContainer: {
    alignItems: 'center',
    gap: 10,
    borderRadius: 40,
    marginTop: 10,
    marginBottom: 20,
    marginHorizontal: 20
  },
  pulseContainer: {
    position: 'absolute',
    left: 0,
    top: 0
  },
  pulseDot: {
    marginTop: 4,
    marginLeft: 30,
    borderRadius: 45,
    width: 25,
    height: 25
  },
  statusText: {
    fontSize: 30,
    fontWeight: 'bold'
  },
  statusInfoText: {
    fontSize: 15,
    textAlign: 'center',
    marginHorizontal: 7
  },
  statusInfoTextTime: {
    fontWeight: 'bold',
    fontSize: 18,
    lineHeight: 17.5,
    textAlign: 'center',
    marginHorizontal: 7
  },
  infoContainer: {
    alignItems: 'center'
  },
  actionsConfirmContainer: {
    marginTop: 8,
    width: '100%',
    flexDirection: 'column',
    gap: 5
  },
  actionsConfirmButtonsContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  confirmPrompt: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  actionsButtonsContainer: {
    marginTop: 13,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  button: {
    height: 60,
    verticalAlign: 'bottom',
    borderRadius: 20,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 4,
    ...Platform.select({
      web: {
        boxShadow: '1px 2px 5px rgba(0, 0, 0, 0.2)'
      },
      ios: {...buttonMobileShadow},
      android: {...buttonMobileShadow, elevation: 5}
    })
  },
  buttonConfirm: {
    height: 42,
    borderRadius: 13,
    borderWidth: 2
  },
  buttonLoading: {
    paddingVertical: 19
  },
  buttonText: {
    fontSize: 20,
    fontWeight: 'bold'
  }
});
