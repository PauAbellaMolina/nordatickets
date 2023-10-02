import React from 'react';
import { Text, View } from '../../components/Themed';
import { Event } from '../types/Event';

export default function EventCardComponent(event: Event ) {
  return (
    <View style={{ padding: 10, borderRadius: 5, borderWidth: 1, borderColor: '#ccc' }}>
      {/* <Image source={{ uri: event.imageUrl }} style={{ width: 100, height: 100 }} /> */}
      <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{event.name}</Text>
      {/* <Text style={{ fontSize: 14 }}>{event.date}</Text>
      <Text style={{ fontSize: 14 }}>{event.location}</Text> */}
    </View>
  );
}
