import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet } from 'react-native';
import { Text, View } from '../../components/Themed';
import EventCardComponent from '../../components/EventCardComponent';
import { supabase } from "../../supabase";
import { useSupabase } from '../../context/SupabaseProvider';
import { Event } from '../../types/supabaseplain';
import { useFocusEffect } from 'expo-router';

export default function TabOneScreen() {
  const { user, i18n, storeFollowingEventsCookie, followingEvents } = useSupabase();
  const [events, setEvents] = useState<Event[]>();

  let triggerNextFocus = useRef<boolean>(true);
  useFocusEffect(
    useCallback(() => {
      let unmounted = false;
      if (triggerNextFocus.current) {
        if (!user) return;
        supabase.from('users').select().eq('id', user?.id).single()
        .then(({ data: user, error }) => {
          if (unmounted ||
            error ||
            !user ||
            user.event_ids_following.length === followingEvents.length &&
            user.event_ids_following.every(id => followingEvents.includes(id)) &&
            followingEvents.every(id => user.event_ids_following.includes(id))
          ) return;
          storeFollowingEventsCookie(user.event_ids_following ?? [], true);
        });
      }

      return () => {
        unmounted = true;
        triggerNextFocus.current = false;
        setTimeout(() => {
          triggerNextFocus.current = true;
        }, 3500); //This is to prevent fetching every time we focus, just fetching when focused and after every 3.5 seconds
      };
    }, [user])
  );

  useEffect(() => {
    if (!followingEvents.length) return;
    let unmounted = false;
    supabase.from('events').select().in('id', followingEvents)
    .then(({ data: events, error }) => {
      if (unmounted || error) return;
      setEvents(events);
    });

    return () => {
      unmounted = true;
    };
  }, [followingEvents]);

  const renderItem = useCallback(({item}: {item: Event}) => (
    <EventCardComponent {...item} />
  ), []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{ i18n?.t('events') }</Text>
          <Text style={styles.infoLabel}>{ i18n?.t('addEventByQrExplanation') }</Text>
        </View>
      </View>
      <View style={styles.eventsContainer}>
        { followingEvents?.length ? <>
          { !events ?
            <ActivityIndicator style={{marginTop: '25%'}} size="large" />
            :
            <FlatList
              data={events}
              renderItem={renderItem}
              ItemSeparatorComponent={() => <View style={{height: 10}} />}
            />
          }
        </> : 
          <Text style={styles.emptyList}>{ i18n?.t('noEventsInList') }</Text>
        }
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 10,
    paddingBottom: 95,
    paddingHorizontal: 15,
    flex: 1,
    overflow: 'scroll'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginRight: 10
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold'
  },
  infoLabel: {
    fontSize: 13,
    marginLeft: 2,
    color: '#8C90A3'
  },
  eventsContainer: {
    marginTop: 25
  },
  emptyList: {
    textAlign: 'center',
    color: 'grey',
    marginTop: 50,
    fontStyle: 'italic'
  }
});
