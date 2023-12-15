import { Button, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { View } from '../../../../components/Themed';

export default function PaymentModalScreen() {
  const { paymentParams } = useLocalSearchParams();
  const eventId = paymentParams[0];
  const formUrl = paymentParams[1].replace(/%2F/g, '/');
  const Ds_MerchantParameters = paymentParams[2].replace(/%2F/g, '/');
  const Ds_Signature = paymentParams[3].replace(/%2F/g, '/');
  const Ds_SignatureVersion = paymentParams[4].replace(/%2F/g, '/');
  
  return (
    <View style={styles.container}>
      { Platform.OS === 'web' ? <>
        <Button title="Tornar" onPress={() => router.push(`/eventRedsys/${eventId}`)} /> {/* TODO PAU keep refining these */}
        <iframe 
            style={{ width: '100%', height: '100%', border: '25px 25px 0 0' }}
            srcDoc={`
              <html>
                <body class='body' onload='document.forms[0].submit();'>
                  <h1>Carregant...</h1>
                  <p>Si no ets redireccionat a la pantalla de pagament automàticament, clica el següent botó.</p>
                  <form action='${formUrl}' method='post'>
                    <input type='hidden' name='Ds_MerchantParameters' value='${Ds_MerchantParameters}' />
                    <input type='hidden' name='Ds_Signature' value='${Ds_Signature}' />
                    <input type='hidden' name='Ds_SignatureVersion' value='${Ds_SignatureVersion}' />
                    <input class='submitBtn' type='submit' value='Anar-hi' />
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
                    background-color: #fff;
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
              </html>
            `}
          >
        </iframe>
        </>:<>
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
        /></>
      }
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
