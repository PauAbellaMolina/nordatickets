import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, useColorScheme } from 'react-native';
import { router } from 'expo-router';
import { Event } from '../types';
import Colors from '../../constants/Colors';
import { Text, View } from '../../components/Themed';
import { FeatherIcon } from './icons';

export default function EventCardComponent(event: Event ) {
  const theme = useColorScheme() ?? 'light';
  const [eventBackgroundColor, setEventBackgroundColor] = useState<string>(Colors[theme].backgroundContrast);

  const goToEventDetail = () => {
    router.push(`/event/${event.id}`);
  }

  const chooseRandomColor = (): string => {
    const colors = Colors.eventBackgroundColorsArray[theme]
    const randomIndex = Math.floor(Math.random() * colors.length);
    return colors[randomIndex];
  };

  useEffect(() => {
    setEventBackgroundColor(chooseRandomColor);
  }, []);
  
  return (
    <Pressable onPress={goToEventDetail}>
      <View style={[styles.eventCard, {backgroundColor: eventBackgroundColor}]}>
        {/* <View style={styles.roundedSquare} /> */}
        <View style={styles.eventInfoContainer}>
          <Text style={[styles.eventTitle, {color: Colors['light'].text}]}>{event.name}</Text>
          <Text ellipsizeMode='tail' numberOfLines={6} style={[styles.eventDescription, {color: Colors['light'].text}]}>{event.description || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt'}</Text>
        </View>
        <View style={styles.sellingStatusContainer}>
          <View style={[styles.sellingStatusDot, {backgroundColor: event.selling ? 'green' : 'red'}]}></View>
          <Text style={[styles.sellingStatus, {color: event.selling ? 'green' : 'red'}]}>{event.selling ? 'Venent' : 'No venent'}</Text>
        </View>
        <View style={styles.goToDetailContainer}>
          <FeatherIcon name="arrow-up-right" size={40} color={Colors['light'].text} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  eventCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingTop: 15,
    paddingBottom: 25,
    paddingHorizontal: 15,
    borderRadius: 35,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.10,
    shadowRadius: 1.5,
    elevation: 10
  },
  roundedSquare: {
    backgroundColor: '#ff7f50',
    borderRadius: 10,
    width: 90,
    height: 90
  },
  eventInfoContainer: {
    width: '84%',
    marginHorizontal: 10,
    backgroundColor: 'transparent',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    gap: 8
  },
  eventTitle: {
    width: '85%',
    fontSize: 20,
    fontWeight: '500'
  },
  eventDescription: {
    marginTop: 5,
    fontSize: 13,
  },
  sellingStatusContainer: {
    backgroundColor: 'transparent',
    position: 'absolute',
    right: 15,
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
  goToDetailContainer: {
    backgroundColor: 'transparent',
    position: 'absolute',
    right: 15,
    bottom: 10
  }
});