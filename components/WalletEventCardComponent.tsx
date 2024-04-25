import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, useColorScheme } from 'react-native';
import Colors from '../constants/Colors';
import { Text, View } from './Themed';
import { supabase } from "../supabase";
import { Event, WalletTicket } from '../types/supabaseplain';
import WalletTicketCardComponent from './WalletTicketCardComponent';
import { getThemeRandomColor } from '../utils/chooseRandomColor';

export default function WalletEventCardComponent({ eventWalletTickets }: { eventWalletTickets: WalletTicket[] }) {
  const theme = useColorScheme() ?? 'light';
  const [event, setEvent] = useState<Event>();
  const [eventBackgroundColor, setEventBackgroundColor] = useState<string>();

  useEffect(() => {
    let unmounted = false;
    fetchEvent(unmounted);
    
    return () => {
      unmounted = true;
    };
  }, [eventWalletTickets]);

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

  const fetchEvent = (unmounted: boolean) => {
    if (!eventWalletTickets.length) return;
    supabase.from('events').select().eq('id', eventWalletTickets[0].event_id).single()
    .then(({ data: event, error }) => {
      if (unmounted || error || !event) return;
      setEvent(event);
    });
  };
  
  return (
    <>
      <View style={[styles.eventContainer, {backgroundColor: eventBackgroundColor ?? Colors[theme].backgroundContrast}]}>
        { event ? <>
            <View style={styles.eventHeaderContainer}>
              <Text style={[styles.eventName, {color: Colors['light'].text}]}>{event.name}</Text>
            </View>
            <FlatList
              columnWrapperStyle={{flexWrap: 'wrap', gap: 10}}
              numColumns={2}
              style={styles.ticketsList}
              data={eventWalletTickets}
              renderItem={({ item }) => <WalletTicketCardComponent walletTicket={item} />}
            />
        </> :
          <ActivityIndicator style={{marginVertical: '15%'}} size="large" />
        }
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  eventContainer: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10
  },
  eventHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  eventName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5
  },
  ticketsList: {
    marginTop: 10
  }
});