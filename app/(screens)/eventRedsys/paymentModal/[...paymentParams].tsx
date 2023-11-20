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
          <body class="body" onload="document.forms[0].submit();">
            <h1>Carregant...</h1>
            <p>Si no ets redireccionat a la pantalla de pagament automàticament, clica el següent botó.</p>
            <form action="${formUrl}" method="post">
              <input type="hidden" name="Ds_MerchantParameters" value="${Ds_MerchantParameters}" />
              <input type="hidden" name="Ds_Signature" value="${Ds_Signature}" />
              <input type="hidden" name="Ds_SignatureVersion" value="${Ds_SignatureVersion}" />
              <input class="submitBtn" type="submit" value="Anar-hi" />
            </form>
          </body>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 5dvh 0;
              display: flex;
              flex-flow: column;
              align-items: center;
              font-size: 2rem;
            }
            p {
              margin: 1dvh 15dvw 0;
              font-size: 2.4rem;
              text-align: center;
            }
            .submitBtn {
              margin-top: 2.2dvh;
              font-size: 1.6rem;
            }
          </style>
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
