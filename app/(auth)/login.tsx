import { Link } from "expo-router";
import { View, Text} from "../../components/Themed";
import { TouchableOpacity } from "react-native-gesture-handler";

import { useAuth } from "../../context/AuthProvider";
import { StyleSheet, TextInput, Button } from "react-native";
import { useRef, useState } from "react";
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import { FIREBASE_CONFIG, FIREBASE_AUTH } from '../../firebaseConfig';
import { PhoneAuthProvider, UserCredential, signInWithCredential } from "firebase/auth";

export default function Login() {
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [verificationId, setVerificationId] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState<string>('');

  const { setUser } = useAuth();
  const recaptchaRef = useRef<FirebaseRecaptchaVerifierModal>(null);

  const onSendCode = () => {
    if (recaptchaRef.current) {
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
    const credential = PhoneAuthProvider.credential(
      verificationId,
      verificationCode
    );
    signInWithCredential(FIREBASE_AUTH, credential)
    .then((result: UserCredential) => {
      console.log('PAU LOG-> result: ', result);
      // setUser({ phoneNumber: result.user.providerData[0].phoneNumber ?? '' });
    });
  };

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      {/* <TouchableOpacity onPress={login}>
        <Text
          lightColor="rgba(0,0,0,0.8)"
          darkColor="rgba(255,255,255,0.8)"
        >
          Login
        </Text>
      </TouchableOpacity> */}
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaRef}
        firebaseConfig={FIREBASE_CONFIG}
        attemptInvisibleVerification={true}
      />
      <TextInput
        style={styles.input}
        autoComplete="tel"
        keyboardType={'phone-pad'}
        placeholder="Your phone number"
        onChangeText={(text)=> setPhoneNumber(text.replace(/[^0-9]/g, ''))}
      />
      <Button
        title={'Send code'}
        onPress={onSendCode}
      />

      <TextInput
        placeholder="Confirmation Code"
        onChangeText={setVerificationCode}
        keyboardType="number-pad"
        style={styles.input}
      />
      <Button
        title={'Confirm code'}
        onPress={onConfirmCode}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    width: 200,
    height: 44,
    padding: 10,
    borderWidth: 1,
    borderColor: 'white',
    color: 'white',
    marginBottom: 10,
  },
});