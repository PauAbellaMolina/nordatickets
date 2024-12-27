import { useEffect } from 'react';
import { Pressable, StyleSheet, Platform } from 'react-native';
import { router } from 'expo-router';
// import { WebView } from 'react-native-webview'; // Install package when adding support to ios and android
import { View } from '../../../../components/Themed';
import GoBackArrow from '../../../../components/GoBackArrow';
import { FeatherIcon } from '../../../../components/CustomIcons';
import Colors from '../../../../constants/Colors';
import { useSupabase } from '../../../../context/SupabaseProvider';
import { useEventScreens } from '../../../../context/EventScreensProvider';

export default function PaymentModalScreen() {
  const { i18n, theme } = useSupabase();
  const { eventBackgroundColor, formUrl, Ds_MerchantParameters, Ds_Signature, Ds_SignatureVersion, cardNumber, expiryDate, event } = useEventScreens();

  const parsedFormUrl = formUrl.replace(/%2F/g, '/');
  const parsedDs_MerchantParameters = Ds_MerchantParameters.replace(/%2F/g, '/');
  const parsedDs_Signature = Ds_Signature.replace(/%2F/g, '/');
  const parsedDs_SignatureVersion = Ds_SignatureVersion.replace(/%2F/g, '/');
  const savedCard = !!cardNumber || !!expiryDate;

  useEffect(() => {
    const handleMessage = (messageEvent: MessageEvent) => {
      if (messageEvent.data === 'close') {
        router.navigate(`/event/${event.slug}`)
      }
    };
  
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);
  
  return (
    <View style={[styles.container, Platform.OS !== 'web' ? {marginTop: 50} : {paddingHorizontal: 10, paddingVertical: 11}]}>
      { Platform.OS === 'web' ? <>
        <View style={styles.fakeBackground}>
          <View style={[styles.eventInfoContainer, {backgroundColor: eventBackgroundColor}]}>
            <GoBackArrow />
          </View>
        </View>
        <Pressable onPress={() => router.navigate(`/event/${event.slug}`)} style={styles.closeBttnWeb}>
          <FeatherIcon name="x" size={30} color={Colors[theme].text} />
        </Pressable>
        <iframe
          allow="payment https://sis-t.redsys.es"
          style={styles.iframe}
          srcDoc={`
            <html>
              <body onload='${ savedCard ? 'document.forms[0].submit();' : null }'>
                <h1>${ savedCard ? (i18n?.t('loading') + '...') : i18n?.t('payment') }</h1>
                <p>${ savedCard ? i18n?.t('clickIfNoRedirectExplanation') : i18n?.t('clickToGoToPaymentExplanation') }</p>
                <form action='${parsedFormUrl}' method='post' target='${ savedCard ? '_self' : '_blank' }'>
                  <input type='hidden' name='Ds_MerchantParameters' value='${parsedDs_MerchantParameters}' />
                  <input type='hidden' name='Ds_Signature' value='${parsedDs_Signature}' />
                  <input type='hidden' name='Ds_SignatureVersion' value='${parsedDs_SignatureVersion}' />
                  <input class='submitBtn' type='submit' value='${ i18n?.t('goToPaymentScreenBtn') }' />
                </form>
              </body>
              <script>
                document.forms[0].addEventListener('submit', () => {
                  setTimeout(() => {
                    window.parent.postMessage('close', 'https://nordatickets.com');
                  }, 1000);
                });
              </script>
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
                  font-size: .9rem;
                  border-radius: 10px;
                  min-width: 100px;
                  min-height: 35px;
                }
              </style>
            </html>
          `}
        >
        </iframe>
      </>:<>
        {/* Uncomment when adding support to ios and android */}
        {/* <WebView
          enableApplePay={true}
          containerStyle={styles.containerStyle}
          source={{ html: `
            <body onload="document.forms[0].submit();">
              <h1>${ i18n?.t('loading') } ...</h1>
              <p>${ i18n?.t('clickIfNoRedirectExplanation') }</p>
              <form action="${parsedFormUrl}" method="post">
                <input type="hidden" name="Ds_MerchantParameters" value="${parsedDs_MerchantParameters}" />
                <input type="hidden" name="Ds_Signature" value="${parsedDs_Signature}" />
                <input type="hidden" name="Ds_SignatureVersion" value="${parsedDs_SignatureVersion}" />
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
        /> */}
      </>}
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
    ...Platform.select({
      web: {
        filter: 'blur(3px)'
      }
    })
  },
  eventInfoContainer: {
    height: 180,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderRadius: 35,
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 2.5px rgba(0, 0, 0, 0.1)'
      }
    })
  }
});
