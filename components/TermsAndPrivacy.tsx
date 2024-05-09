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
        <Text>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer diam ante, congue sit amet rutrum ac, laoreet ac ex. Sed tortor ante, semper in dui ut, aliquet imperdiet erat. Aliquam nec rutrum est. Cras feugiat dolor a sem sollicitudin consequat. Proin posuere, urna sit amet ornare gravida, tortor est suscipit odio, sit amet scelerisque mauris nisl id magna. Sed ac ultrices mi. Nunc eget turpis bibendum, molestie mi ac, molestie magna. Integer sit amet varius leo. Nam non est vitae odio tincidunt fermentum.</Text>
        <Text>Aenean mollis egestas nulla ut feugiat. Ut ut accumsan ligula. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Integer feugiat leo id risus ullamcorper, sed pulvinar est pulvinar. Ut congue orci ante, vitae tincidunt tellus volutpat nec. Vestibulum ac purus eu magna fringilla efficitur et at quam. Quisque vitae enim vitae ex sodales mattis. Mauris nec nisl eu neque fermentum suscipit facilisis in eros. Donec luctus eleifend faucibus. Pellentesque interdum diam et malesuada laoreet. Cras viverra nulla magna, at luctus lectus mattis nec. Integer rutrum diam eget lorem lobortis malesuada. Aliquam pulvinar lacus metus, facilisis ultrices sapien suscipit eget. Phasellus sed volutpat mi. Quisque vitae imperdiet odio. Sed elementum, libero non condimentum mattis, elit lorem tristique risus, a pulvinar quam nibh eu nisl.</Text>
        <Text>Ut augue dui, hendrerit eu commodo id, convallis in massa. Nullam nec leo quam. Suspendisse non lacus lorem. Aliquam erat volutpat. Nulla vel dictum lectus. Duis nec orci consequat, tempor massa a, sagittis augue. Etiam mi diam, maximus quis magna quis, rhoncus ultrices dui. Proin lacinia, nisl vel porttitor porttitor, ipsum dolor faucibus mi, ac consequat nisi nunc vel diam.</Text>
        <Text>Aliquam viverra risus quis augue scelerisque, in lacinia risus feugiat. Phasellus imperdiet dictum odio, a venenatis felis dictum eget. Duis tempus sollicitudin lobortis. Aenean tortor libero, rhoncus ut pretium nec, dignissim quis magna. Curabitur molestie semper est quis accumsan. Morbi vitae est blandit, aliquet nunc in, semper metus. Aliquam sollicitudin bibendum lacus vel porttitor. In sollicitudin, magna eu lobortis porttitor, ipsum eros condimentum augue, at elementum sem ipsum sit amet augue. Proin ac libero quis nulla eleifend tempor sed sed neque. Morbi lacinia purus et dolor pharetra, ut commodo ex ultrices. Donec tristique malesuada eros ut vehicula. Integer hendrerit purus sed arcu volutpat, sit amet bibendum est vulputate. Praesent augue ante, egestas ut ornare malesuada, fringilla pharetra risus.</Text>
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