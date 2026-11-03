// Ported from: src/pages/point-location/point-location.html + .ts + .scss (+ .module.ts)
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { db } from '../../api/client';
import { WebEmbed } from '../../components/WebEmbed';
import { IonButton } from '../../components/ionic/IonButton';
import { IonContent } from '../../components/ionic/IonContent';
import { IonFooter, IonHeader, IonNavbar } from '../../components/ionic/IonNavbar';
import { MaterialIcon } from '../../components/ionic/MaterialIcon';
import { getPosition, reverseGeocode } from '../../native';
import { buttonMd } from '../../theme/ionicMdContent';
import { showAlert, showToast } from '../../ui/overlays';
import { webAlert } from '../../ui/webAlert';
import { styles } from './styles';

interface Props {
  navigation: { reset: (state: object) => void };
  route?: { params?: { lat?: any; log?: any; old_loc?: any; mode?: any } };
}

// point-location.ts:60 / :124 the embed url
// NOTE: Google's own embed address, the same for every client (not a client-specific URL), so the lint rule is switched off for it.
// eslint-disable-next-line no-restricted-syntax
const embedUrl = (lat: any, lng: any) => 'https://maps.google.com/maps?q=' + lat + ',' + lng + '&output=embed';

export default function PointLocationScreen({ navigation, route }: Props) {
  // :28-41 fields. new_lat / new_long are read synchronously by add_loc(), so they live in refs (undefined until a fix arrived).
  const newLat = useRef<any>(undefined); // new_lat:any
  const newLong = useRef<any>(undefined); // new_long:any
  const geoAddress = useRef<any>(''); // geoAddress:any=''
  const alive = useRef(true);
  // :59-62 constructor: new_lat is undefined, so the first url is "...?q=undefined,undefined&output=embed"
  const [url, setUrl] = useState(embedUrl(undefined, undefined));
  const [isDealer, setIsDealer] = useState<any>(undefined); // isDealer:any (set in ionViewDidLoad)
  const [viewport, setViewport] = useState(0);

  // :50-67 constructor -> loadMap(), then :71-90 ionViewDidLoad (lat/log/old_loc are read but never used again; mode decides isDealer)
  // NOTE (parity): loadMap() therefore runs TWICE on entry. On a real phone the second accuracy request is refused by the plugin
  // ("A request is already in progress"), which shows the 'Allow Location Permissions' toast (the native wrapper answers the same way).
  useEffect(() => {
    alive.current = true;
    loadMap(); // constructor
    // NOTE (parity): this.latitude / longitude / old_location are only stored (the Last Location block is commented out in the template).
    setIsDealer(route?.params?.mode == 'Dealer'); // eslint-disable-line eqeqeq
    loadMap(); // ionViewDidLoad :88
    return () => {
      alive.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // :92-100 showSuccess(text)
  function showSuccess(text: string) {
    showAlert({ title: 'Success!', subTitle: text, buttons: ['OK'] });
  }

  // :102-148 loadMap()
  // locationAccuracy.request(HIGH_ACCURACY) then geolocation.getCurrentPosition() (the `options` object at :105 is never passed, so the
  // plugin defaults apply). The wrapper does both steps; a failure of the first step has a message starting with 'accuracy:'.
  async function loadMap() {
    const r = await getPosition();
    if (!r.ok) {
      if (r.message?.startsWith('accuracy:')) {
        // :138-146 accuracy request rejected
        showToast('Allow Location Permissions', { duration: 3000, position: 'bottom' });
      } else {
        // :133-136 getCurrentPosition rejected (permission denied, no fix, timeout)
        showToast('Error getting location'); // dbService.presentToast
      }
      return;
    }
    // :117-126
    newLat.current = r.value.lat;
    newLong.current = r.value.lng;
    if (newLat.current != null && alive.current) {
      setUrl(embedUrl(newLat.current, newLong.current));
    }
    // :129 getGeoencoder(): reverseGeocode(52.5072095, 13.1452818) (Berlin, hard-coded) and forwardGeocode('Berlin'); the results are only
    // console.logged, so geoAddress stays ''.
    // NOTE (parity): the hard-coded Berlin coordinates are copied; the result is ignored.
    // NOTE (parity): forwardGeocode('Berlin') has no wrapper and no effect (log only): not ported.
    reverseGeocode(52.5072095, 13.1452818);
    // :130-131 new google.maps.Map(<iframe>) + addMarker(): draws into the iframe element, which shows nothing; not ported.
  }

  // :231-263 add_loc()
  function addLoc() {
    loadMap(); // :233 (not awaited: the body below reads the coordinates of the previous fix)
    // NOTE (parity): new_lat / new_long are whatever the earlier loadMap() stored; undefined keys are dropped by JSON.stringify.
    // NOTE (parity): no loader. No error callback: after an HTTP error nothing happens.
    db.onPostRequestDataFromApi(
      { customer_id: db.userStorageData?.id, cust_lat: newLat.current, cust_long: newLong.current, cust_geo_address: geoAddress.current },
      'app_karigar/addGeoLocation',
      db.rootUrl,
    ).then(
      (result: any) => {
        try {
          if (result.status == 'failed') { // eslint-disable-line eqeqeq
            // :245 window.alert('Geo Location not found! Try Again')
            // NOTE (parity): the browser alert is a NATIVE Android dialog in cordova-android (title 'Alert', the message, OK): webAlert.
            webAlert('Geo Location not found! Try Again');
            return;
          }
          showSuccess('Geo Location updated Successfully!'); // :254
          // :257 this.navCtrl.setRoot(ProfilePage): replaces the stack this page lives in. From Profile's tab that is the Profile tab's own
          // stack (the tab bar stays); navigation.reset acts on this screen's navigator.
          navigation.reset({ index: 0, routes: [{ name: 'Profile' }] });
        } catch {
          // TypeError on a null body: uncaught error in Ionic's callback
        }
      },
      () => {},
    );
  }

  // :264-282 addDealerLocation(): dealerData/add_location on the SFA server, then presentToast("Geo Location updated!") and pop().
  // NOTE (parity): dead code. The Dealer footer button (html:39) calls loadMap(), not this; nothing calls it. Not ported.
  // :284-305 calculateAndDisplayRoute() and :212-229 generateAddress(): dead code (never called). Not ported.

  const type = db.userStorageData?.type;
  return (
    <View style={styles.screen}>
      {/* html:8-12 */}
      <IonHeader mainHeader remove>
        <IonNavbar color="primary" title="Point Location" />
      </IonHeader>

      {/* html:15-21 <ion-content class="location-map"> */}
      <IonContent onLayout={e => setViewport(e.nativeEvent.layout.height)}>
        {/* html:19 <iframe width="100%" height="100%" frameborder="0" style="border:0"> in the scroll-content, which is as tall as the content
            area. NOTE (parity): an inline iframe leaves the line box's descender gap (about 4px) below it, so the page can scroll by that
            much (verify in the parity harness). */}
        <View style={styles.mapArea}>
          {/* NOTE (parity): html:19 is an <iframe [src]=url>: the embed is loaded inside an iframe (a top-level load is refused by Google) */}
          <WebEmbed testID="pl-map" uri={url} height={viewport} border="none" iframe />
          <View style={styles.gap} />
          {/* html:20 <div (click)="loadMap()" class="map-location"><i class="material-icons">my_location</i></div> */}
          <Pressable testID="pl-my-location" style={styles.mapLocation} onPress={() => loadMap()}>
            <MaterialIcon name="my_location" />
          </Pressable>
        </View>
      </IonContent>

      {/* html:23-44 <ion-footer padding> */}
      <IonFooter padding>
        {type == 'Customer' ? ( // eslint-disable-line eqeqeq
          // html:24 .point-loc > .enquiry-btn.loction-btn > button.green-color
          <IonButton
            testID="pl-add-location"
            color="danger"
            full
            background={buttonMd.greenColorBackground}
            style={styles.locationButton}
            labelStyle={styles.locationLabel}
            onPress={addLoc}
          >
            Add location
          </IonButton>
        ) : null}
        {isDealer == true ? ( // eslint-disable-line eqeqeq
          // html:37 NOTE (parity): the Dealer button only calls loadMap(); addDealerLocation() is never wired.
          <IonButton
            testID="pl-dealer-add-location"
            color="danger"
            full
            background={buttonMd.greenColorBackground}
            style={styles.locationButton}
            labelStyle={styles.locationLabel}
            onPress={() => loadMap()}
          >
            Add location
          </IonButton>
        ) : null}
      </IonFooter>
    </View>
  );
}
