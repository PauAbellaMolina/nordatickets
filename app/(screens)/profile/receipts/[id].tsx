import { FlatList, StyleSheet, Dimensions, ActivityIndicator, Platform } from 'react-native';
import { View, Text } from '../../../../components/Themed';
import { WalletTicket } from "../../../../types/supabaseplain";
import { useLocalSearchParams } from 'expo-router';
import TiktLight from '../../../../assets/svgs/tiktlight.svg';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../../supabase';
import { useSupabase } from '../../../../context/SupabaseProvider';

export default function ReceiptDetailScreen() {
  const { user, i18n } = useSupabase();
  const { id } = useLocalSearchParams<{ id: string }>(); //TODO PAU make sure that the user will only be able to retrieve their own receipts. With the correct fetch and also RLS config!!!!
  const { width, height } = Dimensions.get('window');
  const vwpDimension = width < height/1.414 ? width : height/1.414;

  const [loaded, setLoaded] = useState<boolean>(false);
  const [paginatedGroupedWalletTickets, setPaginatedGroupedWalletTickets] = useState<WalletTicket[][][]>([]);
  const [receiptDate, setReceiptDate] = useState<Date>(null);
  const [eventName, setEventName] = useState<string>(null);
  const [eventTicketFee, setEventTicketFee] = useState<number>(null);

  useEffect(() => {
    if (!user) return;
    let unmounted = false;
    fetchWalletTickets(unmounted);

    return () => {
      unmounted = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let unmounted = false;
    if (!unmounted && paginatedGroupedWalletTickets.length && eventName && receiptDate && !loaded) {
      setLoaded(true);
    }

    return () => {
      unmounted = true;
    };
  }, [user, paginatedGroupedWalletTickets, eventName, eventTicketFee, receiptDate]);

  const fetchWalletTickets = (unmounted: boolean) => { //TODO PAU the same useFocusEffect() stuff on WalletTicketCardComponent could be used here to optimize, but it's not as crucial as there
    supabase.from('wallet_tickets').select().eq('user_id', user.id).eq('order_id', id).order('created_at', { ascending: false })
    .then(({ data: wallet_tickets, error }) => {
      if (error) return;
      const eventId = wallet_tickets[0].event_id;
      supabase.from('events').select().eq('id', eventId).single()
      .then(({ data: event, error }) => {
        if (unmounted || error || !event) return;
        setEventTicketFee(event.ticket_fee);
        setEventName(event.name);
      });

      if (unmounted) return

      setReceiptDate(new Date(wallet_tickets[0].created_at));

      const groupedWalletTickets: { [key: string]: WalletTicket[] } = {};
      wallet_tickets.forEach((ticket) => {
        if (!groupedWalletTickets[ticket.event_tickets_id]) groupedWalletTickets[ticket.event_tickets_id] = [];
        groupedWalletTickets[ticket.event_tickets_id].push(ticket);
      });
      const arrayGroupedWalletTickets: WalletTicket[][] = Object.values(groupedWalletTickets);
      const paginatedGroupedWalletTickets: WalletTicket[][][] = [];
      paginatedGroupedWalletTickets.push(arrayGroupedWalletTickets.slice(0, 19));
      for (let i = 19; i < arrayGroupedWalletTickets.length; i += 30) {
        paginatedGroupedWalletTickets.push(arrayGroupedWalletTickets.slice(i, i + 30));
      }

      setPaginatedGroupedWalletTickets(paginatedGroupedWalletTickets);
    });
  };

  const renderItemFolio = useCallback(({item: page, index: pageIndex}: {item: WalletTicket[][], index: number}) => (
    <View style={[styles.folio, {width: vwpDimension}]}>
      { pageIndex === 0 ? <>
        <View style={styles.titleRow}>
          <TiktLight width={vwpDimension/6} height={vwpDimension/12} />
          <Text style={[styles.receiptText, {fontSize: vwpDimension/24}]}>{ i18n?.t('simplifiedInvoice') }</Text>
        </View>
        <View style={styles.generalInfoRow}>
          <View style={[styles.generalInfoContainer, {gap: vwpDimension/120}]}>
            <View style={styles.generalInfoEntry}>
              <Text style={[styles.receiptText, styles.bodyTextTitle,, {fontSize: vwpDimension/54}]}>{ i18n?.t('address') }</Text>
              <Text style={[styles.receiptText, {fontSize: vwpDimension/54}]}>Av. Països Catalans 169 1 3</Text>
            </View>
            <View style={styles.generalInfoEntry}>
              <Text style={[styles.receiptText, styles.bodyTextTitle, {fontSize: vwpDimension/54}]}>{ i18n?.t('cityAndCountry') }</Text>
              <Text style={[styles.receiptText, {fontSize: vwpDimension/54}]}>Reus, { i18n?.t('catalonia') }, { i18n?.t('spain') }</Text>
            </View>
            <View style={styles.generalInfoEntry}>
              <Text style={[styles.receiptText, styles.bodyTextTitle, {fontSize: vwpDimension/54}]}>NIF</Text>
              <Text style={[styles.receiptText, {fontSize: vwpDimension/54}]}>39470763A</Text>
            </View>
            <View style={styles.generalInfoEntry}>
              <Text style={[styles.receiptText, styles.bodyTextTitle, {fontSize: vwpDimension/54}]}>{ i18n?.t('contact') }</Text>
              <Text style={[styles.receiptText, {fontSize: vwpDimension/54}]}>factura@elteutikt.com · 694467917</Text>
            </View>
          </View>
          <View style={[styles.generalInfoContainer, {gap: vwpDimension/120}]}>
            <View style={[styles.generalInfoEntry, styles.alignedRight]}>
              <Text style={[styles.receiptText, styles.bodyTextTitle, {fontSize: vwpDimension/54}]}>{ i18n?.t('invoiceNumber') }</Text>
              <Text style={[styles.receiptText, {fontSize: vwpDimension/54}]}>{ id }</Text>
            </View>
            <View style={[styles.generalInfoEntry, styles.alignedRight]}>
              <Text style={[styles.receiptText, styles.bodyTextTitle, {fontSize: vwpDimension/54}]}>{ i18n?.t('transactionDate') }</Text>
              <Text style={[styles.receiptText, {fontSize: vwpDimension/54}]}>{ receiptDate?.toLocaleString([], {year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute:'2-digit'}) }h</Text>
            </View>
            <View style={[styles.generalInfoEntry, styles.alignedRight]}>
              <Text style={[styles.receiptText, styles.bodyTextTitle, {fontSize: vwpDimension/54}]}>{ i18n?.t('event') }</Text>
              <Text style={[styles.receiptText, {fontSize: vwpDimension/54}]}>{ eventName }</Text>
            </View>
          </View>
        </View>
      </> : null }
      <View style={styles.table}>
        <View style={[styles.tableHeader, {borderBottomWidth: vwpDimension/500}]}>
          <View style={[styles.tableCell, styles.firstCol]}>
            <Text style={[styles.receiptText, styles.tableTextTitle, {fontSize: vwpDimension/48}]}>{ i18n?.t('description') }</Text>
          </View>
          <View style={styles.tableCell}>
            <Text style={[styles.receiptText, styles.tableTextTitle, {fontSize: vwpDimension/48}]}>{ i18n?.t('amount') }</Text>
          </View>
          <View style={styles.tableCell}>
            <Text style={[styles.receiptText, styles.tableTextTitle, {fontSize: vwpDimension/48}]}>{ i18n?.t('quantity') }</Text>
          </View>
          <View style={styles.tableCell}>
            <Text style={[styles.receiptText, styles.tableTextTitle, {fontSize: vwpDimension/48}]}>{ i18n?.t('total') }</Text>
          </View>
        </View>
        <FlatList
          data={page}
          renderItem={({ item: tickets, index: ticketsIndex }) => {
            return (<>
              <View style={styles.tableRow}>
                <View style={[styles.tableCell, styles.firstCol]}>
                  <Text style={[styles.receiptText, {fontSize: vwpDimension/50}]}>{tickets[0].event_tickets_name}</Text>
                </View>
                <View style={styles.tableCell}>
                  <Text style={[styles.receiptText, {fontSize: vwpDimension/50}]}>{tickets[0].price/100}€</Text>
                </View>
                <View style={styles.tableCell}>
                  <Text style={[styles.receiptText, {fontSize: vwpDimension/50}]}>{tickets.length}</Text>
                </View>
                <View style={styles.tableCell}>
                  <Text style={[styles.receiptText, {fontSize: vwpDimension/50}]}>{tickets.reduce((acc, ticket) => acc + ticket.price, 0) / 100}€</Text>
                </View>
              </View>
              { pageIndex === paginatedGroupedWalletTickets.length - 1 && ticketsIndex === page.length - 1 ? <>
                <View style={styles.tableFooter}>
                  <View style={[styles.tableCell, styles.firstCol]}>
                  </View>
                  <View style={styles.tableCell}>
                  </View>
                  <View style={[styles.tableCell, styles.tableCellTitleFooter, styles.borderTop, {borderTopWidth: vwpDimension/500}]}>
                    <Text style={[styles.receiptText, styles.tableTextEnd, {fontSize: vwpDimension/48}]}>Tickets:</Text>
                  </View>
                  <View style={[styles.tableCell, styles.borderTop, {borderTopWidth: vwpDimension/500}]}>
                    <Text style={[styles.receiptText, {fontSize: vwpDimension/50}]}>{ paginatedGroupedWalletTickets.reduce((acc, page) => acc + page.reduce((acc, walletTickets) => acc + walletTickets.reduce((acc, ticket) => acc + ticket.price, 0), 0), 0) / 100 }€</Text>
                  </View>
                </View>
                <View style={styles.tableFooter}>
                  <View style={[styles.tableCell, styles.firstCol]}>
                  </View>
                  <View style={styles.tableCell}>
                  </View>
                  { eventTicketFee ?
                    <View style={[styles.tableCell, styles.tableCellTitleFooter]}>
                      <Text style={[styles.receiptText, styles.tableTextEnd, {fontSize: vwpDimension/48}]}>{ i18n?.t('serviceFee') }:</Text>
                    </View>
                  : null }
                  { eventTicketFee ?
                    <View style={[styles.tableCell]}>
                      <Text style={[styles.receiptText, {fontSize: vwpDimension/50}]}>{ eventTicketFee * paginatedGroupedWalletTickets.reduce((acc, page) => acc + page.reduce((acc, walletTickets) => acc + walletTickets.length, 0), 0) / 100 }€</Text>
                    </View>
                  : null }
                </View>
                <View style={styles.tableFooter}>
                  <View style={[styles.tableCell, styles.firstCol]}>
                  </View>
                  <View style={styles.tableCell}>
                  </View>
                  <View style={[styles.tableCell, styles.tableCellTitleFooter]}>
                    <Text style={[styles.receiptText, styles.tableTextTitle, styles.tableTextEnd, {fontSize: vwpDimension/48}]}>{ i18n?.t('total') }:</Text>
                  </View>
                  <View style={styles.tableCell}>
                    <Text style={[styles.receiptText, {fontSize: vwpDimension/50}]}>{ (paginatedGroupedWalletTickets.reduce((acc, page) => acc + page.reduce((acc, walletTickets) => acc + walletTickets.reduce((acc, ticket) => acc + ticket.price, 0), 0), 0) / 100) + (eventTicketFee * paginatedGroupedWalletTickets.reduce((acc, page) => acc + page.reduce((acc, walletTickets) => acc + walletTickets.length, 0), 0) / 100) }€</Text>
                  </View>
                </View>
                </> : null }
            </>)
          }}
        />
      </View>
    </View>
  ), [user, paginatedGroupedWalletTickets, eventName, eventTicketFee, receiptDate]);
  
  return !loaded ? 
  (
    <View style={{height: '100%', justifyContent: 'center'}}>
      <ActivityIndicator size="large" />
    </View>
  ) : (
    <View style={styles.container}>
      <FlatList
        contentContainerStyle={{alignItems: 'center'}}
        data={paginatedGroupedWalletTickets}
        ItemSeparatorComponent={() => <View style={{height: 20}} /> }
        renderItem={renderItemFolio}
      />
    </View>
  );

};

const folioMobileShadow = {
  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 2
  },
  shadowOpacity: 0.10,
  shadowRadius: 8
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  folio: {
    backgroundColor: 'white',
    color: 'black',
    aspectRatio: 1/1.414,
    paddingVertical: '7%',
    paddingHorizontal: '9%',
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)'
      },
      ios: {...folioMobileShadow},
      android: {...folioMobileShadow, elevation: 4}
    })
  },
  receiptText: {
    color: 'black'
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: '7%'
  },
  generalInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: '8.5%'
  },
  generalInfoContainer: {
    flexDirection: 'column'
  },
  generalInfoEntry: {
    flexDirection: 'column'
  },
  alignedRight: {
    alignItems: 'flex-end'
  },
  bodyTextTitle: {
    fontWeight: 'bold'
  },
  table: {
    flexDirection: 'column'
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomColor: 'black',
    marginBottom: '1.5%',
    paddingBottom: '1.2%'
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: '1.5%'
  },
  tableFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: '1%',
    marginBottom: '.8%'
  },
  tableCell: {
    flex: 1,
    alignItems: 'center'
  },
  tableCellTitleFooter: {
    alignItems: 'flex-end'
  },
  tableTextTitle: {
    fontWeight: 'bold'
  },
  tableTextEnd: {
    textAlign: 'right'
  },
  firstCol: {
    flex: 2,
    alignItems: 'flex-start',
    marginLeft: '1%'
  },
  borderTop: {
    borderTopColor: 'black',
    paddingTop: 8
  }
});
