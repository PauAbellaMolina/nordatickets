import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, Platform, Pressable, StyleSheet, useColorScheme } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { collection, doc, setDoc } from 'firebase/firestore';
import { FIRESTORE_DB } from '../../../../firebaseConfig';
import { useAuth } from '../../../../context/AuthProvider';
import { useWallet } from '../../../../context/WalletProvider';
import Colors from '../../../../constants/Colors';
import { Text, View } from '../../../../components/Themed';
import { FeatherIcon } from '../../../../components/CustomIcons';

export default function ActivateTicketScreen() {
  const theme = useColorScheme() ?? 'light';
  const { user } = useAuth();
  const { walletTicketGroups, setWalletTicketGroups } = useWallet();
  const [loading, setLoading] = useState<boolean>(false);
  const [ticketActive, setTicketActive] = useState<boolean>(true);
  const [eventBackgroundColor, setEventBackgroundColor] = useState<string>(Colors[theme].backgroundContrast);

  const { activateTicketParams } = useLocalSearchParams();
  const eventId = activateTicketParams[0];
  const eventName = activateTicketParams[1];
  const ticketUniqueId = activateTicketParams[2];
  const eventTicketId = activateTicketParams[3];
  const ticketName = activateTicketParams[4];
  const ticketPrice = activateTicketParams[5];
  const orderId = activateTicketParams[6];
  const usedTicketBucketId = activateTicketParams[7];

  const chooseRandomColor = (): string => {
    const colors = Colors.eventBackgroundColorsArray[theme]
    const randomIndex = Math.floor(Math.random() * colors.length);
    return colors[randomIndex];
  };

  useEffect(() => {
    setEventBackgroundColor(chooseRandomColor);
  }, []);

  const deactivateTicket = async () => {
    if (!user || loading) {
      return;
    }

    if (Platform.OS === 'web') {
      if (!window.confirm("Segur que vols desactivar aquest ticket?")) {
        return;
      }
    } else {
      const AsyncAlert = async () => new Promise<boolean>((resolve) => {
        Alert.prompt(
          "Desactivar ticket",
          "Segur que vols desactivar aquest ticket?",
          [
            {
              text: "No",
              onPress: () => {
                resolve(true);
              },
              style: "cancel"
            },
            {
              text: "Sí, desactivar",
              onPress: () => {
                resolve(false);
              }
            }
          ],
          "default"
        );
      });
      if (await AsyncAlert()) {
        return;
      };
    }

    setLoading(true);
    const ticketToDeactivate = {
      id: ticketUniqueId,
      eventTicketId: eventTicketId,
      name: ticketName,
      price: +ticketPrice,
      userId: user.id,
      orderId: orderId
    };

    const usedTicketBucketRef = doc(FIRESTORE_DB, 'usedTicketBuckets', usedTicketBucketId);
    const walletTicketsRef = collection(usedTicketBucketRef, 'walletTickets');
    setDoc(doc(walletTicketsRef, ticketUniqueId), ticketToDeactivate)
    .then(() => {
      setTicketActive(false);
      const existingWalletTicketGroup = walletTicketGroups?.find((walletTicketGroup) => walletTicketGroup.eventId === eventId);
      if (existingWalletTicketGroup) {
        existingWalletTicketGroup.walletTickets = existingWalletTicketGroup.walletTickets.filter((ticket) => ticket.id !== ticketToDeactivate.id);
        if (existingWalletTicketGroup.walletTickets.length === 0) {
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
      { Platform.OS !== 'web' ? <View style={styles.expanderNotch}></View> : <></> }
      <View style={[styles.ticketContainer, {backgroundColor: eventBackgroundColor}]}>
        <View style={styles.ticketTopContainer}>
          <Text style={styles.title}>{ ticketName }</Text>
          <Text style={styles.subtitle}>{ eventName }</Text>
        </View>
        <View style={styles.ticketDecorContainer}>
          <View style={styles.ticketLeftCutout}></View>
          <View style={styles.ticketDivider}></View>
          <View style={styles.ticketRightCutout}></View>
        </View>
        <View style={styles.ticketBottomContainer}>
          <View style={[styles.statusContainer, {backgroundColor: ticketActive ? '#3fde7a' : '#ff3737'}]}>
            { ticketActive ?
              <>
                <Text style={[styles.statusText, {color: Colors['light'].text}]}>Ticket actiu</Text>
                <Text style={[styles.statusInfoText, {color: Colors['light'].text}]}>Desactivar ticket al rebre la beguda</Text>
              </>
            :
              <>
                <Text style={[styles.statusText, {color: Colors['light'].text}]}>Ticket desactivat</Text>
                <Text style={[styles.statusInfoText, {color: Colors['light'].text}]}>Aquest ticket ja ha sigut utilitzat</Text>
              </>
            }
          </View>
        </View>
      </View>
      <View style={styles.actionsContainer}>
        { Platform.OS === 'web' ? <>
          <Pressable onPress={() => router.back()} style={[styles.button, {height: '100%', flex: 1, justifyContent: 'center'}, {backgroundColor: eventBackgroundColor}]}>
            <FeatherIcon name="arrow-left" size={38} color={Colors[theme].text} />
          </Pressable>
        </> : <></> }
        <Pressable disabled={!ticketActive} onPress={deactivateTicket} style={[styles.button, !ticketActive ? {opacity: .8} : {}, {backgroundColor: eventBackgroundColor}]}>
          {loading ?
            <ActivityIndicator style={styles.buttonLoading} size="large" />
          :
            <Text style={styles.buttonText}>Desactivar ticket</Text>
          }
        </Pressable>
      </View>

      {/* Use a light status bar on iOS to account for the black space above the modal */}
      {/* TODO PAU try if uncommenting this makes web crash, if not, leave it on */}
      {/* <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} /> */}
    </View> 
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 50,
    borderTopLeftRadius: 75,
    borderTopRightRadius: 75,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 25,
    paddingBottom: 40
  },
  expanderNotch: {
    position: 'absolute',
    top: 10,
    width: 60,
    height: 5,
    borderRadius: 10,
    backgroundColor: 'lightgray',
  },
  ticketContainer: {
    flex: 1,
    flexDirection: 'column',
    width: '100%',
    borderRadius: 50,
    marginBottom: 25,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 10
  },
  ticketTopContainer: {
    backgroundColor: 'transparent',
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%'
  },
  ticketBottomContainer: {
    backgroundColor: 'transparent',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 20,
    // paddingTop: 25
  },
  ticketDecorContainer: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%'
  },
  ticketLeftCutout: {
    height: 40,
    width: 38,
    marginLeft: -5,
    borderTopRightRadius: 50,
    borderBottomRightRadius: 50
  },
  ticketDivider: {
    height: 2,
    width: '68%'
  },
  ticketRightCutout: {
    height: 40,
    width: 38,
    marginRight: -5,
    borderTopLeftRadius: 50,
    borderBottomLeftRadius: 50
  },
  title: {
    fontSize: 45,
    fontWeight: '900'
  },
  subtitle: {
    fontSize: 20
  },
  topContainer: {
    flex: 1,
    gap: 100,
    width: '100%'
  },
  statusContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 30,
    borderRadius: 40,
    transitionDuration: '0.5s',
    transitionProperty: 'backgroundColor'
  },
  statusText: {
    fontSize: 30,
    fontWeight: 'bold'
  },
  statusInfoText: {
    fontSize: 15
  },
  infoContainer: {
    alignItems: 'center'
  },
  actionsContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  button: {
    verticalAlign: 'bottom',
    borderRadius: 30,
    borderWidth: 5,
    borderColor: '#0000001A',
    alignItems: 'center',
    flex: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 1,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2.5,
    elevation: 10
  },
  buttonLoading: {
    paddingVertical: 18
  },
  buttonText: {
    fontSize: 20,
    fontWeight: 'bold',
    paddingVertical: 23
  }
});
