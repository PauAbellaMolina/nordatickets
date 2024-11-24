import { useEffect, useState } from 'react';
import { Text, View } from './Themed';
import { TicketFormSubmit, TicketFormTemplate } from '../types/supabaseplain';
import { supabase } from '../supabase';
import { TextInput, StyleSheet, Pressable, InputModeOptions } from 'react-native';
import { useSupabase } from '../context/SupabaseProvider';
import Colors from '../constants/Colors';
import { formatDateInput, isValidDate, isValidEmail, isValidNumber } from '../utils/formValidationUtils';
import { Picker } from '@react-native-picker/picker';

export default function EventAccessTicketCardFormComponent({ event_id, ticket_form_templates_id, formSubmitted, onPriceMultiplierChange, onSubmit }: { event_id: number, ticket_form_templates_id: number, formSubmitted: boolean, onPriceMultiplierChange: (priceMultiplier: number) => void, onSubmit: (ticketFormSubmit: Partial<TicketFormSubmit>) => void }) {
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

    const invalidNumberFields = Object.entries(ticketFormTemplate)
    .filter(([key, value]) => key.startsWith('q') && !key.includes('_') && ticketFormTemplate[`${key}_type`] === 'NUMBER')
    .map(([key]) => key)
    .filter(key => formData[key] && !isValidNumber(formData[key], ticketFormTemplate[`${key}_max_value`]));

    const invalidDateFields = Object.entries(ticketFormTemplate)
    .filter(([key, value]) => key.startsWith('q') && !key.includes('_') && ticketFormTemplate[`${key}_type`] === 'DATE')
    .map(([key]) => key)
    .filter(key => formData[key] && !isValidDate(formData[key]));

    const invalidEmailFields = Object.entries(ticketFormTemplate)
    .filter(([key, value]) => key.startsWith('q') && !key.includes('_') && ticketFormTemplate[`${key}_type`] === 'EMAIL')
    .map(([key]) => key)
    .filter(key => formData[key] && !isValidEmail(formData[key]));

    if (missingFields.length > 0 || invalidNumberFields.length > 0 || invalidDateFields.length > 0 || invalidEmailFields.length > 0) {
      return;
    }

    const ticketFormSubmit: Partial<TicketFormSubmit> = {
      entries: Object.entries(formData).flatMap(([key, value]) => [ticketFormTemplate[key], value]),
      event_id: event_id,
      tickets_form_templates_id: ticket_form_templates_id
    };
    onSubmit(ticketFormSubmit);
  };

  const renderDropdown = (key: string, required: boolean, options: string[], formSubmitted: boolean) => {
    return (
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={formData[key] || ''}
          onValueChange={(itemValue) => itemValue !== 'misc' && setFormData(prev => ({ ...prev, [key]: itemValue }))}
          enabled={!formSubmitted}
          style={[
            styles.optionsPicker,
            { color: Colors[theme].text },
            (attemptedSubmit && required && !formData[key]) ? styles.inputError : null,
            formSubmitted ? styles.submittedInput : null
          ]}
        >
          <Picker.Item label={ i18n?.t('selectAnOption') } value="misc" />
          {options.map((option, index) => (
            <Picker.Item key={index} label={option} value={option} />
          ))}
        </Picker>
      </View>
    );
  };

  const renderInput = (key: string, question: string, type: string, required: boolean, options: string[] | null, multipliesTicketPrice: boolean, formSubmitted: boolean) => {
    const isRequired = required ? ' *' : '';
    const maxValue = ticketFormTemplate[`${key}_max_value`] as number | undefined;

    const getKeyboardType = (): InputModeOptions => {
      switch (type) {
        case 'TEXT':
          return 'text';
        case 'NUMBER':
          return 'numeric';
        case 'EMAIL':
          return 'email';
        case 'DATE':
          return 'numeric';
        default:
          return 'text';
      }
    };

    const handleInputChange = (text: string) => {
      let formattedText = text.replace(/[<>&]/g, '');
      if (type === 'DATE') {
        formattedText = formatDateInput(formattedText);
      }
      if (type === 'NUMBER' && multipliesTicketPrice && isValidNumber(formattedText) && Number(formattedText) > 0) {
        onPriceMultiplierChange(Number(formattedText));
      }
      setFormData(prev => ({ ...prev, [key]: formattedText }));
    };

    if (type === 'OPTIONS' && options) {
      return (
        <View key={key} style={styles.questionContainer}>
          <Text style={styles.questionText}>{question}{isRequired}</Text>
          {renderDropdown(key, required, options, formSubmitted)}
        </View>
      );
    }
    
    return (
      <View key={key} style={styles.questionContainer}>
        <Text style={styles.questionText}>{question}{isRequired}</Text>
        <TextInput
          style={[
          styles.input,
          { color: Colors[theme].text, borderColor: Colors[theme].inputBorderColor },
          (attemptedSubmit && required && !formData[key]) ||
          (type === 'DATE' && formData[key] && !isValidDate(formData[key])) ||
          (type === 'EMAIL' && formData[key] && !isValidEmail(formData[key])) ||
          (type === 'NUMBER' && formData[key] && !isValidNumber(formData[key], maxValue))
            ? styles.inputError : null,
          formSubmitted ? styles.submittedInput : null
        ]}
          textContentType={type === 'EMAIL' ? 'emailAddress' : 'none'}
          editable={!formSubmitted}
          placeholder={type === 'DATE' ? new Date().toLocaleDateString('es-ES') : i18n?.t('enterYourAnswer')}
          placeholderTextColor={Colors[theme].text+'99'}
          inputMode={getKeyboardType()}
          value={formData[key] || ''}
          onChangeText={handleInputChange}
          maxLength={type === 'DATE' ? 10 : type === 'NUMBER' ? 25 : maxValue}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      { ticketFormTemplate && Object.entries(ticketFormTemplate)
        .filter(([key, question]) => key.startsWith('q') && !key.includes('_') && typeof question === 'string' && question.length)
        .map(([key, question]) => {
          const type = ticketFormTemplate[`${key}_type`];
          const required = ticketFormTemplate[`${key}_required`];
          const options = ticketFormTemplate[`${key}_options`];
          const multipliesTicketPrice = ticketFormTemplate[`${key}_multiplies_ticket_price`];
          return renderInput(key, String(question), type, required, options, multipliesTicketPrice, formSubmitted);
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
    borderWidth: StyleSheet.hairlineWidth,
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
    borderWidth: StyleSheet.hairlineWidth
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
  },
  pickerContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    maxWidth: 350
  },
  optionsPicker: {
    maxWidth: 350,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    backgroundColor: 'transparent'
  },
});