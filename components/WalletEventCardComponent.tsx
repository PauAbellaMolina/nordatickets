import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet } from 'react-native';
import Colors from '../constants/Colors';
import { Text, View } from './Themed';
import { supabase } from "../supabase";
import { Event, WalletTicket } from '../types/supabaseplain';
import WalletTicketCardComponent from './WalletTicketCardComponent';
import { getThemeRandomColor } from '../utils/chooseRandomColor';
import { useSupabase } from '../context/SupabaseProvider';

export default function WalletEventCardComponent({ eventWalletTickets }: { eventWalletTickets: WalletTicket[] }) {
  const { theme } = useSupabase();
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

  const getItemLayout = (_data: WalletTicket[], index: number) => (
    {length: 56, offset: 56 * index, index}
  );

  const renderItem = useCallback(({item}: {item: WalletTicket}) => (
    <WalletTicketCardComponent walletTicket={item} />
  ), []);
  
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
              getItemLayout={getItemLayout}
              data={eventWalletTickets}
              renderItem={renderItem}
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
    paddingHorizontal: 10,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20
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
  }
});