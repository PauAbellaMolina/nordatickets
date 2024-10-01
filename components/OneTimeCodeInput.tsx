import React, { useRef, useState } from 'react';
import { View, TextInput, StyleSheet, ColorSchemeName } from 'react-native';
import Colors from '../constants/Colors';

interface OneTimeCodeInputProps {
  value: string;
  onChange: (code: string) => void;
  theme: ColorSchemeName;
  errorState: boolean;
}

export default function OneTimeCodeInput({ value, onChange, theme, errorState }: OneTimeCodeInputProps) {
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const [focusedIndex, setFocusedIndex] = useState(0);

  const handleChange = (text: string, index: number) => {
    const newCode = value.split('');
    newCode[index] = text.replace(/[<>&]/g, '');
    const newCodeString = newCode.join('');
    const actualIndex = newCodeString.length;
    onChange(newCodeString);

    if (text && actualIndex < 6) {
      inputRefs.current[actualIndex]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.container}>
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <TextInput
          key={index}
          ref={(ref) => (inputRefs.current[index] = ref)}
          style={[
            styles.input,
            {
              color: Colors[theme].text + (!value[index] ? 'B3' : ''),
              backgroundColor: focusedIndex === index ? Colors[theme].inputFocusedBackgroundColor : Colors[theme].inputBackgroundColor,
              borderColor: errorState ? '#ff3737' : Colors[theme].inputBorderColor,
              borderWidth: focusedIndex === index ? 2 : 1
            }
          ]}
          value={value[index] || ''}
          onChangeText={(text) => handleChange(text, index)}
          onKeyPress={(e) => handleKeyPress(e, index)}
          onFocus={() => setFocusedIndex(index)}
          onBlur={() => setFocusedIndex(-1)}
          maxLength={1}
          keyboardType="numeric"
          textContentType="oneTimeCode"
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    gap: 7,
  },
  input: {
    width: 38,
    height: 46,
    borderRadius: 10,
    fontSize: 22,
    textAlign: 'center',
    pointerEvents: 'box-only',
    borderWidth: 1,
  },
});
