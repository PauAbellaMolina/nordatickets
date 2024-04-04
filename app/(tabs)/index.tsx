import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet } from 'react-native';
import { Text, View } from '../../components/Themed';
import EventCardComponent from '../../components/EventCardComponent';
import { supabase } from "../../supabase";
import { useSupabase } from '../../context/SupabaseProvider';
import { Event } from '../../types/supabaseplain';

export default function TabOneScreen() {
  const { user, i18n } = useSupabase();
  const [events, setEvents] = useState<Event[]>();
  const [userEventIdsFollowing, setUserEventIdsFollowing] = useState<number[]>([]);

  useEffect(() => { //TODO PAU i think this is getting triggered (and so makes 2 unnecessary supabase calls) when f5 but not at tab 1 screen (check it out when on receipts screen for example). It may be because of the default screen is tab 1 and so it gets rendered for a moment.
    if (!user) return;
    supabase.from('users').select().eq('id', user?.id)
    .then(({ data: users, error }) => {
      if (error || !users.length || !users[0].event_ids_following?.length) return;
      const userEventIdsFollowing = users[0].event_ids_following;
      setUserEventIdsFollowing(userEventIdsFollowing);
      supabase.from('events').select().in('id', userEventIdsFollowing)
      .then(({ data: events, error }) => {
        if (error) return;
        setEvents(events);
      });
    });
  }, [user]);

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
            renderItem={({ item }) => <EventCardComponent {...item} />}
            ItemSeparatorComponent={() => <View style={{height: 10}} />}
          />
        }
      </> : null }
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 30,
    paddingBottom: 5,
    paddingHorizontal: 15,
    flex: 1,
    gap: 20
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
