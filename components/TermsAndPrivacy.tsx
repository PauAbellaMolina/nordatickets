import { Text, View } from './Themed';
import GoBackArrow from './GoBackArrow';
import { StyleSheet } from 'react-native';
import { useSupabase } from '../context/SupabaseProvider';

export default function TermsAndPrivacy() {
  const { i18n, theme } = useSupabase();

  return (
    <View style={styles.container}>
      <GoBackArrow light={theme === 'dark'} />
      <Text style={styles.title}>{ i18n?.t('termsAndPrivacy') }</Text>
      <View style={styles.wrapper}>
        <Text style={styles.subtitle}>{ i18n?.t('legalNotice') }:</Text>
        <a style={styles.link} href="https://waniuunkeiqwqatzunof.supabase.co/storage/v1/object/public/legal_documents/AVISO%20LEGAL.pdf?t=2024-08-03T09%3A39%3A19.871Z" target="_blank">Aviso Legal</a>
        <Text style={styles.subtitle}>{ i18n?.t('privacyPolicy') }:</Text>
        <a style={styles.link} href="https://waniuunkeiqwqatzunof.supabase.co/storage/v1/object/public/legal_documents/POLITICA%20DE%20PRIVACIDAD.pdf?t=2024-08-03T09%3A40%3A14.783Z" target="_blank">Politica de Privacidad</a>
        <Text style={styles.subtitle}>{ i18n?.t('cookiePolicy') }:</Text>
        <a style={styles.link} href="https://waniuunkeiqwqatzunof.supabase.co/storage/v1/object/public/legal_documents/POLITICA%20DE%20COOKIES.pdf?t=2024-08-03T09%3A40%3A43.683Z" target="_blank">Politica de Cookies</a>
        <Text style={styles.subtitle}>{ i18n?.t('generalConditions') }:</Text>
        <a style={styles.link} href="https://waniuunkeiqwqatzunof.supabase.co/storage/v1/object/public/legal_documents/CONDICIONES%20GENERALES%20DE%20CONTRATACION.pdf?t=2024-08-03T09%3A40%3A52.234Z" target="_blank">Condiciones Generales de Contratación</a>
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
  link: {
    marginLeft: 10,
    marginBottom: 10,
    color: 'lightblue',
    textDecorationLine: 'underline'
  },
  wrapper: {
    marginTop: 30,
    marginHorizontal: 5,
    display: 'flex',
    gap: 10
  },
  separator: {
    marginVertical: 5,
    height: 1,
    width: '80%'
  },
});