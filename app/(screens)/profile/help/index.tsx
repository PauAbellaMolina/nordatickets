import { Text, View } from '../../../../components/Themed';
import GoBackArrow from '../../../../components/GoBackArrow';
import { ActivityIndicator, FlatList, StyleSheet } from 'react-native';
import { useSupabase } from '../../../../context/SupabaseProvider';
import Colors from '../../../../constants/Colors';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../../supabase';

type Faq = {
  question: string;
  answer: string;
};

export default function HelpAndTermsScreen() {
  const { i18n, theme, user } = useSupabase();
  
  const [faqs, setFaqs] = useState<Faq[] | null>(null);

  useEffect(() => {
    if (!user) return;
    let unmounted = false;
    supabase.from('faqs').select('question, answer').eq('language', i18n.locale).order('order').then(({ data, error }) => {
      if (error || unmounted) return;
      setFaqs(data as Faq[]);
    });

    return () => {
      unmounted = true;
    };
  }, [user]);

  const renderItemFaqs = useCallback(({item}: {item: Faq}) => (
    <>
      <Text style={style.question}>{item.question}</Text>
      <Text style={style.answer}>{item.answer}</Text>
    </>
  ), [faqs]);

  const style = styles(theme);

  return (
    <View style={style.container}>
      <GoBackArrow light={theme === 'dark'} />
      <Text style={style.title}>{ i18n?.t('helpAndFaqs') }</Text>
      <View style={style.wrapper}>
        <Text>{ i18n?.t('getInContactExplanation') }</Text>
        <View style={{display: 'flex', flexDirection: 'row'}}><Text>{ i18n?.t('sendAnEmailTo') } </Text><Text style={{textDecorationLine: 'underline'}}>help@nordatickets.com</Text></View>
        <View style={style.separator} />
        <Text style={style.subtitle}>FAQs:</Text>
        { !faqs ? 
          <ActivityIndicator size="small" style={{marginTop: 50}} />
        :
          <FlatList
            data={faqs}
            keyExtractor={(_, index) => index.toString()}
            renderItem={renderItemFaqs}
          />
        }
      </View>
    </View>
  );
};

const styles = (theme: string) => StyleSheet.create({
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
    marginTop: 18,
    marginBottom: 8
  },
  answer: {
    marginLeft: 8,
    marginRight: 14,
    textAlign: 'justify'
  },
  wrapper: {
    marginTop: 30,
    marginHorizontal: 2,
    display: 'flex',
    gap: 10
  },
  separator: {
    marginVertical: 5,
    height: 1,
    backgroundColor: Colors[theme].separatorBackgroundColor
  }
});