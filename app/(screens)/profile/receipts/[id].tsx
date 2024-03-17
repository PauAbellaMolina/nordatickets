import { FlatList, Pressable, StyleSheet, useColorScheme } from 'react-native';
import { View, Text } from '../../../../components/Themed';
import { WalletTicket } from "../../../../types/supabaseplain";
import Colors from '../../../../constants/Colors';
import { router, useLocalSearchParams } from 'expo-router';
import GoBackArrow from '../../../../components/GoBackArrow';
import TiktLight from '../../../../assets/svgs/tiktlight.svg';
import { useEffect, useState } from 'react';
import { FeatherIcon } from '../../../../components/CustomIcons';
import { supabase } from '../../../../supabase';
import { useSupabase } from '../../../../context/SupabaseProvider';

export default function ReceiptDetailScreen() {
  const theme = useColorScheme() ?? 'light';
  const { user } = useSupabase();
  const { id } = useLocalSearchParams(); //TODO PAU make sure that the user will only be able to retrieve their own receipts. With the corret fetch and also RLS config!!!!

  const [paginatedWalletTickets, setPaginatedWalletTickets] = useState<WalletTicket[][]>([]);
  const [eventTicketFee, setEventTicketFee] = useState<number>(null);
  const [printMode, setPrintMode] = useState<boolean>(false);

  useEffect(() => {
    if (!user) return;
    fetchWalletTickets();
  }, [user]);

  const fetchWalletTickets = () => { //TODO PAU the same useFocusEffect() stuff on WalletTicketCardComponent could be used here to optimize, but it's not as crucial as there
    supabase.from('wallet_tickets').select().eq('user_id', user.id).eq('order_id', id).order('created_at', { ascending: false })
    .then(({ data: wallet_tickets, error }) => {
      if (error) return;
      const paginatedWalletTickets = [];
      paginatedWalletTickets.push(wallet_tickets.slice(0, 10));
      for (let i = 10; i < wallet_tickets.length; i += 20) {
        paginatedWalletTickets.push(wallet_tickets.slice(i, i + 20));
      }
      setPaginatedWalletTickets(paginatedWalletTickets);

      const eventId = wallet_tickets[0].event_id;
      supabase.from('events').select().eq('id', eventId)
      .then(({ data: events, error }) => {
        if (error || !events.length) return;
        setEventTicketFee(events[0].ticket_fee);
      });
    });
  };

  const onPrint = () => {
    setPrintMode(true);
    setTimeout(() => {
      window.print();
      setPrintMode(false);
    }, 5000);
  };

  //TODO PAU continue here: try spawning iframe with html invoice inside and triggering print on the iframes html
  
  return (
    <View style={[styles.container, !printMode ? {paddingTop: 75, flex: 1} : null]}>
      <>{ !printMode ?
        <><GoBackArrow light={theme === 'dark'} />
        <Text style={styles.title}>Rebut { id }</Text></>
      : null }</>
      <FlatList
        data={paginatedWalletTickets}
        renderItem={({ item: walletTickets, index: walletTicketsIndex }) => {
          return (
            <View style={[styles.wrapper, !printMode ? styles.wrapperMargins : null]}>
              { walletTicketsIndex === 0 ? <>
                <View style={styles.titleRow}>
                  <TiktLight width={80} height={40} />
                  <Text style={[styles.receiptText, styles.receiptSubtitle]}>Factura Simplificada</Text>
                </View>
                <View style={styles.generalInfoRow}>
                  <View style={styles.generalInfoContainer}>
                    <View style={styles.generalInfoEntry}>
                      <Text style={[styles.receiptText, styles.bodyText, styles.bodyTextTitle]}>Direcció</Text>
                      <Text style={[styles.receiptText, styles.bodyText]}>Av. Països Catalans 169 1 3</Text>
                    </View>
                    <View style={styles.generalInfoEntry}>
                      <Text style={[styles.receiptText, styles.bodyText, styles.bodyTextTitle]}>Ciutat i País</Text>
                      <Text style={[styles.receiptText, styles.bodyText]}>Reus, Catalunya, Espanya</Text>
                    </View>
                    <View style={styles.generalInfoEntry}>
                      <Text style={[styles.receiptText, styles.bodyText, styles.bodyTextTitle]}>NIF</Text>
                      <Text style={[styles.receiptText, styles.bodyText]}>39470763A</Text>
                    </View>
                    <View style={styles.generalInfoEntry}>
                      <Text style={[styles.receiptText, styles.bodyText, styles.bodyTextTitle]}>Contacte</Text>
                      <Text style={[styles.receiptText, styles.bodyText]}>factura@elteutikt.com · 694467917</Text>
                    </View>
                  </View>
                  <View style={styles.generalInfoContainer}>
                    <View style={[styles.generalInfoEntry, styles.alignedRight]}>
                      <Text style={[styles.receiptText, styles.bodyText, styles.bodyTextTitle]}>Número de factura</Text>
                      <Text style={[styles.receiptText, styles.bodyText]}>{ id }</Text>
                    </View>
                    <View style={[styles.generalInfoEntry, styles.alignedRight]}>
                      <Text style={[styles.receiptText, styles.bodyText, styles.bodyTextTitle]}>Data de la compra</Text>
                      <Text style={[styles.receiptText, styles.bodyText]}>xxxx</Text>
                    </View>
                  </View>
                </View>
              </> : null }
              <View style={styles.itemsRow}>
                <View style={styles.table}>
                  <View style={styles.tableHeader}>
                    <View style={[styles.tableCell, styles.firstCol]}>
                      <Text style={[styles.receiptText, styles.tableText, styles.tableTextTitle]}>Descripció</Text>
                    </View>
                    <View style={styles.tableCell}>
                      <Text style={[styles.receiptText, styles.tableText, styles.tableTextTitle]}>Import</Text>
                    </View>
                    <View style={styles.tableCell}>
                      <Text style={[styles.receiptText, styles.tableText, styles.tableTextTitle]}>Quantitat</Text>
                    </View>
                    <View style={styles.tableCell}>
                      <Text style={[styles.receiptText, styles.tableText, styles.tableTextTitle]}>Total</Text>
                    </View>
                  </View>
                  <FlatList
                    data={walletTickets}
                    renderItem={({ item: ticket, index: ticketIndex }) => {
                      return (<>
                        <View style={styles.tableRow}>
                          <View style={[styles.tableCell, styles.firstCol]}>
                            <Text style={[styles.receiptText, styles.tableText]}>{ticket.event_tickets_name}</Text>
                          </View>
                          <View style={styles.tableCell}>
                            <Text style={[styles.receiptText, styles.tableText]}>{ticket.price/100}</Text>
                          </View>
                          <View style={styles.tableCell}>
                            <Text style={[styles.receiptText, styles.tableText]}>1</Text>
                          </View>
                          <View style={styles.tableCell}>
                            <Text style={[styles.receiptText, styles.tableText]}>{(ticket.price + eventTicketFee)/100}</Text>
                          </View>
                        </View>
                        { walletTicketsIndex === paginatedWalletTickets.length - 1 && ticketIndex === walletTickets.length - 1 ? <>
                          <View style={styles.tableFooter}>
                            <View style={[styles.tableCell, styles.firstCol]}>
                            </View>
                            <View style={styles.tableCell}>
                            </View>
                            <View style={[styles.tableCell, styles.tableCellTitleFooter, styles.borderTop]}>
                              <Text style={[styles.receiptText, styles.tableText, styles.tableTextEnd]}>Tickets:</Text>
                            </View>
                            <View style={[styles.tableCell, styles.borderTop]}>
                              <Text style={[styles.receiptText, styles.tableText]}>{ walletTickets.reduce((acc, ticket) => acc + ticket.price, 0) / 100 }€</Text>
                            </View>
                          </View>
                          <View style={styles.tableFooter}>
                            <View style={[styles.tableCell, styles.firstCol]}>
                            </View>
                            <View style={styles.tableCell}>
                            </View>
                            <View style={[styles.tableCell, styles.tableCellTitleFooter]}>
                              <Text style={[styles.receiptText, styles.tableText, styles.tableTextEnd]}>Gastos de gestió:</Text>
                            </View>
                            <View style={[styles.tableCell]}>
                              <Text style={[styles.receiptText, styles.tableText]}>{ (eventTicketFee * walletTickets.length) / 100 }€</Text>
                            </View>
                          </View>
                          <View style={styles.tableFooter}>
                            <View style={[styles.tableCell, styles.firstCol]}>
                            </View>
                            <View style={styles.tableCell}>
                            </View>
                            <View style={[styles.tableCell, styles.tableCellTitleFooter]}>
                              <Text style={[styles.receiptText, styles.tableText, styles.tableTextTitle, styles.tableTextEnd]}>Total:</Text>
                            </View>
                            <View style={styles.tableCell}>
                              <Text style={[styles.receiptText, styles.tableText]}>{ (walletTickets.reduce((acc, ticket) => acc + ticket.price, 0) + eventTicketFee * walletTickets.length) / 100 }€</Text>
                            </View>
                          </View>
                          </> : null }
                      </>)
                    }}
                  />
                </View>
              </View>
            </View>
          )
        }}
      />
      <>{ !printMode ?
      <View style={styles.printButtonWrapper}>
        <Pressable style={[styles.printButton, {borderColor: Colors[theme].text}]} onPress={onPrint}><FeatherIcon name="download" size={18} color={Colors[theme].text} /><Text style={styles.printText}>Descarregar</Text></Pressable>
      </View>
      : null }</>
    </View>
  );

};

