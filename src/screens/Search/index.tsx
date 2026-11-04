// Ported from: src/pages/search/search.html + .ts + .scss
import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import { IonButton } from '../../components/ionic/IonButton';
import { IonContent } from '../../components/ionic/IonContent';
import { IonInput } from '../../components/ionic/IonInput';
import { IonList } from '../../components/ionic/IonList';
import { IonHeader, IonNavbar } from '../../components/ionic/IonNavbar';
import { Text } from '../../components/ionic/IonText';
import { textStyle } from '../../components/ionic/text';
import { md } from '../../theme/ionicMd';
import { normalLineHeight } from '../../theme/ionicMdOverlays';
import { toolbarColors } from '../../theme/ionicMdPage';
import { fontFor } from '../../theme/typography';
import { styles } from './styles';

interface Props {
  navigation?: object;
  route?: { params?: object };
}

// `ion-input` inside `ion-title`: `input { font: inherit; color: inherit }` takes the title's 2rem / 500 and the toolbar text colour
// (the kit's IonInput defaults are the in-item 16px ones, overridden here on the native input).
const titleInput = { ...fontFor(500), fontSize: 20, lineHeight: normalLineHeight(20), height: normalLineHeight(20), color: toolbarColors.default.text };

// No translate pipe and no TranslateModule in search.module.ts: every text is a literal.
export default function SearchScreen(_props: Props) {
  const [val, setVal] = useState(''); // html:4 [(ngModel)]="val" (undefined until the user types; '' behaves the same in every binding)
  const data = useRef<any[]>([]); // :14 data:any=[]
  const request = useRef(false); // :17 request =false
  const [viewport, setViewport] = useState(0);
  const [, setTick] = useState(0);

  // :31-47 dataChanged(newObj)
  function dataChanged(newObj: string) {
    if (newObj.length == 0) { // eslint-disable-line eqeqeq
      data.current = [];
    } else if (newObj.length > 0) {
      request.current = true;
      // NOTE (parity): Ionic then waits 500 ms and calls `this.dbService.onPostRequestDataFromApi(newObj, 'search/search_alldata',
      // this.dbService.server_url).then(...)`. That helper returns an RxJS Observable (HttpClient.post), which has no `.then`: the TypeError is
      // thrown inside the timer, the cold observable is never subscribed, so NO request is sent, `data` never changes and `request` stays true
      // (the 'Data Not Available' block below can therefore never show). Nothing is called here for the same reason.
    }
    setTick(n => n + 1);
  }

  const onChange = (text: string) => {
    setVal(text); // [(ngModel)]
    dataChanged(text); // (ngModelChange)="dataChanged(val)"
  };

  const list = data.current;
  return (
    <View style={styles.screen}>
      {/* html:1-7 <ion-header><ion-navbar>: a plain toolbar (no color) with the input as the title */}
      <IonHeader>
        <IonNavbar>
          <View style={styles.title}>
            <IonInput testID="search-input" type="text" placeholder="Search" value={val} onChangeText={onChange} style={titleInput} />
          </View>
        </IonNavbar>
      </IonHeader>

      {/* html:9 <ion-content> */}
      <IonContent onLayout={e => setViewport(e.nativeEvent.layout.height)}>
        {/* html:11-19 `.listing`: margin 16px 0; an empty list collapses its margins through (16px in all), a filled one would keep both.
            NOTE (parity): `data` is always [] (see dataChanged), so the rows and goToProductDetailPage() (empty body, its push is commented out)
            are never used; the rows are not ported. */}
        <View testID="search-listing" style={[styles.listing, list.length ? styles.listingFilled : null]}>
          <IonList style={styles.list}>{null}</IonList>
        </View>

        {/* html:21-29 `*ngIf="!request && val && !data.length"` */}
        {!request.current && val && !list.length ? (
          <View testID="search-nothing" style={[styles.nothing, { height: viewport }]}>
            {/* NOTE (parity): src="assets/imgs/main-imgs/nothing.svg" does not exist in the Ionic repo: a 404 with alt="" (a 0 x 100 box with
                `.nothing img { height: 100px }`) */}
            <View style={styles.nothingImg} />
            <Text style={[textStyle(12, 400, md.textColor), styles.nothingText]}>Data Not Available</Text>
          </View>
        ) : null}

        {/* html:31-41 `<div class="bg" padding padding *ngIf="!val">` */}
        {!val ? (
          <View testID="search-bg" style={styles.bg}>
            <Text style={[textStyle(26, 500, md.textColor, 31.2), styles.h1]}>Search</Text>
            {/* html:36 NOTE (parity): src="assets/imgs/main-imgs/search-icons.svg" does not exist in the Ionic repo: a 404 with alt="" and no
                .csicon rule: a 0 x 0 inline image that still makes one strut line box (unverified against a capture). */}
            <View style={styles.csiconStrut} />
            <View style={styles.dflexMt64}>
              {/* html:38 (click)="getCategory()": the method body is commented out (push(CatalougePage)): a dead button */}
              <IonButton testID="search-category" block onPress={() => {}}>
                Search By Category
              </IonButton>
            </View>
          </View>
        ) : null}
      </IonContent>
    </View>
  );
}
