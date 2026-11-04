// Ported from: src/pages/digitalcatalog/digitalcatalog.html + .ts + .scss (+ .module.ts)
import React, { useEffect, useRef, useState } from 'react';
import { Image, Linking, Pressable, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { db } from '../../api/client';
import { IonContent } from '../../components/ionic/IonContent';
import { IonInfiniteScroll, IonInfiniteScrollContent } from '../../components/ionic/IonInfiniteScroll';
import { IonHeader, IonNavbar } from '../../components/ionic/IonNavbar';
import { Text } from '../../components/ionic/IonText';
import { textStyle } from '../../components/ionic/text';
import { md } from '../../theme/ionicMd';
import { collapseWs, interp } from '../../ui/angularPipes';
import { useLoader } from '../../ui/useLoader';
import { noFoundSize, noFoundXml } from '../OfferList/noFound';
import { styles } from './styles';

// Ionic assets/imgs/pdf.png (html:15).
// NOTE (not 1:1, STOP item): a client picture that lives next to the screen until the lead moves it to clients/<id>/assets + scripts/use-client.mjs.
const pdfPng = require('./pdf.png');

interface Props {
  navigation?: object;
  route?: { params?: object };
}

export default function DigitalcatalogScreen(_props: Props) {
  const { t } = useTranslation(); // re-renders on i18n.changeLanguage, like the `| translate` pipe
  const loader = useLoader();
  const alive = useRef(true);
  const [pdf, setPdf] = useState<any>([]); // :12 pdf:any=[]
  const uploadUrl = db.upload_url3; // :17 this.uploadUrl = dbService.upload_url3

  // :26-31 ionViewDidLoad -> getpdflist()
  // NOTE (parity): digitalcatalog.module.ts has its own TranslateModule.forRoot, but the page never calls use(): the language is whatever
  // the app has (global).
  useEffect(() => {
    alive.current = true;
    getpdflist();
    return () => {
      alive.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // :33-40 presentLoading(): content 'Please wait...', dismissOnPageChange false
  function presentLoading() {
    loader.show('Please wait...', { dismissOnPageChange: false });
  }

  // :42-53 getpdflist()
  // NOTE (parity): no error callback in Ionic: after an HTTP error the loader stays up (until the page is destroyed) and the list stays empty.
  function getpdflist() {
    presentLoading();
    db.onPostRequestDataFromApi({}, 'app_karigar/product_catalogue_list', db.rootUrl).then(
      (r: any) => {
        // NOTE (parity): a null body throws at r['pdf'] before the dismiss: the loader stays up.
        if (r == null) {
          return;
        }
        if (alive.current) {
          setPdf(r.pdf); // :49
        }
        loader.hide(); // :50 this.loading.dismiss()
      },
      () => {},
    );
  }

  // html:24 `<ion-infinite-scroll (ionInfinite)="loadDataBill($event)">`
  // NOTE (parity): DigitalcatalogPage has no loadDataBill(): the call throws in Ionic, complete() is never reached and the infinite
  // scroll stays in its loading state ("Loading more data..." with the bubbles) after the first scroll to the bottom. No request is sent.
  function loadDataBill() {}

  // html:12-20 `<a href="{{uploadUrl + list.pdf}}">`: the webview follows the link, i.e. the system opens the PDF
  function openPdf(file: any) {
    Linking.openURL(`${uploadUrl}${file}`);
  }

  // html:7 `*ngIf="!pdf.length"`: NOTE (parity): a null `pdf` makes the template throw; RN shows the empty state while the list is not an array.
  const list: any[] = Array.isArray(pdf) ? pdf : [];
  const imgH = 100; // `.data-not img { height: 100px }`

  return (
    <View style={styles.screen}>
      {/* html:8-12 <ion-header class="main-header remove"> */}
      <IonHeader mainHeader remove>
        <IonNavbar color="primary" title={collapseWs(t('Digital Catalogue'))} />
      </IonHeader>

      {/* html:13 <ion-content padding> */}
      <IonContent padding>
        {/* html:14 <div class="container"> (no CSS) */}
        <View>
          {/* html:15-17 */}
          {!list.length ? (
            <View testID="digitalcatalog-empty" style={styles.dataNot}>
              <SvgXml xml={noFoundXml} width={(imgH * noFoundSize.width) / noFoundSize.height} height={imgH} />
            </View>
          ) : null}
          {/* html:18-26 */}
          {list.map((row: any, i: number) => {
            // NOTE (parity): a null row throws in Ionic's template; RN draws an empty card.
            const l = row ?? {};
            return (
              <View key={i} style={styles.main}>
                <Pressable testID={`digitalcatalog-item-${i}`} onPress={() => openPdf(l.pdf)}>
                  <View style={styles.part1}>
                    <View style={styles.col1}>
                      <Image testID={`digitalcatalog-icon-${i}`} source={pdfPng} resizeMode="stretch" style={styles.pdfIcon} />
                    </View>
                    <View style={styles.col2}>
                      {/* `a { color: $link-color }` (the primary colour) reaches the span */}
                      <Text testID={`digitalcatalog-name-${i}`} style={textStyle(14, 400, md.linkColor, 17)}>
                        {interp(l.pdf_name)}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              </View>
            );
          })}
        </View>

        {/* html:29-32 *ngIf="flag!=1": flag is never declared on the page, so `undefined != 1` is always true */}
        <IonInfiniteScroll threshold="100px" onInfinite={loadDataBill}>
          <IonInfiniteScrollContent loadingSpinner="bubbles" loadingText="Loading more data..." />
        </IonInfiniteScroll>
      </IonContent>
    </View>
  );
}
