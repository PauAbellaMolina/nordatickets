import { Text, View } from '../../../../components/Themed';
import GoBackArrow from '../../../../components/GoBackArrow';
import { StyleSheet, useColorScheme } from 'react-native';
import { useSupabase } from '../../../../context/SupabaseProvider';
import Colors from '../../../../constants/Colors';

export default function HelpAndTermsScreen() {
  const theme = useColorScheme() ?? 'light';
  const { i18n } = useSupabase();

  return (
    <View style={styles.container}>
      <GoBackArrow light={theme === 'dark'} />
      <Text style={styles.title}>{ i18n?.t('helpAndFaqs') }</Text>
      <View style={styles.wrapper}>
        <Text>{ i18n?.t('getInContactExplanation') }</Text>
        <View style={{display: 'flex', flexDirection: 'row'}}><Text>{ i18n?.t('sendAnEmailTo') } </Text><Text style={{textDecorationLine: 'underline'}}>help@elteutikt.com</Text></View>
        <View style={[styles.separator, {backgroundColor: Colors[theme].separatorBackgroundColor}]} />
        <Text style={styles.subtitle}>FAQs:</Text>
        <Text style={styles.question}>How do I buy a ticket?</Text>
        <Text style={styles.answer}>To buy a ticket, you must first create an account. Once you have an account, you can add tickets to your cart and proceed to checkout.</Text>
        <Text style={styles.question}>How do I activate a ticket?</Text>
        <Text style={styles.answer}>To activate a ticket, you must first buy it. Once you have bought a ticket, you can activate it from the wallet screen.</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 75,
    paddingBottom: 25,
    paddingHorizontal: 15,
    flex: 1,
    overflow: 'scroll'
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold'
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  question: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10
  },
  answer: {
    marginHorizontal: 10,
  },
  wrapper: {
    marginTop: 30,
    marginHorizontal: 2,
    display: 'flex',
    gap: 10
  },
  separator: {
    marginVertical: 5,
    height: 1
  },
});