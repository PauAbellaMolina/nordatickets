import { useEffect, useState } from 'react';
import { Text, View } from './Themed';
import { TicketFormSubmit, TicketFormTemplate } from '../types/supabaseplain';
import { supabase } from '../supabase';
import { TextInput, StyleSheet, Pressable } from 'react-native';
import { useSupabase } from '../context/SupabaseProvider';
import Colors from '../constants/Colors';
import { formatDateInput, isValidDate, isValidEmail } from '../utils/formValidationUtils';

export default function EventAccessTicketCardFormComponent({ event_id, ticket_form_templates_id, onSubmit, formSubmitted }: { event_id: number, ticket_form_templates_id: number, onSubmit: (ticketFormSubmit: Partial<TicketFormSubmit>) => void, formSubmitted: boolean }) {
  const { i18n, theme } = useSupabase();
  
  const [ticketFormTemplate, setTicketFormTemplate] = useState<TicketFormTemplate>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [attemptedSubmit, setAttemptedSubmit] = useState<boolean>(false);

  useEffect(() => {
    let unmounted = false;

    supabase.from('ticket_form_templates').select().eq('id', ticket_form_templates_id).single()
    .then(({ data: ticket_form_template, error }) => {
      if (error || !ticket_form_template) return;
      setTicketFormTemplate(ticket_form_template);
    });

    return () => {
      unmounted = true;
    };
  }, [ticket_form_templates_id]);

  useEffect(() => {
    if (!formSubmitted) {
      setFormData({});
      setAttemptedSubmit(false);
    }
  }, [formSubmitted]);

  const onPressSubmit = () => {
    if (formSubmitted) {
      return;
    }
    setAttemptedSubmit(true);

    const requiredFields = Object.entries(ticketFormTemplate)
    .filter(([key, value]) => key.startsWith('q') && !key.includes('_') && ticketFormTemplate[`${key}_required`])
    .map(([key]) => key);
    const missingFields = requiredFields.filter(field => !formData[field]);

    const invalidDateFields = Object.entries(ticketFormTemplate)
    .filter(([key, value]) => key.startsWith('q') && !key.includes('_') && ticketFormTemplate[`${key}_type`] === 'DATE')
    .map(([key]) => key)
    .filter(key => formData[key] && !isValidDate(formData[key]));

    const invalidEmailFields = Object.entries(ticketFormTemplate)
    .filter(([key, value]) => key.startsWith('q') && !key.includes('_') && ticketFormTemplate[`${key}_type`] === 'EMAIL')
    .map(([key]) => key)
    .filter(key => formData[key] && !isValidEmail(formData[key]));

    if (missingFields.length > 0 || invalidDateFields.length > 0 || invalidEmailFields.length > 0) {
      return;
    }

    const ticketFormSubmit: Partial<TicketFormSubmit> = {
      entries: Object.entries(formData).flatMap(([key, value]) => [ticketFormTemplate[key], value]),
      event_id: event_id,
      tickets_form_templates_id: ticket_form_templates_id
    };
    onSubmit(ticketFormSubmit);
  };

  const renderInput = (key: string, question: string, type: string, required: boolean, options: string[] | null, formSubmitted: boolean) => {
    const isRequired = required ? ' *' : '';
    const maxLength = ticketFormTemplate[`${key}_max_length`] as number | undefined;

    const getKeyboardType = () => {
      switch (type) {
        case 'TEXT':
          return 'default';
        case 'NUMBER':
          return 'numeric';
        case 'EMAIL':
          return 'email-address';
        case 'DATE':
          return 'numeric';
        default:
          return 'default';
      }
    };

    const handleInputChange = (text: string) => {
      let formattedText = text.replace(/[<>&]/g, '');
      if (type === 'DATE') {
        formattedText = formatDateInput(formattedText);
      }
      setFormData(prev => ({ ...prev, [key]: formattedText }));
    };
    
    return (
      <View key={key} style={styles.questionContainer}>
        <Text style={styles.questionText}>{question}{isRequired}</Text>
        <TextInput
          style={[
          styles.input,
          { color: Colors[theme].text, borderColor: Colors[theme].inputBorderColor },
          (attemptedSubmit && required && !formData[key]) ||
          (type === 'DATE' && formData[key] && !isValidDate(formData[key])) ||
          (type === 'EMAIL' && formData[key] && !isValidEmail(formData[key])) 
            ? styles.inputError : null,
          formSubmitted ? styles.submittedInput : null
        ]}
          editable={!formSubmitted}
          placeholder={type === 'DATE' ? new Date().toLocaleDateString('es-ES') : i18n?.t('enterYourAnswer')}
          placeholderTextColor={Colors[theme].text+'99'}
          keyboardType={getKeyboardType()}
          value={formData[key] || ''}
          onChangeText={handleInputChange}
          maxLength={type === 'DATE' ? 10 : maxLength}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      { ticketFormTemplate && Object.entries(ticketFormTemplate)
        .filter(([key]) => key.startsWith('q') && !key.includes('_'))
        .map(([key, question]) => {
          const type = ticketFormTemplate[`${key}_type`];
          const required = ticketFormTemplate[`${key}_required`];
          const options = ticketFormTemplate[`${key}_options`];
          return renderInput(key, String(question), type, required, options, formSubmitted);
        })
      }
      <Pressable onPress={onPressSubmit} style={[styles.submitButton, { backgroundColor: Colors[theme].oppositeBackgroundHalfOpacity, opacity: formSubmitted ? 0.5 : 1 }]}>
        <Text style={[styles.submitButtonText, { color: Colors[theme].text }]}>{i18n?.t('addToCart')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10
  },
  questionContainer: {
    flexBasis: '48%',
    flexGrow: 1
  },
  questionText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5
  },
  input: {
    maxWidth: 350,
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    fontSize: 14
  },
  submittedInput: {
    borderColor: 'transparent',
    fontWeight: 'bold'
  },
  inputError: {
    borderColor: 'red',
    borderWidth: 1
  },
  submitButton: {
    width: '100%',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: 'bold'
  }
});