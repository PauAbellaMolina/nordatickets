import { Button, StyleSheet } from 'react-native';

import EditScreenInfo from '../../components/EditScreenInfo';
import { Text, View } from '../../components/Themed';
import { useAuth } from '../../context/AuthProvider';
import { useFunds } from '../../context/WalletProvider';
import { useState } from 'react';
import { Link, router } from 'expo-router';

export default function TabOneScreen() {
  const { user } = useAuth();
  const { funds, setFunds } = useFunds();

  // const onAddFunds = () => {
  //   setFunds(funds ? funds + 1 : 1);
  // };
  // const onSubstractFunds = () => {
  //   setFunds(funds ? funds - 1 : 0);
  // };

  // const onGoToAddFunds = () => {
  //   router.push('/wallet/modal');
  // };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tab One</Text>
      <Text style={styles.title}>Hello, { user?.phoneNumber }</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      <Text style={styles.title}>{ funds === 0 ? 'Wallet empty, add funds' : 'Your funds: '+funds }</Text>
      <Link href="/addFunds"><Text>Add funds</Text></Link>
      <Text>---</Text>
      <Link href="/modal"><Text>Modal</Text></Link>
      {/* <Link href="/wallet/modal" asChild>
        <Button
          title={'Add funds'}
          // onPress={onGoToAddFunds}
        />
      </Link> */}
      {/* <Button
        title={'Substract funds'}
        onPress={onSubstractFunds}
      /> */}
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
