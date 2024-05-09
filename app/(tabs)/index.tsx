import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet } from 'react-native';
import { Text, View } from '../../components/Themed';
import EventCardComponent from '../../components/EventCardComponent';
import { supabase } from "../../supabase";
import { useSupabase } from '../../context/SupabaseProvider';
import { Event } from '../../types/supabaseplain';

export default function TabOneScreen() {
  const { user, i18n, followingEventsChanged } = useSupabase();
  const [events, setEvents] = useState<Event[]>();
  const [userEventIdsFollowing, setUserEventIdsFollowing] = useState<number[]>([]);

  useEffect(() => {
    if (!user) return;
    let unmounted = false;
    supabase.from('users').select().eq('id', user?.id).single()
    .then(({ data: user, error }) => {
      if (unmounted || error || !user) return;
      if (userEventIdsFollowing.length && !user?.event_ids_following?.length) {
        setUserEventIdsFollowing([]);
        setEvents([]);
        return;
      }
      const auxUserEventIdsFollowing = user.event_ids_following;
      setUserEventIdsFollowing(auxUserEventIdsFollowing);
      supabase.from('events').select().in('id', auxUserEventIdsFollowing)
      .then(({ data: events, error }) => {
        if (unmounted || error) return;
        setEvents(events);
      });
    });

    return () => {
      unmounted = true;
    };
  }, [user, followingEventsChanged]);

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
      { userEventIdsFollowing?.length ? <>
        { !events ?
          <ActivityIndicator style={{marginTop: '25%'}} size="large" />
          :
          <FlatList
            style={styles.eventList}
            data={events}
            renderItem={renderItem}
            ItemSeparatorComponent={() => <View style={{height: 10}} />}
          />
        }
      </> : null }
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 10,
    paddingBottom: 5,
    paddingHorizontal: 15,
    flex: 1,
    gap: 25
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
  eventList: {
    gap: 10
  }
});
