import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Alert, Button, Platform, StyleSheet, TextInput, useColorScheme } from 'react-native';

import EditScreenInfo from '../../../components/EditScreenInfo';
import { Text, View } from '../../../components/Themed';
import { useWallet } from '../../../context/WalletProvider';
import { router, useRouter } from 'expo-router';
import Colors from '../../../constants/Colors';
import { useEffect, useState } from 'react';
import { addDoc, collection, doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { FIRESTORE_DB } from '../../../firebaseConfig';
import { useAuth } from '../../../context/AuthProvider';
import { useStripe } from '@stripe/stripe-react-native';

export default function AddFundsScreen() {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const theme = useColorScheme() ?? 'light';
  const { funds, setFunds } = useWallet();
  const { user } = useAuth();
  const [textInput, setTextInput] = useState<string>('');
  const [localFunds, setLocalFunds] = useState<number>(0);
  const [stripePaymentSheetParams, setStripePaymentSheetParams] = useState<{ paymentIntentClientSecret: string, ephemeralKeySecret: string, customer: string }>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log("HEREEE", stripePaymentSheetParams);
    initializePaymentSheet();
  }, [stripePaymentSheetParams]);

  const initializePaymentSheet = async () => {
    console.log("31", stripePaymentSheetParams);
    if (!stripePaymentSheetParams) {
      return;
    }
    console.log("35");
    const { error } = await initPaymentSheet({
      merchantDisplayName: "Tickets MVP, Inc.",
      customerId: stripePaymentSheetParams.customer,
      customerEphemeralKeySecret: stripePaymentSheetParams.ephemeralKeySecret,
      paymentIntentClientSecret: stripePaymentSheetParams.paymentIntentClientSecret,
      // Set `allowsDelayedPaymentMethods` to true if your business can handle payment
      //methods that complete payment after a delay, like SEPA Debit and Sofort.
      allowsDelayedPaymentMethods: false,
      defaultBillingDetails: {
        name: 'Jane Doe',
      }
    });
    if (!error) {
      // setLoading(true);
      console.log("50");
      const { error } = await presentPaymentSheet();

      if (error) {
        Alert.alert(`Error code: ${error.code}`, error.message);
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
            console.log('currentFunds->', currentFunds, 'localFunds->', localFunds);
            setFunds(currentFunds ? currentFunds + localFunds : localFunds);
            router.back();
          }
        });
      }
    } else {
      console.log('PAU LOG-> error: ', error);
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
          console.log("AAA", data);
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
      <View style={styles.addFundsContainer}>
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
      { loading ?
        <ActivityIndicator style={{marginTop: 10}} size="small" />
      :
        <Button
          disabled={localFunds === 0}
          title={'Add funds'}
          onPress={onAddFunds}
        />
      }

      {/* Use a light status bar on iOS to account for the black space above the modal */}
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </View> 
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 30,
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
    marginTop: 50,
    alignItems: 'center'
  },
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    pointerEvents: 'box-only',
    margin: 12,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    fontSize: 80,
  },
});
