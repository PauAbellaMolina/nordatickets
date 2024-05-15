import { FlatList, Platform, Pressable, StyleSheet } from 'react-native';
import { View, Text } from "./Themed";
import { WalletTicket } from "../types/supabaseplain";
import Colors from '../constants/Colors';
import { router } from 'expo-router';
import { FeatherIcon } from './CustomIcons';
import { useSupabase } from '../context/SupabaseProvider';
import { useCallback, useEffect, useState } from 'react';

export default function ReceiptsOrderComponent({ order, eventName, eventTicketFee }: { order: WalletTicket[], eventName: string, eventTicketFee: number}) {
  const { i18n, theme } = useSupabase();
  const [total, setTotal] = useState<number>(null);

  useEffect(() => {
    if (!order.length) return;
    const totalTickets = order.reduce((acc, ticket) => acc + ticket.price, 0);
    const totalFees = eventTicketFee ? eventTicketFee * order.length : 0;
    setTotal((totalTickets + totalFees) / 100);
  }, [order]);

  const onGoToReceiptDetail = () => {
    router.navigate(`/profile/receipts/${order[0].order_id}`);
  }

  const renderItem = useCallback(({item}: {item: WalletTicket}) => (
    <Text>{ item.event_tickets_name } - { item.price / 100 }€</Text>
  ), []);
  
  return (
    <View style={[styles.container, {backgroundColor: Colors[theme].backgroundContrast}]}>
      <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
        <View>
          <Text style={styles.orderTitle}>{ i18n?.t('identifier') }:</Text>
          <Text style={styles.orderTitle}>{ order[0].order_id }</Text>
        </View>
        <View>
          <Text style={styles.orderInfo}>{ new Date(order[0].created_at).toLocaleString([], {year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute:'2-digit'}) }h</Text>
          { eventName ?
            <Text style={styles.orderInfo}>{ eventName }</Text>
          : null }
        </View>
      </View>
      <View style={styles.orderContent}>
        <FlatList
          data={order}
          renderItem={renderItem}
        />
        <View>
          { eventTicketFee ?
            <Text>{ i18n?.t('serviceFee') }: { eventTicketFee * order.length / 100 }€</Text>
          : null }
          { total !== null && total !== undefined ?
            <Text style={{fontWeight: 'bold'}}>{ i18n?.t('total') }: { total }€</Text>
          : null }
        </View>
      </View>
      <Pressable style={styles.goToReceiptContainer} onPress={onGoToReceiptDetail}>
        <FeatherIcon name="file-text" size={25} color={Colors[theme].text} />
      </Pressable>
    </View>
  );

};

const containerMobileShadow = {
  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 1
  },
  shadowOpacity: 0.10,
  shadowRadius: 1.5
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 15,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 10,
    ...Platform.select({
      web: {
        boxShadow: '0px 1px 1.5px rgba(0, 0, 0, 0.10)'
      },
      ios: {...containerMobileShadow},
      android: {...containerMobileShadow, elevation: 3}
    })
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  orderContent: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    gap: 10
  },
  orderInfo: {
    textAlign: 'right',
    fontSize: 14
  },
  goToReceiptContainer: {
    position: 'absolute',
    right: 15,
    bottom: 15
  }
});
