import { FlatList, Pressable, StyleSheet, useColorScheme } from 'react-native';
import { View, Text } from '../../../../components/Themed';
import { WalletTicket } from "../../../../types/supabaseplain";
import Colors from '../../../../constants/Colors';
import { router, useLocalSearchParams } from 'expo-router';
import GoBackArrow from '../../../../components/GoBackArrow';
import TiktLight from '../../../../assets/svgs/tiktlight.svg';
import { useState } from 'react';
import { FeatherIcon } from '../../../../components/CustomIcons';

export default function ReceiptDetailScreen() {
  const theme = useColorScheme() ?? 'light';
  const { id } = useLocalSearchParams(); //TODO PAU make sure that the user will only be able to retrieve their own receipts. With the corret fetch and also RLS config!!!!
  const [printMode, setPrintMode] = useState<boolean>(false);

  const onPrint = () => {
    setPrintMode(true);
    setTimeout(() => {
      window.print();
      setPrintMode(false);
    });
  }
  
  return (
    <View style={[styles.container, !printMode ? {paddingTop: 75} : null]}>
      <>{ !printMode ?
        <><GoBackArrow light={theme === 'dark'} />
        <Text style={styles.title}>Rebut { id }</Text></>
      : null }</>
      <View style={[styles.wrapper, !printMode ? styles.wrapperMargins : null]}>
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
            {/* TODO PAU flatlist render the below view */}
            <View style={styles.tableRow}>
              <View style={[styles.tableCell, styles.firstCol]}>
                <Text style={[styles.receiptText, styles.tableText]}>Refresc</Text>
              </View>
              <View style={styles.tableCell}>
                <Text style={[styles.receiptText, styles.tableText]}>2,5</Text>
              </View>
              <View style={styles.tableCell}>
                <Text style={[styles.receiptText, styles.tableText]}>1</Text>
              </View>
              <View style={styles.tableCell}>
                <Text style={[styles.receiptText, styles.tableText]}>2,65</Text>
              </View>
            </View>
            <View style={styles.tableRow}>
              <View style={[styles.tableCell, styles.firstCol]}>
                <Text style={[styles.receiptText, styles.tableText]}>Refresc</Text>
              </View>
              <View style={styles.tableCell}>
                <Text style={[styles.receiptText, styles.tableText]}>2,5</Text>
              </View>
              <View style={styles.tableCell}>
                <Text style={[styles.receiptText, styles.tableText]}>1</Text>
              </View>
              <View style={styles.tableCell}>
                <Text style={[styles.receiptText, styles.tableText]}>2,65</Text>
              </View>
            </View>
            <View style={styles.tableFooter}>
              <View style={[styles.tableCell, styles.firstCol]}>
              </View>
              <View style={styles.tableCell}>
              </View>
              <View style={[styles.tableCell, styles.borderTop]}>
                <Text style={[styles.receiptText, styles.tableText, styles.tableTextTitle]}>Total:</Text>
              </View>
              <View style={[styles.tableCell, styles.borderTop]}>
                <Text style={[styles.receiptText, styles.tableText]}>5,3€</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
      <>{ !printMode ?
        <Pressable style={[styles.printButton, {borderColor: Colors[theme].text}]} onPress={onPrint}><FeatherIcon name="download" size={18} color={Colors[theme].text} /><Text style={styles.printText}>Descarregar</Text></Pressable>
      : null }</>
    </View>
  );

};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'scroll'
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    // paddingTop: 75,
    paddingHorizontal: 15
  },
  wrapper: {
    backgroundColor: 'white',
    color: 'black',
    aspectRatio: 1/1.414,
    paddingVertical: 40,
    paddingHorizontal: 50
  },
  wrapperMargins: {
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
    fontSize: 20,
    fontWeight: 'bold'
  },
  receiptSubtitle: {
    fontSize: 16
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
    fontSize: 8
  },
  bodyTextTitle: {
    fontSize: 10,
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
    // borderTopWidth: 1,
    // borderTopColor: 'black',
    // paddingTop: 5
  },
  tableCell: {
    flex: 1,
    alignItems: 'center'
  },
  tableText: {
    fontSize: 10
  },
  tableTextTitle: {
    fontWeight: 'bold'
  },
  firstCol: {
    flex: 2,
    alignItems: 'flex-start',
    // marginHorizontal: 5
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: 'black',
    paddingTop: 5
  },
  printButton: {
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 50,
    paddingHorizontal: 15,
    paddingVertical: 7,
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  printText: {
    fontSize: 16
  }
});
