import React from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import { Text, View } from '../../components/Themed';
import { Event } from '../types/Event';
import Colors from '../../constants/Colors';

export default function EventCardComponent(event: Event ) {
  const theme = useColorScheme() ?? 'light';
  
  return (
    <View style={[styles.eventCard, {backgroundColor: Colors[theme].backgroundContrast}]}>
      <View style={styles.roundedSquare} />
      <View style={styles.eventInfo}>
        <Text style={styles.eventTitle}>{event.name}</Text>
        <Text ellipsizeMode='tail' numberOfLines={2} style={styles.eventDescription}>{event.description || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  eventCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    // alignItems: 'center',
  },
  roundedSquare: {
    backgroundColor: '#ff7f50',
    borderRadius: 10,
    width: 90,
    height: 90,
  },
  eventInfo: {
    width: '70%',
    marginTop: 5,
    marginHorizontal: 10,
    backgroundColor: 'transparent'
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  eventDescription: {
    marginTop: 5,
  },
});