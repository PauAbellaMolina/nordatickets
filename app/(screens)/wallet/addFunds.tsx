import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, Platform, Pressable, StyleSheet, TextInput, useColorScheme } from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { addDoc, collection, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { FIRESTORE_DB } from '../../../firebaseConfig';
import { useAuth } from '../../../context/AuthProvider';
import { useWallet } from '../../../context/WalletProvider';
import Colors from '../../../constants/Colors';
import { Text, View } from '../../../components/Themed';

export default function AddFundsScreen() {
  const theme = useColorScheme() ?? 'light';
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const { funds, setFunds } = useWallet();
  const { user } = useAuth();
  const [textInput, setTextInput] = useState<string>('');
  const [localFunds, setLocalFunds] = useState<number>(0);
  const [stripePaymentSheetParams, setStripePaymentSheetParams] = useState<{ paymentIntentClientSecret: string, ephemeralKeySecret: string, customer: string }>();
  const [loading, setLoading] = useState(false);
  const [eventBackgroundColor, setEventBackgroundColor] = useState<string>(Colors[theme].backgroundContrast);

  const chooseRandomColor = (): string => {
    const colors = Colors.eventBackgroundColorsArray[theme]
    const randomIndex = Math.floor(Math.random() * colors.length);
    return colors[randomIndex];
  };

  useEffect(() => {
    setEventBackgroundColor(chooseRandomColor);
  }, []);

  useEffect(() => {
    initializePaymentSheet();
  }, [stripePaymentSheetParams]);

  const initializePaymentSheet = async () => {
    if (!stripePaymentSheetParams) {
      return;
    }
    const { error } = await initPaymentSheet({
      merchantDisplayName: "Tickets MVP, Inc.",
      customerId: stripePaymentSheetParams.customer,
      customerEphemeralKeySecret: stripePaymentSheetParams.ephemeralKeySecret,
      paymentIntentClientSecret: stripePaymentSheetParams.paymentIntentClientSecret,
      // Set `allowsDelayedPaymentMethods` to true if your business can handle payment
      //methods that complete payment after a delay, like SEPA Debit and Sofort.
      allowsDelayedPaymentMethods: false,
      // defaultBillingDetails: {
      //   name: 'Jane Doe',
      // }
    });
    if (error) {
      console.log('PAU LOG-> error: ', error);
      Alert.alert("Unexpected error", "Please try again.");
      setLoading(false);
    } else {
      spawnPaymentSheet();
    }
  };

  const spawnPaymentSheet = async () => {
    const { error } = await presentPaymentSheet();
    if (error) {
      // Alert.alert(error.code, error.message);
      setLoading(false);
    } else {
      // Alert.alert('Success', 'Your order is confirmed!');
      if (!user?.id) {
        return;
      }
      const userDocRef = doc(FIRESTORE_DB, 'users', user.id);
      getDoc(userDocRef)
      .then((doc) => {
        if (doc.exists()) {
          const currentFunds = doc.data().walletFunds;
          setFunds(currentFunds ? currentFunds + localFunds : localFunds);
          router.back();
        }
      });
    }
  };

  const onAddFunds = () => {
    if (!user?.id) {
      return;
    }
    setLoading(true);
    const userDocRef = doc(FIRESTORE_DB, 'users', user.id);
    const checkoutSessionsRef = collection(userDocRef, 'checkout_sessions');
    addDoc(checkoutSessionsRef, {
      client: 'mobile',
      mode: 'payment',
      amount: localFunds*100,
      currency: 'eur'
    }).then((docRef) => {
      onSnapshot(docRef, (snapshot) => {
        const data = snapshot.data();
        if (data && data.paymentIntentClientSecret && data.ephemeralKeySecret && data.customer) {
          setStripePaymentSheetParams({
            paymentIntentClientSecret: data.paymentIntentClientSecret,
            ephemeralKeySecret: data.ephemeralKeySecret,
            customer: data.customer
          });
        }
      });
    }).catch((err) => {
      console.log('PAU LOG-> addFunds: ', err);
    });
  };

  const onInputFundsChange = (text: string) => {
    setTextInput(text);
    if (text === '' || text === ',') {
      setLocalFunds(0);
      return;
    }
    
    let slicedString = text;
    const decimalIndex = text.indexOf(',');
    if (decimalIndex !== -1) {
      slicedString = text.slice(0, decimalIndex + 3);
    }
    const number = parseFloat(
      slicedString.replace(/[\d,]+/g, (match) => {
        return match.replace(',', '.');
      })
    );
    setLocalFunds(number);
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add funds</Text>
      <View style={[styles.addFundsContainer, {backgroundColor: Colors[theme].cardContainerBackground}]}>
        <View style={styles.textInputContainer}>
          <TextInput 
            style={[styles.input, {color: Colors[theme].text}]}
            inputMode={textInput.indexOf(',') === -1 ? 'decimal' : 'numeric'}
            onChangeText={onInputFundsChange}
            value={textInput}
            placeholder='0'
          />
          <Text style={{fontSize: 80}}>€</Text>
        </View>
      </View>
      <Pressable disabled={localFunds < 1 || localFunds > 100} style={[styles.buyButton, localFunds < 1 || localFunds > 100 ? {opacity: .5} : {}]} onPress={onAddFunds}>
        <Text style={styles.buyButtonText}>Add {textInput}€ to account</Text>
      </Pressable>
      { loading ?
        <ActivityIndicator style={{marginTop: 10}} size="small" />
      :
        // <Button
        //   disabled={localFunds < 1 || localFunds > 100}
        //   title={'Add funds'}
        //   onPress={onAddFunds}
        // />

        // <>
        //   <Pressable disabled={localFunds < 1 || localFunds > 100} onPress={onAddFunds} style={[styles.button, localFunds < 1 || localFunds > 100 ? {opacity: .5} : {}, {backgroundColor: eventBackgroundColor}]}>
        //     {loading ?
        //       <ActivityIndicator style={styles.buttonLoading} size="large" />
        //     :
        //       <Text style={styles.buttonText}>Add {textInput}€ to account</Text>
        //     }
        //   </Pressable>
        // </>
        
        <></>
      }

      {/* Use a light status bar on iOS to account for the black space above the modal */}
      {/* <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} /> */}
    </View> 
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    paddingTop: 70,
    paddingHorizontal: 15,
    alignItems: 'center',
    // justifyContent: 'center',
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
  },
  // separator: {
  //   marginVertical: 30,
  //   height: 1,
  //   width: '80%',
  // },
  addFundsContainer: {
    // backgroundColor: 'transparent',
    marginTop: 60,
    alignItems: 'center',

    width: '90%',

    paddingTop: 15,
    paddingBottom: 23,
    paddingHorizontal: 20,
    borderRadius: 35,
  },
  textInputContainer: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    backgroundColor: 'transparent',
    pointerEvents: 'box-only',
    margin: 12,
    borderRadius: 10,
    paddingHorizontal: 10,
    fontSize: 80,
  },
  // button: {
  //   verticalAlign: 'bottom',
  //   borderRadius: 30,
  //   borderWidth: 5,
  //   borderColor: '#0000001A',
  //   alignItems: 'center',
  //   width: '70%',
  //   shadowColor: "#000",
  //   shadowOffset: {
  //     width: 1,
  //     height: 2,
  //   },
  //   shadowOpacity: 0.2,
  //   shadowRadius: 2.5,
  //   elevation: 10
  // },
  // buttonLoading: {
  //   paddingVertical: 18
  // },
  // buttonText: {
  //   fontSize: 20,
  //   fontWeight: 'bold',
  //   paddingVertical: 20
  // }

  buyButton: {
    width: '75%',
    marginTop: 10,
    backgroundColor: '#613AC5',
    paddingVertical: 10,
    borderRadius: 10
  },
  buyButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center'
  },
});
