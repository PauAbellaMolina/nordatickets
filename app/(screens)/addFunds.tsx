import { StatusBar } from 'expo-status-bar';
import { Button, Platform, StyleSheet } from 'react-native';

import EditScreenInfo from '../../components/EditScreenInfo';
import { Text, View } from '../../components/Themed';
import { useFunds } from '../../context/WalletProvider';
import { useRouter } from 'expo-router';

export default function AddFundsScreen() {
  const { funds, setFunds } = useFunds();
  // const router = useRouter();

  const onAddFunds = () => {
    setFunds(funds ? funds + 1 : 1);
  };
  const onSubstractFunds = () => {
    setFunds(funds ? funds - 1 : 0);
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Funds: { funds }</Text>
      <Button
        title={'Add funds'}
        onPress={onAddFunds}
      />
      <Button
        title={'Substract funds'}
        onPress={onSubstractFunds}
      />

      {/* Use a light status bar on iOS to account for the black space above the modal */}
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </View> 
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});
