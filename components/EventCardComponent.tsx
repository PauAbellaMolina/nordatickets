import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Event } from '../types/supabaseplain';
import Colors from '../constants/Colors';
import { Text, View } from './Themed';
import { FeatherIcon } from './CustomIcons';
import { useSupabase } from '../context/SupabaseProvider';
import { getThemeRandomColor } from '../utils/chooseRandomColor';

export default function EventCardComponent(event: Event) {
  const { i18n, theme } = useSupabase();
  const [eventBackgroundColor, setEventBackgroundColor] = useState<string>(Colors[theme].backgroundContrast);

  const goToEventDetail = () => {
    router.navigate(`/event/${event.id}`);
  }

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
  }, [theme]);
  
  return (
    <Pressable onPress={goToEventDetail}>
      <View style={[styles.eventCard, {backgroundColor: eventBackgroundColor}]}>
        <View style={styles.eventInfoContainer}>
          <Text style={[styles.eventTitle, {color: Colors['light'].text}]}>{event.name}</Text>
          <Text ellipsizeMode='tail' numberOfLines={6} style={[styles.eventDescription, {color: Colors['light'].text}]}>{event.description}</Text>
        </View>
        <View style={styles.sellingStatusContainer}>
          <View style={[styles.sellingStatusDot, {backgroundColor: event.selling ? 'green' : 'red'}]}></View>
          <Text style={[styles.sellingStatus, {color: event.selling ? 'green' : 'red'}]}>{ i18n?.t(event.selling ? 'selling': 'notSelling') }</Text>
        </View>
        <View style={styles.goToDetailContainer}>
          <FeatherIcon name="arrow-up-right" size={40} color={Colors['light'].text} />
        </View>
      </View>
    </Pressable>
  );
}

const eventCardMobileShadow = {
  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 1
  },
  shadowOpacity: 0.10,
  shadowRadius: 1.5
};

const styles = StyleSheet.create({
  eventCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingTop: 15,
    paddingBottom: 25,
    paddingRight: 15,
    paddingLeft: 20,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    ...Platform.select({
      web: {
        boxShadow: '0px 1px 1.5px rgba(0, 0, 0, 0.10)'
      },
      ios: {...eventCardMobileShadow},
      android: {...eventCardMobileShadow, elevation: 3}
    })
  },
  eventInfoContainer: {
    width: '84%',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    gap: 10
  },
  eventTitle: {
    width: '85%',
    fontSize: 20,
    fontWeight: '500'
  },
  eventDescription: {
    marginLeft: 5,
    fontSize: 13
  },
  sellingStatusContainer: {
    position: 'absolute',
    right: 18,
    top: 13,
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
  goToDetailContainer: {
    position: 'absolute',
    right: 15,
    bottom: 10
  }
});