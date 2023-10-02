import { Button, FlatList, StyleSheet, TouchableOpacity } from 'react-native';

import EditScreenInfo from '../../components/EditScreenInfo';
import { Text, View } from '../../components/Themed';
import { useWallet } from '../../context/WalletProvider';
import { router } from 'expo-router';
import WalletTicketCardComponent from '../components/walletTicketCardComponent';

export default function TabTwoScreen() {
  
  const { funds, walletTickets } = useWallet();

  // const onAddFunds = () => {
  //   setFunds(funds ? funds + 1 : 1);
  // };
  // const onSubstractFunds = () => {
  //   setFunds(funds ? funds - 1 : 0);
  // };

  const onGoToAddFunds = () => {
    router.push('/wallet/addFunds');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Wallet</Text>
      <View style={styles.wrapper}>
        <View style={styles.fundsContainer}>
          <Text style={styles.fundsTitle}>Balance: {funds || '0'}€</Text>
          <Button title='Add funds' onPress={onGoToAddFunds} />
        </View>

        <View style={styles.ticketsContainer}>
          <Text style={styles.fundsTitle}>Tickets</Text>
          { walletTickets?.length ?
            <FlatList
              style={styles.walletTicketList}
              data={walletTickets}
              renderItem={({ item }) => <WalletTicketCardComponent {...item} />}
              ItemSeparatorComponent={() => <View style={{height: 10}} />}
            />
          :
            <Text style={styles.emptyWallet}>No tickets in wallet</Text>
          }
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 55,
    paddingHorizontal: 15,
    flex: 1,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
  },
  wrapper: {
    marginTop: 10,
    marginHorizontal: 10,
  },
  fundsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  fundsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  ticketsContainer: {
    marginTop: 20,
    // borderWidth: 1,
    // borderColor: 'blue',
  },
  walletTicketList: {
    marginTop: 10,
  },
  emptyWallet: {
    textAlign: 'center',
    color: 'grey',
    marginTop: 10
  }
});
