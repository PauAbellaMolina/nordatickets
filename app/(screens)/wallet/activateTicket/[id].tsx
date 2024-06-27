import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Colors from '../../../../constants/Colors';
import { Text, View } from '../../../../components/Themed';
import { EntypoIcon, FeatherIcon } from '../../../../components/CustomIcons';
import { supabase } from "../../../../supabase";
import { useSupabase } from '../../../../context/SupabaseProvider';
import { getThemeRandomColor } from '../../../../utils/chooseRandomColor';
import { WalletTicket } from '../../../../types/supabaseplain';

export default function ActivateTicketScreen() {
  const { i18n, user, theme } = useSupabase();
  const [loading, setLoading] = useState<boolean>(false);
  const [lightEventBackgroundColor, setLightEventBackgroundColor] = useState<string>();
  const [darkEventBackgroundColor, setDarkEventBackgroundColor] = useState<string>();
  const [eventBackgroundColor, setEventBackgroundColor] = useState<string>();
  const [eventName, setEventName] = useState<string>('');
  const [ticketName, setTicketName] = useState<string>('');
  const [ticketUsedAt, setTicketUsedAt] = useState<string>(undefined);
  const [ticketUsedTimeAgo, setTicketUsedTimeAgo] = useState<string>();
  const [addonTicket, setAddonTicket] = useState<WalletTicket>(undefined);

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
    setEventBackgroundColor(theme === 'dark' ? darkEventBackgroundColor : lightEventBackgroundColor);
  }, [theme]);

  const calculateTimeAgo = () => {
    const usedAt = new Date(ticketUsedAt);
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
      if (error || !wallet_ticket) return;

      supabase.from('redsys_orders').select().eq('order_id', wallet_ticket.order_id).single()
      .then(({ data: redsys_order, error }) => {
        if (error || !redsys_order) return;
        if (redsys_order.order_status === 'PAYMENT_PENDING') {
          router.navigate('/(tabs)/wallet');
          return;
        }

        if (wallet_ticket.type === 'ADDON' || wallet_ticket.type === 'ADDON_REFUNDABLE') {
          router.navigate('/(tabs)/wallet');
          return;
        }
  
        setTicketName(wallet_ticket.event_tickets_name);
        setTicketUsedAt(wallet_ticket.used_at);
  
        supabase.from('event_tickets').select().eq('id', wallet_ticket.event_tickets_id)
        .then(({ data: event_tickets, error }) => {
          if (unmounted || error || !event_tickets.length) return;
          if ((theme === 'dark' && !event_tickets[0]?.color_code_dark) || (theme === 'light' && !event_tickets[0]?.color_code_light)) {
            setEventBackgroundColor(getThemeRandomColor(theme));
            setDarkEventBackgroundColor(getThemeRandomColor('dark'));
            setLightEventBackgroundColor(getThemeRandomColor('light'));
            return;
          };
  
          setDarkEventBackgroundColor(event_tickets[0]?.color_code_dark ? event_tickets[0].color_code_dark : getThemeRandomColor('dark'));
          setLightEventBackgroundColor(event_tickets[0]?.color_code_light ? event_tickets[0].color_code_light : getThemeRandomColor('light'));
  
          if (theme === 'dark') {
            setEventBackgroundColor(event_tickets[0].color_code_dark);
          } else {
            setEventBackgroundColor(event_tickets[0].color_code_light);
          }
        });
        
        supabase.from('events').select().eq('id', wallet_ticket.event_id).single()
        .then(({ data: event, error }) => {
          if (unmounted || error || !event) return;
          setEventName(event.name);
        });
  
        if (wallet_ticket.used_at === null) {
          supabase.from('wallet_tickets').select().eq('event_id', wallet_ticket.event_id).eq('user_id', user.id).in('type', ['ADDON', 'ADDON_REFUNDABLE']).is('used_at', null)
          .then(async ({ data: addon_wallet_tickets, error }) => {
            if (unmounted || error || !addon_wallet_tickets.length) {
              setAddonTicket(null);
              return;
            };
            for (let i = 0; i < addon_wallet_tickets.length; i++) {
              const { data: addon_redsys_order, error } = await supabase.from('redsys_orders').select().eq('order_id', addon_wallet_tickets[i].order_id).single();
              if (error || !addon_redsys_order) return false;
              if (addon_redsys_order.order_status === 'PAYMENT_SUCCEEDED') {
                setAddonTicket(addon_wallet_tickets[i]);
                break;
              }
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
      });
    });
  };

  const onDeactivateTicket = async () => {
    if (loading) {
      return;
    }

    if (Platform.OS === 'web') {
      if (!window.confirm(i18n?.t('deactivateTicketConfirmationQuestion'))) {
        return;
      }
    } 
    // else { //Uncomment if on mobile and import Alert from react-native
    //   const AsyncAlert = async () => new Promise<boolean>((resolve) => {
    //     Alert.prompt(i18n?.t('deactivateTicket'), i18n?.t('deactivateTicketConfirmationQuestion'),
    //       [{
    //         text: "No",
    //         onPress: () => {
    //           resolve(true);
    //         },
    //         style: "cancel"
    //       },
    //       {
    //         text: i18n?.t('yesDeactivate'),
    //         onPress: () => {
    //           resolve(false);
    //         }
    //       }],
    //       "default");
    //   });
    //   if (await AsyncAlert()) {
    //     return;
    //   };
    // }

    setLoading(true);
    if (addonTicket) {
      supabase.from('wallet_tickets').update({ used_at: new Date().toISOString() }).eq('id', addonTicket.id).select().single()
      .then(({ data: wallet_ticket, error }) => {
        supabase.from('wallet_tickets').update({ used_at: new Date().toISOString() }).eq('id', id).select().single()
        .then(({ data: wallet_ticket, error }) => {
          if (error || !wallet_ticket) return;
          deactivateWalletTicket();
        });
      });
      return;
    }
    deactivateWalletTicket();
  };

  const deactivateWalletTicket = () => {
    supabase.from('wallet_tickets').update({ used_at: new Date().toISOString(), used_with_addon_id: addonTicket ? addonTicket.id : null }).eq('id', id).select().single()
    .then(({ data: wallet_ticket, error }) => {
      if (error || !wallet_ticket) return;
      setTicketUsedAt(wallet_ticket.used_at);
      setLoading(false);
    });
  }
  
  return (
    <View style={styles.container}>
      { Platform.OS !== 'web' ? <View style={styles.expanderNotch}></View> : <></> }
      { !eventBackgroundColor || !eventName || !ticketName || addonTicket === undefined ? <>
        <ActivityIndicator size="large" />
      </> : <>
        <View style={[styles.ticketContainer, {backgroundColor: eventBackgroundColor}]}>
          <View style={styles.ticketInfoContainer}>
            <View style={[styles.ticketInfoTextsContainer, addonTicket ? {justifyContent: 'flex-end'} : {justifyContent: 'center'}]}>
              <Text style={styles.ticketName} numberOfLines={4}>{ ticketName }</Text>
              <Text style={styles.eventName}>{ eventName }</Text>
            </View>
            { addonTicket ?
              <View style={styles.plusAddonTicketContainer}>
                <FeatherIcon name="plus" size={26} color={Colors['light'].text} />
                <View style={[styles.addonTicketContainer, {backgroundColor: Colors[theme].backgroundHalfOpacity}]}>
                  <View style={styles.addonTicketIconWrapper}>
                    <EntypoIcon name="cup" size={30} color={Colors['light'].text} />
                  </View>
                  <View style={styles.addonTicketNameWrapper}>
                    <Text style={[styles.addonTicketName, {color: Colors['light'].text}]} numberOfLines={1}>{addonTicket.event_tickets_name}</Text>
                    <Text style={[styles.addonTicketSubtitle, {color: theme === 'dark' ? 'lightgray' : 'gray'}]}>{ addonTicket.type === 'ADDON_REFUNDABLE' ? i18n?.t('activateTicketRefundableAddonExplanation') : i18n?.t('activateTicketNonRefundableAddonExplanation') }</Text>
                  </View>
                </View>
              </View>
            : null }
          </View>
          <View style={styles.ticketDecorContainer}>
            <View style={[styles.ticketLeftCutout, {backgroundColor: Colors[theme].background}]}></View>
            <View style={[styles.ticketDivider, {backgroundColor: Colors[theme].background}]}></View>
            <View style={[styles.ticketRightCutout, {backgroundColor: Colors[theme].background}]}></View>
          </View>
          <View style={[styles.ticketStatusContainer, {backgroundColor: ticketUsedAt === undefined ? 'transparent' : ticketUsedAt != null ? '#ff3737' : '#3fde7a', paddingVertical: ticketUsedAt === undefined || !ticketUsedTimeAgo ? 30 : 21.25}]}>
            { ticketUsedAt === undefined ? <>
              <Text style={[styles.statusText, {color: Colors['light'].text}]}>{ i18n?.t('loading') } ticket...</Text>
              <Text style={styles.statusInfoText}> </Text>
            </> : <>{ ticketUsedAt === null ? <>
                <Text style={[styles.statusText, {color: Colors['light'].text}]}>{ i18n?.t('ticketActive') }</Text>
                <Text style={[styles.statusInfoText, {color: Colors['light'].text}]}>{ i18n?.t('deactivateTicketOnDrinkExplanation') }</Text>
              </> : <>
                <Text style={[styles.statusText, {color: Colors['light'].text}]}>{ i18n?.t('ticketUnactive') }</Text>
                <View style={{ alignItems: 'center' }}>
                  { !ticketUsedTimeAgo ?
                    <Text style={[styles.statusInfoText, {color: Colors['light'].text}]}>{ i18n?.t('ticketAlreadyUsedExplanation') }</Text>
                  : <>
                    <Text style={[styles.statusInfoText, {color: Colors['light'].text}]}>{ i18n?.t('ticketUsedTimeAgoExplanation') }</Text>
                    <Text style={[styles.statusInfoText, {color: Colors['light'].text, fontWeight: 'bold'}]}>{ ticketUsedTimeAgo }</Text>
                  </>}
                </View>
              </>}</>
            }
          </View>
        </View>
        <View style={styles.actionsContainer}>
          { Platform.OS === 'web' ? <>
            <Pressable disabled={loading} onPress={() => router.navigate('/(tabs)/wallet')} style={[styles.button, loading ? {opacity: .7} : {}, {height: '100%', flex: 1, justifyContent: 'center'}, {backgroundColor: eventBackgroundColor}]}>
              <FeatherIcon name="arrow-left" size={38} color={Colors[theme].text} />
            </Pressable>
          </> : <></> }
          <Pressable disabled={ticketUsedAt === undefined || ticketUsedAt != null} onPress={onDeactivateTicket} style={[styles.button, ticketUsedAt === undefined || ticketUsedAt != null ? {opacity: .7} : {}, {backgroundColor: eventBackgroundColor}]}>
            {loading ?
              <ActivityIndicator style={styles.buttonLoading} size="large" />
            :
              <Text style={styles.buttonText}>{ i18n?.t('deactivateTicket') }</Text>
            }
          </Pressable>
        </View>
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

const styles = StyleSheet.create({
  container: {
    borderTopLeftRadius: 75,
    borderTopRightRadius: 75,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 25,
    paddingBottom: 15
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
    marginBottom: 15,
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
    gap: 8,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginTop: 25
  },
  ticketInfoTextsContainer: {
    flex: 1.2,
    alignItems: 'center'
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
    alignItems: 'center'
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
    width: '68%'
  },
  ticketRightCutout: {
    height: 40,
    width: 53,
    marginRight: -20,
    borderTopLeftRadius: 50,
    borderBottomLeftRadius: 50,
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
  statusText: {
    fontSize: 30,
    fontWeight: 'bold'
  },
  statusInfoText: {
    fontSize: 15,
    textAlign: 'center',
    marginHorizontal: 7
  },
  infoContainer: {
    alignItems: 'center'
  },
  actionsContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  button: {
    verticalAlign: 'bottom',
    borderRadius: 28,
    borderWidth: 5,
    borderColor: '#0000001A',
    alignItems: 'center',
    flex: 3,
    ...Platform.select({
      web: {
        boxShadow: '1px 2px 5px rgba(0, 0, 0, 0.2)'
      },
      ios: {...buttonMobileShadow},
      android: {...buttonMobileShadow, elevation: 5}
    })
  },
  buttonLoading: {
    paddingVertical: 19
  },
  buttonText: {
    fontSize: 20,
    fontWeight: 'bold',
    paddingVertical: 24.5
  }
});