const styles = StyleSheet.create({
  container: {
    overflow: 'scroll'
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    paddingHorizontal: 15
  },
  wrapper: {
    backgroundColor: 'white',
    color: 'black',
    aspectRatio: 1/1.414,
    paddingVertical: 40,
    paddingHorizontal: 30,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.10,
    shadowRadius: 8
  },
  wrapperMargins: {
    width: 325,
    marginTop: 30,
    marginBottom: 5,
    marginHorizontal: 25
  },
  receiptText: {
    color: 'black'
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 35
  },
  receiptTitle: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  receiptSubtitle: {
    fontSize: 14
  },
  generalInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 35
  },
  generalInfoContainer: {
    flexDirection: 'column',
    gap: 2
  },
  generalInfoEntry: {
    flexDirection: 'column'
  },
  alignedRight: {
    alignItems: 'flex-end'
  },
  bodyText: {
    fontSize: 6
  },
  bodyTextTitle: {
    fontSize: 8,
    fontWeight: 'bold'
  },
  itemsRow: {
    flexDirection: 'column'
  },
  table: {
    flexDirection: 'column'
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: 'black',
    paddingBottom: 5
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5
  },
  tableFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 3,
    marginBottom: 2
  },
  tableCell: {
    flex: 1,
    alignItems: 'center'
  },
  tableCellTitleFooter: {
    alignItems: 'flex-end'
  },
  tableText: {
    fontSize: 8
  },
  tableTextTitle: {
    fontWeight: 'bold'
  },
  tableTextEnd: {
    textAlign: 'right',
    whiteSpace: 'nowrap'
  },
  firstCol: {
    flex: 2,
    alignItems: 'flex-start'
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: 'black',
    paddingTop: 8
  },
  printButtonWrapper: {
    width: 325,
    alignContent: 'center',
    marginHorizontal: 25
  },
  printButton: {
    alignSelf: 'center',
    marginTop: 15,
    marginBottom: 20,
    paddingHorizontal: 15,
    paddingVertical: 7,
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  printText: {
    fontSize: 14
  }
});
