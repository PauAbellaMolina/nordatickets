import { Button, StyleSheet, TouchableOpacity } from 'react-native';

import EditScreenInfo from '../../components/EditScreenInfo';
import { Text, View } from '../../components/Themed';
import { useFunds } from '../../context/WalletProvider';

export default function TabTwoScreen() {
  
  const { funds, setFunds } = useFunds();

  // const onAddFunds = () => {
  //   setFunds(funds ? funds + 1 : 1);
  // };
  // const onSubstractFunds = () => {
  //   setFunds(funds ? funds - 1 : 0);
  // };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tab Two</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      <Text style={styles.title}>Funds: { funds }</Text>
      {/* <Button
        title={'Add funds'}
        onPress={onAddFunds}
      />
      <Button
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
