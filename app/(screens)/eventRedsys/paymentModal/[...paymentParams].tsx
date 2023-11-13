import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams } from 'expo-router';
import { View } from '../../../../components/Themed';

export default function ActivateTicketScreen() {
  const { paymentParams } = useLocalSearchParams();
  const formUrl = paymentParams[0].replace(/%2F/g, '/');
  const Ds_MerchantParameters = paymentParams[1].replace(/%2F/g, '/');
  const Ds_Signature = paymentParams[2].replace(/%2F/g, '/');
  const Ds_SignatureVersion = paymentParams[3].replace(/%2F/g, '/');

  useEffect(() => {
    console.log('formUrl', formUrl);
    console.log('Ds_MerchantParameters', Ds_MerchantParameters);
    console.log('Ds_Signature', Ds_Signature);
    console.log('Ds_SignatureVersion', Ds_SignatureVersion);
  }, []);
  
  return (
    <View style={styles.container}>
      <WebView
        containerStyle={styles.containerStyle}
        source={{ html: `
          <body onload="document.forms[0].submit();">
            <form action="${formUrl}" method="post">
              <input type="hidden" name="Ds_MerchantParameters" value="${Ds_MerchantParameters}" />
              <input type="hidden" name="Ds_Signature" value="${Ds_Signature}" />
              <input type="hidden" name="Ds_SignatureVersion" value="${Ds_SignatureVersion}" />
              <input type="submit" value="Submit" />
            </form>
          </body>
        ` }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 50,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    // padding: 25,
    // paddingBottom: 40
  },
  containerStyle: {
    width: '100%',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25
  }
});
