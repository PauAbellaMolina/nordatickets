import { Link } from "expo-router";
import { View, Text} from "../../components/Themed";
import { TouchableOpacity } from "react-native-gesture-handler";

import { useAuth } from "../../context/AuthProvider";
import { StyleSheet, TextInput, Button, useColorScheme, ActivityIndicator } from "react-native";
import { useRef, useState } from "react";
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import { FIREBASE_CONFIG, FIREBASE_AUTH, FIRESTORE_DB } from '../../firebaseConfig';
import { PhoneAuthProvider, UserCredential, signInWithCredential } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Colors from "../../constants/Colors";

export default function Login() {
  const theme = useColorScheme() ?? 'light';
  const [waitingForCode, setWaitingForCode] = useState<boolean>(false);
  const [waitingForConfirmation, setWaitingForConfirmation] = useState<boolean>(false);
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [verificationId, setVerificationId] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState<string>('');

  const recaptchaRef = useRef<FirebaseRecaptchaVerifierModal>(null);

  const onSendCode = () => {
    if (recaptchaRef.current) {
      setWaitingForCode(true);
      const phoneProvider = new PhoneAuthProvider(FIREBASE_AUTH);
      phoneProvider
      .verifyPhoneNumber('+34'+phoneNumber, recaptchaRef.current)
      .then(setVerificationId)
      .catch((err): void => {
        console.log('PAU LOG-> err: ', phoneNumber, err);
        alert(err);
      });
    }
  }

  const onConfirmCode = () => {
    setWaitingForConfirmation(true);
    const credential = PhoneAuthProvider.credential(
      verificationId,
      verificationCode
    );
    signInWithCredential(FIREBASE_AUTH, credential)
    .then((result: UserCredential) => {
      console.log('PAU LOG-> result: ', result);
    })
    .catch((err) => {
      console.log('PAU LOG-> err: ', err);
    });
  };

  return (
    <>
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaRef}
        firebaseConfig={FIREBASE_CONFIG}
        attemptInvisibleVerification={true}
      />
      <View style={styles.container}>
        <View style={styles.inputContainer}>
          { !waitingForCode ?
            <>
              <TextInput
                style={[styles.input, {color: Colors[theme].text}]}
                autoComplete="tel"
                keyboardType={'phone-pad'}
                placeholder="Your phone number"
                onChangeText={(text)=> setPhoneNumber(text.replace(/[^0-9]/g, ''))}
              />
              <Button
                disabled={phoneNumber.length !== 9}
                title={'Send code'}
                onPress={onSendCode}
              />
            </>
          :
            <Text style={{fontSize: 30}}>{phoneNumber}</Text>
          }
        </View>
        { waitingForCode ?
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, styles.confirmationCodeInput, {color: Colors[theme].text}]}
              placeholder="SMS Confirmation Code"
              onChangeText={setVerificationCode}
              keyboardType="number-pad"
            />
            { waitingForConfirmation ?
              <ActivityIndicator style={{marginTop: 10}} size="small" />
            :
              <Button
                title={'Confirm code'}
                onPress={onConfirmCode}
              />
            }
          </View>
        :
          <></>
        }
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 50,
    paddingTop: 30,
    paddingHorizontal: 15,
    alignItems: 'center',
    gap: 20,
    // justifyContent: 'center',
  },
  inputContainer: {
    // marginTop: 50,
    alignItems: 'center'
  },
  input: {
    pointerEvents: 'box-only',
    margin: 12,
    borderRadius: 10,
    paddingHorizontal: 10,
    fontSize: 30,
  },
  confirmationCodeInput: {
    fontSize: 20,
  }
});