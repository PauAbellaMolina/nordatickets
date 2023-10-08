import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet } from 'react-native';

import EditScreenInfo from '../../../../components/EditScreenInfo';
import { Text, View } from '../../../../components/Themed';
import { useLocalSearchParams } from 'expo-router';

export default function ActivateTicketScreen() {
  const { activateTicketParams } = useLocalSearchParams();
  const eventName = activateTicketParams[0];
  const ticketId = activateTicketParams[1];
  const ticketName = activateTicketParams[2];
  
  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>{ eventName }</Text>
      <Text style={styles.title}>{ ticketName }</Text>
      {/* <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" /> */}
      {/* <EditScreenInfo path="app/modal.tsx" /> */}

      {/* Use a light status bar on iOS to account for the black space above the modal */}
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </View> 
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    paddingHorizontal: 15,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 45,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 20,
    // fontWeight: 'bold',
  },
  // separator: {
  //   marginVertical: 30,
  //   height: 1,
  //   width: '80%',
  // },
});
