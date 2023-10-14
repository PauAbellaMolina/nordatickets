import { StatusBar } from 'expo-status-bar';
import { Button, Platform, StyleSheet, TextInput, useColorScheme } from 'react-native';

import EditScreenInfo from '../../../components/EditScreenInfo';
import { Text, View } from '../../../components/Themed';
import { useWallet } from '../../../context/WalletProvider';
import { useRouter } from 'expo-router';
import Colors from '../../../constants/Colors';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { FIRESTORE_DB } from '../../../firebaseConfig';
import { useAuth } from '../../../context/AuthProvider';

export default function AddFundsScreen() {
  const theme = useColorScheme() ?? 'light';
  const { funds, setFunds } = useWallet();
  const { user } = useAuth();
  const [textInput, setTextInput] = useState<string>('');
  const [localFunds, setLocalFunds] = useState<number>(0);

  const onAddFunds = () => {
    // setFunds(funds ? funds + 1 : 1);

    //TODO PAU info: for security and consistency double check current user funds right before adding funds.
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
      }
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
      <Button
        disabled={localFunds === 0}
        title={'Add funds'}
        onPress={onAddFunds}
      />

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
