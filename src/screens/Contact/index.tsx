// Ported from: src/pages/contact/contact.html + .ts + .scss
import React, { useEffect, useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { db } from '../../api/client';
import { WebEmbed } from '../../components/WebEmbed';
import { IonContent } from '../../components/ionic/IonContent';
import { IonHeader, IonNavbar } from '../../components/ionic/IonNavbar';
import { Text } from '../../components/ionic/IonText';
import { MaterialIcon } from '../../components/ionic/MaterialIcon';
import { textStyle } from '../../components/ionic/text';
import { client } from '../../config/client';
import { activeNavNames } from '../../navigation/navigationRef';
import { collapseWs } from '../../ui/angularPipes';
import { md } from '../../theme/ionicMd';
import { styles } from './styles';

// app.getActiveNav() page names that contact.ts:52-62 looks for, without the 'Page' suffix.
const ROOT_PAGES = ['Home', 'GiftList', 'Transaction', 'Profile', 'MainHome'];

interface Props {
  navigation: {
    addListener?: (type: 'blur', cb: () => void) => () => void;
    getState?: () => any;
    popToTop?: () => void;
  };
  route?: { params?: object };
}

// NOTE (parity): contact.ts:28-29 constructor `if (dbService.connection == 'offline') { onShowMessageAlertHandler('Offline ! Please Connect To An
// Active Internet Connection'); navCtrl.setRoot(HomePage) }`: dbService.connection is declared but never assigned in the Ionic app, so the
// guard is dead and is not ported (same as Home/MainHome/OfferList). userCountry (:11, :23) and go_to_map() (:38-45, no caller: the template has
// no button for it) are dead too. contact.module.ts has its own TranslateModule.forRoot but the page never calls use(): global i18n.
export default function ContactScreen({ navigation }: Props) {
  const { t } = useTranslation(); // re-renders on i18n.changeLanguage, like the `| translate` pipe
  const usertype = db.userStorageData?.type; // :22 this.usertype = dbService.userStorageData.type
  const [viewport, setViewport] = useState(0);

  // :47-67 ionViewDidLeave. React Navigation's 'blur' fires on a push over this screen and on a tab switch, like Ionic's didLeave.
  // NOTE (parity): when the nav that is active after leaving shows one of the root pages (and its previous page is not one of them),
  // this.navCtrl.popToRoot() resets this page's own stack. At a stack root popToRoot does nothing.
  useEffect(() => {
    if (!navigation.addListener) {
      return undefined;
    }
    return navigation.addListener('blur', () => {
      const names = activeNavNames();
      if (names && ROOT_PAGES.includes(names.active) && !ROOT_PAGES.includes(names.previous)) {
        const stack = navigation.getState?.();
        if (stack && stack.routes.length > 1) {
          try {
            navigation.popToTop?.();
          } catch {
            // nothing to pop
          }
        }
      }
    });
  }, [navigation]);

  const linkText = textStyle(14, 400, md.linkColor);
  const isPlumber = usertype == 'Plumber'; // eslint-disable-line eqeqeq

  return (
    <View style={styles.screen}>
      {/* html:2-6 `<ion-header class="main-header" [ngClass]="{'remove': usertype == 'Plumber'}">` + plain `<ion-navbar>` */}
      <IonHeader mainHeader remove={isPlumber}>
        <IonNavbar title={collapseWs(t('Contact Us'))} />
      </IonHeader>

      {/* html:9-40 */}
      <IonContent onLayout={e => setViewport(e.nativeEvent.layout.height)}>
        <View testID="contact-body" style={{ height: viewport }}>
          {/* html:12 `<iframe src=... width="100%" height="100%" style="border:0;" allowfullscreen loading="lazy">` */}
          <WebEmbed testID="contact-map" uri={client.contact.mapEmbedUrl} height="100%" border="none" iframe />
          {/* html:13-37 */}
          {/* .map-add is absolutely positioned without left/right: shrink-to-fit, at most the content width minus its 16px margins */}
          <View testID="contact-map-add-box" style={styles.mapAddBox} pointerEvents="box-none">
          <View testID="contact-map-add" style={styles.mapAdd}>
            {/* html:16-22 */}
            <View style={styles.li}>
              <MaterialIcon name="room" size={24} color={md.textColor} style={styles.icon} />
              {/* NOTE (parity): the template appends a literal "." after the interpolation */}
              <Text testID="contact-address" style={[textStyle(14, 400, md.textColor), styles.p]}>
                {collapseWs(t(client.contact.addressKey)) + '.'}
              </Text>
            </View>
            {/* html:23-29 `<a href="tel:8655050950">` */}
            <View style={styles.li}>
              <Pressable testID="contact-tel" style={styles.anchor} onPress={() => Linking.openURL(`tel:${client.contact.phone}`)}>
                <MaterialIcon name="call" size={24} color={md.linkColor} style={styles.icon} />
                <Text style={linkText}>{collapseWs(client.contact.phoneDisplay).trim()}</Text>
              </Pressable>
            </View>
            {/* html:32-36 `<a href="mailto:..." target="_blank">` */}
            <View style={[styles.li, styles.liLast]}>
              <Pressable testID="contact-mail" style={styles.anchor} onPress={() => Linking.openURL(`mailto:${client.contact.email}`)}>
                <MaterialIcon name="email" size={24} color={md.linkColor} style={styles.icon} />
                <Text style={linkText}>{client.contact.email}</Text>
              </Pressable>
            </View>
          </View>
          </View>
        </View>
        {/* NOTE (parity): descender gap below the inline iframe, outside the body so .map-add stays bottom-aligned */}
        <View testID="contact-gap" style={{ height: 4 }} />
      </IonContent>
    </View>
  );
}
