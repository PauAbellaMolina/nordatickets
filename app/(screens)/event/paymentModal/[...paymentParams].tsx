import { Button, Pressable, StyleSheet, useColorScheme } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { View } from '../../../../components/Themed';
import GoBackArrow from '../../../components/goBackArrow';
import { FeatherIcon } from '../../../components/icons';
import Colors from '../../../../constants/Colors';

export default function PaymentModalScreen() {
  const theme = useColorScheme() ?? 'light';
  const { paymentParams } = useLocalSearchParams();
  const eventId = paymentParams[0];
  const eventBackgroundColorIndex = +paymentParams[1];
  const formUrl = paymentParams[2].replace(/%2F/g, '/');
  const Ds_MerchantParameters = paymentParams[3].replace(/%2F/g, '/');
  const Ds_Signature = paymentParams[4].replace(/%2F/g, '/');
  const Ds_SignatureVersion = paymentParams[5].replace(/%2F/g, '/');
  
  return (
    <View style={[styles.container, Platform.OS !== 'web' ? {marginTop: 50} : {paddingHorizontal: 15, paddingVertical: 20}]}>
      { Platform.OS === 'web' ? <>
        <View style={styles.fakeBackground}>
          <View style={[styles.eventInfoContainer, {backgroundColor: Colors.eventBackgroundColorsArray[theme][eventBackgroundColorIndex]}]}>
            <GoBackArrow />
          </View>
        </View>
        <Pressable onPress={() => router.push(`/event/${eventId}`)} style={styles.closeBttnWeb}>
          <FeatherIcon name="x" size={30} color={Colors[theme].text} />
        </Pressable>
        <iframe 
            style={styles.iframe}
            srcDoc={`
              <html>
                <body onload='document.forms[0].submit();'>
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
                    background-color: #fff;
                  }
                  p {
                    margin: 1dvh 15dvw 0;
                    text-align: center;
                  }
                  .submitBtn {
                    margin-top: 2.5dvh;
                    font-size: .85rem;
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
            <body onload="document.forms[0].submit();">
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
              }
              p {
                margin: 1dvh 15dvw 0;
                text-align: center;
              }
              .submitBtn {
                margin-top: 2.2dvh;
                font-size: .85rem;
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
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start'
  },
  containerStyle: {
    width: '100%',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25
  },
  closeBttnWeb: {
    marginBottom: 5,
    display: 'flex',
    flexDirection: 'row',
    alignSelf: 'flex-end',
    alignItems: 'center',
    gap: 5
  },
  iframe: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
    borderWidth: 0
  },
  fakeBackground: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    zIndex: -1,
    top: 0,
    filter: 'blur(3px)'
  },
  eventInfoContainer: {
    height: 180,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderRadius: 35,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.10,
    shadowRadius: 2.5,
    elevation: 10
  }
});
