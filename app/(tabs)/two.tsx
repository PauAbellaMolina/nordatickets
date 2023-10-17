import { Button, FlatList, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useWallet } from '../../context/WalletProvider';
import { Text, View } from '../../components/Themed';
import WalletTicketGroupCardComponent from '../components/walletTicketGroupCardComponent';

export default function TabTwoScreen() {
  const { funds, walletTicketGroups } = useWallet();

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
          { walletTicketGroups?.length ?
            <FlatList
              style={styles.walletTicketList}
              data={walletTicketGroups}
              renderItem={({ item }) => <WalletTicketGroupCardComponent {...item} />}
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
    flex: 1
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold'
  },
  wrapper: {
    marginTop: 10,
    marginHorizontal: 10
  },
  fundsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  fundsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 20
  },
  ticketsContainer: {
    marginTop: 20
  },
  walletTicketList: {
    marginTop: 10
  },
  emptyWallet: {
    textAlign: 'center',
    color: 'grey',
    marginTop: 10
  }
});
