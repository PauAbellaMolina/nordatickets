import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, useColorScheme } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { arrayUnion, doc, updateDoc } from 'firebase/firestore';
import { FIRESTORE_DB } from '../../../../firebaseConfig';
import { useAuth } from '../../../../context/AuthProvider';
import { useWallet } from '../../../../context/WalletProvider';
import Colors from '../../../../constants/Colors';
import { Text, View } from '../../../../components/Themed';

export default function ActivateTicketScreen() {
  const theme = useColorScheme() ?? 'light';
  const { user } = useAuth();
  const { walletTicketGroups, setWalletTicketGroups } = useWallet();
  const [loading, setLoading] = useState<boolean>(false);
  const [ticketActive, setTicketActive] = useState<boolean>(true);

  const { activateTicketParams } = useLocalSearchParams();
  const eventId = activateTicketParams[0];
  const eventName = activateTicketParams[1];
  const ticketUniqueId = activateTicketParams[2];
  const ticketId = activateTicketParams[3];
  const ticketName = activateTicketParams[4];
  const ticketPrice = activateTicketParams[5];
  const usedTicketBucketId = activateTicketParams[6];

  const deactivateTicket = () => {
    if (!user || loading) {
      return;
    }
    setLoading(true);
    const ticketToActivate = {
      id: ticketUniqueId,
      ticketId: ticketId,
      name: ticketName,
      price: ticketPrice,
      userId: user.id,
    };

    const usedTicketBucketRef = doc(FIRESTORE_DB, 'usedTicketBuckets', usedTicketBucketId);
    updateDoc(usedTicketBucketRef, {
      tickets: arrayUnion(ticketToActivate)
    }).then(() => {
      setTicketActive(false);
      const existingWalletTicketGroup = walletTicketGroups?.find((walletTicketGroup) => walletTicketGroup.eventId === eventId);
      if (existingWalletTicketGroup) {
        existingWalletTicketGroup.tickets = existingWalletTicketGroup.tickets.filter((ticket) => ticket.id !== ticketToActivate.id);
        if (existingWalletTicketGroup.tickets.length === 0) {
          setWalletTicketGroups([]);
        } else {
          setWalletTicketGroups([...walletTicketGroups ?? []]);
        }
      }
    })
    .finally(() => {
      setLoading(false);
    });
  };
  
  return (
    <View style={styles.container}>
      {/* <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" /> */}
      <View style={styles.topContainer}>
        <View style={[styles.statusContainer, {backgroundColor: ticketActive ? 'green' : 'red'}]}>
          { ticketActive ?
            <>
              <Text style={styles.statusText}>Ticket is active</Text>
              <Text style={styles.statusInfoText}>Deactivate when drink is served</Text>
            </>
          :
            <>
              <Text style={styles.statusText}>Ticket not active</Text>
              <Text style={styles.statusInfoText}>This ticket has already been used</Text>
            </>
          }
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.subtitle}>{ eventName }</Text>
          <Text style={styles.title}>{ ticketName }</Text>
        </View>
      </View>
      { ticketActive ?
        <Pressable onPress={deactivateTicket} style={[styles.button, {backgroundColor: Colors[theme].backgroundContrast}]}>
          {loading ?
            <ActivityIndicator style={styles.buttonLoading} size="large" />
          :
            <Text style={styles.buttonText}>Deactivate ticket</Text>
          }
        </Pressable>
      :
        <></>
      }

      {/* Use a light status bar on iOS to account for the black space above the modal */}
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </View> 
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  title: {
    fontSize: 45,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 20,
  },
  topContainer: {
    flex: 1,
    gap: 100,
    width: '100%',
  },
  statusContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 30,
    borderRadius: 10,
    transitionDuration: '0.5s',
    transitionProperty: 'backgroundColor',
  },
  statusText: {
    fontSize: 30,
    fontWeight: 'bold',
  },
  statusInfoText: {
    fontSize: 15,
  },
  infoContainer: {
    alignItems: 'center'
  },
  button: {
    verticalAlign: 'bottom',
    marginBottom: 50,
    borderRadius: 10,
    alignItems: 'center',
    width: '85%',
  },
  buttonLoading: {
    paddingVertical: 20,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: 'bold',
    paddingVertical: 25,
  }
  // separator: {
  //   marginVertical: 30,
  //   height: 1,
  //   width: '80%',
  // },
});
