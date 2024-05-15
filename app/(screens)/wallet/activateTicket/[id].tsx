import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Colors from '../../../../constants/Colors';
import { Text, View } from '../../../../components/Themed';
import { FeatherIcon } from '../../../../components/CustomIcons';
import { supabase } from "../../../../supabase";
import { useSupabase } from '../../../../context/SupabaseProvider';
import { getThemeRandomColor } from '../../../../utils/chooseRandomColor';

export default function ActivateTicketScreen() {
  const { i18n, user, theme } = useSupabase();
  const [loading, setLoading] = useState<boolean>(false);
  const [ticketActive, setTicketActive] = useState<boolean>(undefined);
  const [lightEventBackgroundColor, setLightEventBackgroundColor] = useState<string>();
  const [darkEventBackgroundColor, setDarkEventBackgroundColor] = useState<string>();
  const [eventBackgroundColor, setEventBackgroundColor] = useState<string>();
  const [eventName, setEventName] = useState<string>('');
  const [ticketName, setTicketName] = useState<string>('');
  const [ticketUsedAt, setTicketUsedAt] = useState<string>(null);
  const [ticketUsedTimeAgo, setTicketUsedTimeAgo] = useState<string>();

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
      setTicketActive(!wallet_ticket.used);
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
    });
  };

  const deactivateTicket = async () => {
    if (loading) {
      return;
    }

    if (Platform.OS === 'web') {
      if (!window.confirm(i18n?.t('deactivateTicketConfirmationQuestion'))) {
        return;
      }
    } else {
      const AsyncAlert = async () => new Promise<boolean>((resolve) => {
        Alert.prompt(
          i18n?.t('deactivateTicket'),
          i18n?.t('deactivateTicketConfirmationQuestion'),
          [
            {
              text: "No",
              onPress: () => {
                resolve(true);
              },
              style: "cancel"
            },
            {
              text: i18n?.t('yesDeactivate'),
              onPress: () => {
                resolve(false);
              }
            }
          ],
          "default"
        );
      });
      if (await AsyncAlert()) {
        return;
      };
    }

    setLoading(true);
    supabase.from('wallet_tickets').update({ used: true, used_at: new Date().toISOString() }).eq('id', id).select().single()
    .then(({ data: wallet_ticket, error }) => {
      if (error || !wallet_ticket) return;
      setTicketActive(!wallet_ticket.used);
      setTicketUsedAt(wallet_ticket.used_at);
      setLoading(false);
    });
  };
  
  return (
    <View style={styles.container}>
      { Platform.OS !== 'web' ? <View style={styles.expanderNotch}></View> : <></> }
      { !eventBackgroundColor || !eventName || !ticketName ? <>
        <ActivityIndicator size="large" />
      </> : <>
        <View style={[styles.ticketContainer, {backgroundColor: eventBackgroundColor}]}>
          <View style={styles.ticketInfoContainer}>
            <Text style={styles.title}>{ ticketName }</Text>
            <Text style={styles.subtitle}>{ eventName }</Text>
          </View>
          <View style={styles.ticketDecorContainer}>
            <View style={[styles.ticketLeftCutout, {backgroundColor: Colors[theme].background}]}></View>
            <View style={[styles.ticketDivider, {backgroundColor: Colors[theme].background}]}></View>
            <View style={[styles.ticketRightCutout, {backgroundColor: Colors[theme].background}]}></View>
          </View>
          <View style={[styles.ticketStatusContainer, {backgroundColor: ticketActive === undefined ? 'transparent' : ticketActive ? '#3fde7a' : '#ff3737', paddingVertical: (ticketActive !== undefined && ticketActive) || !ticketUsedTimeAgo ? 30 : 21.25}]}>
            { ticketActive === undefined ? <>
              <Text style={[styles.statusText, {color: Colors['light'].text}]}>{ i18n?.t('loading') } ticket...</Text>
              <Text style={styles.statusInfoText}> </Text>
            </> : <>{ ticketActive ? <>
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
            <Pressable disabled={loading} onPress={() => router.back()} style={[styles.button, loading ? {opacity: .7} : {}, {height: '100%', flex: 1, justifyContent: 'center'}, {backgroundColor: eventBackgroundColor}]}>
              <FeatherIcon name="arrow-left" size={38} color={Colors[theme].text} />
            </Pressable>
          </> : <></> }
          <Pressable disabled={!ticketActive} onPress={deactivateTicket} style={[styles.button, !ticketActive ? {opacity: .7} : {}, {backgroundColor: eventBackgroundColor}]}>
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
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginTop: 25
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
  title: {
    fontSize: 45,
    fontWeight: '900'
  },
  subtitle: {
    fontSize: 20
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
    fontSize: 15
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
