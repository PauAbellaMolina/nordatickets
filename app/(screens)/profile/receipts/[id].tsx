import { FlatList, StyleSheet, Dimensions, ActivityIndicator, Platform, Pressable } from 'react-native';
import { View, Text } from '../../../../components/Themed';
import { WalletTicket } from "../../../../types/supabaseplain";
import { useLocalSearchParams } from 'expo-router';
import NordaLight from '../../../../assets/svgs/nordalight.svg';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../../supabase';
import { useSupabase } from '../../../../context/SupabaseProvider';
import Colors from '../../../../constants/Colors';

export default function ReceiptDetailScreen() {
  const { user, i18n, theme } = useSupabase();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width, height } = Dimensions.get('window');

  const [vwpDimension, setVwpDimension] = useState<number>(width < height/1.414 ? width : height/1.414);
  const [printMode, setPrintMode] = useState<boolean>(false);
  const [loaded, setLoaded] = useState<boolean>(false);
  const [paginatedGroupedWalletTickets, setPaginatedGroupedWalletTickets] = useState<WalletTicket[][][]>([]);
  const [receiptDate, setReceiptDate] = useState<Date>(null);
  const [orderDbId, setOrderDbId] = useState<number>(null);
  const [orderStatus, setOrderStatus] = useState<string>(null);
  const [eventName, setEventName] = useState<string>(null);
  const [eventTicketFee, setEventTicketFee] = useState<number>(null);

  useEffect(() => {
    if (!user) return;
    let unmounted = false;
    fetchRedsysOrder(unmounted);
    fetchWalletTickets(unmounted);

    return () => {
      unmounted = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let unmounted = false;
    if (!unmounted && paginatedGroupedWalletTickets.length && eventName && receiptDate && orderStatus && !loaded) {
      setLoaded(true);
    }

    return () => {
      unmounted = true;
    };
  }, [user, paginatedGroupedWalletTickets, eventName, eventTicketFee, receiptDate, orderStatus]);

  const fetchRedsysOrder = (unmounted: boolean) => {
    supabase.from('redsys_orders').select().eq('order_id', id).single()
    .then(({ data: redsys_order, error }) => {
      if (unmounted || error || !redsys_order) return;
      setOrderDbId(redsys_order.id);
      const formattedStatus = redsys_order.order_status.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
      setOrderStatus(formattedStatus);
    });
  }

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
        
        //Uncomment if we ever go back to emitting invoices in the name of the organizer instead of ourselves
        // supabase.from('organizers').select().eq('id', event.organizer_id).single()
        // .then(({ data: organizer, error }) => {
        //   if (unmounted || error || !organizer) return;
        //   setOrganizer(organizer);
        // });
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

  const onDownload = () => {
    setPrintMode(true);
    setVwpDimension(600);
    window.print();
    setTimeout(() => {
      setPrintMode(false);
      setVwpDimension(width < height/1.414 ? width : height/1.414);
    }, 5000);
  };

  const renderItemFolio = useCallback(({item: page, index: pageIndex}: {item: WalletTicket[][], index: number}) => (
    <View style={[style.folio, {width: vwpDimension}]}>
      { pageIndex === 0 ? <>
        <View style={style.titleRow}>
          <NordaLight width={vwpDimension/6} height={vwpDimension/12} />
          <Text style={[style.receiptText, {fontSize: vwpDimension/24}]}>{ i18n?.t('simplifiedInvoice') }</Text>
        </View>
        <View style={style.generalInfoRow}>
          <View style={[style.generalInfoContainer, {gap: vwpDimension/120}]}>
            <View style={style.generalInfoEntry}>
              <Text style={[style.receiptText, style.bodyTextTitle,, {fontSize: vwpDimension/54}]}>{ i18n?.t('issuer') }</Text>
              <Text style={[style.receiptText, {fontSize: vwpDimension/54}]}>Marc Abella Molina</Text>
            </View>
            <View style={style.generalInfoEntry}>
              <Text style={[style.receiptText, style.bodyTextTitle,, {fontSize: vwpDimension/54}]}>{ i18n?.t('address') }</Text>
              <Text style={[style.receiptText, {fontSize: vwpDimension/54}]}>Carrer Sant Julià, 9</Text>
            </View>
            <View style={style.generalInfoEntry}>
              <Text style={[style.receiptText, style.bodyTextTitle, {fontSize: vwpDimension/54}]}>{ i18n?.t('cityAndCountry') }</Text>
              <Text style={[style.receiptText, {fontSize: vwpDimension/54}]}>08310, Argentona, España</Text>
            </View>
            <View style={style.generalInfoEntry}>
              <Text style={[style.receiptText, style.bodyTextTitle, {fontSize: vwpDimension/54}]}>NIF</Text>
              <Text style={[style.receiptText, {fontSize: vwpDimension/54}]}>39470762W</Text>
            </View>
          </View>
          <View style={[style.generalInfoContainer, {gap: vwpDimension/120}]}>
            <View style={[style.generalInfoEntry, style.alignedRight]}>
              <Text style={[style.receiptText, style.bodyTextTitle, {fontSize: vwpDimension/54}]}>{ i18n?.t('invoiceNumber') }</Text>
              <Text style={[style.receiptText, {fontSize: vwpDimension/54}]}>{ orderDbId }</Text>
            </View>
            <View style={[style.generalInfoEntry, style.alignedRight]}>
              <Text style={[style.receiptText, style.bodyTextTitle, {fontSize: vwpDimension/54}]}>{ i18n?.t('transactionDate') }</Text>
              <Text style={[style.receiptText, {fontSize: vwpDimension/54}]}>{ receiptDate?.toLocaleString([], {year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute:'2-digit'}) }h</Text>
            </View>
            <View style={[style.generalInfoEntry, style.alignedRight]}>
              <Text style={[style.receiptText, style.bodyTextTitle, {fontSize: vwpDimension/54}]}>{ i18n?.t('event') }</Text>
              <Text style={[style.receiptText, {fontSize: vwpDimension/54}]}>{ eventName }</Text>
            </View>
            <View style={[style.generalInfoEntry, style.alignedRight]}>
              <Text style={[style.receiptText, style.bodyTextTitle, {fontSize: vwpDimension/54}]}>{ i18n?.t('orderIdentifier') }</Text>
              <Text style={[style.receiptText, {fontSize: vwpDimension/54}]}>{ id }</Text>
            </View>
            <View style={[style.generalInfoEntry, style.alignedRight]}>
              <Text style={[style.receiptText, style.bodyTextTitle, {fontSize: vwpDimension/54}]}>{ i18n?.t('receiptOrderStatus') }</Text>
              <Text style={[style.receiptText, {fontSize: vwpDimension/54}]}>{ orderStatus }</Text>
            </View>
          </View>
        </View>
      </> : null }
      <View style={style.table}>
        <View style={[style.tableHeader, {borderBottomWidth: vwpDimension/500}]}>
          <View style={[style.tableCell, style.firstCol]}>
            <Text style={[style.receiptText, style.tableTextTitle, {fontSize: vwpDimension/48}]}>{ i18n?.t('description') }</Text>
          </View>
          <View style={style.tableCell}>
            <Text style={[style.receiptText, style.tableTextTitle, {fontSize: vwpDimension/48}]}>{ i18n?.t('quantity') }</Text>
          </View>
          <View style={style.tableCell}>
            <Text style={[style.receiptText, style.tableTextTitle, {fontSize: vwpDimension/48}]}>IVA</Text>
          </View>
          <View style={style.tableCell}>
            <Text style={[style.receiptText, {fontSize: vwpDimension/58}]}>IVA Incl.</Text>
            <Text style={[style.receiptText, style.tableTextTitle, {fontSize: vwpDimension/48}]}>{ i18n?.t('amount') }</Text>
          </View>
          <View style={style.tableCell}>
            <Text style={[style.receiptText, {fontSize: vwpDimension/58}]}>IVA Incl.</Text>
            <Text style={[style.receiptText, style.tableTextTitle, {fontSize: vwpDimension/48}]}>{ i18n?.t('total') }</Text>
          </View>
        </View>
        <FlatList
          data={page}
          renderItem={({ item: tickets, index: ticketsIndex }) => {
            return (<>
              <View style={style.tableRow}>
                <View style={[style.tableCell, style.firstCol]}>
                  <Text style={[style.receiptText, {fontSize: vwpDimension/50}]}>{ i18n?.t('ticketReedemableFor') } "{tickets[0].event_tickets_name}"</Text>
                </View>
                <View style={style.tableCell}>
                  <Text style={[style.receiptText, {fontSize: vwpDimension/50}]}>{tickets.length}</Text>
                </View>
                <View style={style.tableCell}>
                  <Text style={[style.receiptText, {fontSize: vwpDimension/50}]}>{tickets[0].iva}%</Text>
                </View>
                <View style={style.tableCell}>
                  <Text style={[style.receiptText, {fontSize: vwpDimension/50}]}>{tickets[0].price/100}€</Text>
                </View>
                <View style={style.tableCell}>
                  <Text style={[style.receiptText, {fontSize: vwpDimension/50}]}>{tickets.reduce((acc, ticket) => acc + ticket.price, 0) / 100}€</Text>
                </View>
              </View>
              { pageIndex === paginatedGroupedWalletTickets.length - 1 && ticketsIndex === page.length - 1 ? <>
                { eventTicketFee ? <>
                  <View style={style.tableFooter}>
                    <View style={[style.tableCell, style.firstCol]}>
                    </View>
                    <View style={style.tableCell}>
                    </View>
                    <View style={[style.tableCell, style.tableCellTitleFooter, style.borderTop, {borderTopWidth: vwpDimension/500}]}>
                      <Text style={[style.receiptText, style.tableTextEnd, {fontSize: vwpDimension/48}]}>Tickets:</Text>
                    </View>
                    <View style={[style.tableCell, style.borderTop, {borderTopWidth: vwpDimension/500}]}>
                      <Text style={[style.receiptText, {fontSize: vwpDimension/50}]}>{ paginatedGroupedWalletTickets.reduce((acc, page) => acc + page.reduce((acc, walletTickets) => acc + walletTickets.reduce((acc, ticket) => acc + ticket.price, 0), 0), 0) / 100 }€</Text>
                    </View>
                  </View>
                  <View style={style.tableFooter}>
                    <View style={[style.tableCell, style.firstCol]}>
                    </View>
                    <View style={style.tableCell}>
                    </View>
                    <View style={[style.tableCell, style.tableCellTitleFooter]}>
                      <Text style={[style.receiptText, style.tableTextEnd, {fontSize: vwpDimension/48}]}>{ i18n?.t('serviceFee') }:</Text>
                    </View>
                    <View style={[style.tableCell]}>
                      <Text style={[style.receiptText, {fontSize: vwpDimension/50}]}>{ eventTicketFee * paginatedGroupedWalletTickets.reduce((acc, page) => acc + page.reduce((acc, walletTickets) => acc + walletTickets.length, 0), 0) / 100 }€</Text>
                    </View>
                  </View>
                </> : null }
                <View style={style.tableFooter}>
                  <View style={[style.tableCell, style.firstCol]}>
                  </View>
                  <View style={style.tableCell}>
                  </View>
                  <View style={[style.tableCell, style.tableCellTitleFooter, !eventTicketFee ? {borderTopWidth: vwpDimension/500, borderColor: 'black', paddingTop: 8} : null]}>
                    <Text style={[style.receiptText, style.tableTextEnd, {fontSize: vwpDimension/58}]}>IVA Incl.</Text>
                    <Text style={[style.receiptText, style.tableTextTitle, style.tableTextEnd, {fontSize: vwpDimension/48}]}>{ i18n?.t('total') }:</Text>
                  </View>
                  <View style={[style.tableCell, !eventTicketFee ? {borderTopWidth: vwpDimension/500, borderColor: 'black', paddingTop: 8} : null]}>
                    <Text style={[style.receiptText, {fontSize: vwpDimension/50}]}>{ (paginatedGroupedWalletTickets.reduce((acc, page) => acc + page.reduce((acc, walletTickets) => acc + walletTickets.reduce((acc, ticket) => acc + ticket.price, 0), 0), 0) / 100) + (eventTicketFee * paginatedGroupedWalletTickets.reduce((acc, page) => acc + page.reduce((acc, walletTickets) => acc + walletTickets.length, 0), 0) / 100) }€</Text>
                  </View>
                </View>
                </> : null }
            </>)
          }}
        />
      </View>
    </View>
  ), [user, paginatedGroupedWalletTickets, eventName, eventTicketFee, receiptDate, vwpDimension]);

  const style = styles(theme);
  
  return !loaded ? 
  (
    <View style={{height: '100%', justifyContent: 'center'}}>
      <ActivityIndicator size="large" />
    </View>
  ) : (
    <View style={[style.container, printMode ? { backgroundColor: 'white' } : null]}>
      <FlatList
        contentContainerStyle={{alignItems: 'center'}}
        data={paginatedGroupedWalletTickets}
        ItemSeparatorComponent={() => <View style={{height: 20}} /> }
        renderItem={renderItemFolio}
      />
      { !printMode ? 
        <Pressable
          onPress={onDownload}
          style={style.downloadButton}
        ><Text>{ i18n?.t('download') }</Text></Pressable>
      : null }
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

const styles = (theme: string) => StyleSheet.create({
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
    alignItems: 'center',
    justifyContent: 'flex-end'
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
    flex: 3.5,
    alignItems: 'flex-start',
    marginLeft: '1%'
  },
  borderTop: {
    borderTopColor: 'black',
    paddingTop: 8
  },
  downloadButton: {
    alignSelf: 'center',
    alignItems: 'center',
    borderRadius: 15,
    paddingVertical: 11,
    paddingHorizontal: 30,
    marginHorizontal: 25,
    marginVertical: 13,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors[theme].text
  }
});
