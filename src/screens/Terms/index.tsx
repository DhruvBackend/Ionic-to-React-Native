// Ported from: src/pages/terms/terms.html + .ts + .scss (+ .module.ts)
import React, { useEffect, useRef, useState } from 'react';
import { Image, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { db } from '../../api/client';
import { IonContent } from '../../components/ionic/IonContent';
import { IonHeader, IonNavbar } from '../../components/ionic/IonNavbar';
import { stripHtml } from '../../components/ionic/html';
import { Text } from '../../components/ionic/IonText';
import { textStyle } from '../../components/ionic/text';
import { collapseWs } from '../../ui/angularPipes';
import { imageViewerMd } from '../../theme/ionicMdScroll';
import { termsMd } from '../../theme/ionicMdTerms';
import { useLoader } from '../../ui/useLoader';
import { styles } from './styles';

interface Props {
  navigation?: object;
  route?: { params?: { id?: any; term?: any } };
}

export default function TermsScreen({ route }: Props) {
  const { t } = useTranslation(); // re-renders on i18n.changeLanguage, like the `| translate` pipe
  const loader = useLoader();
  // terms.ts:11-16 fields.
  // NOTE (parity): terms.module.ts has its own TranslateModule.forRoot, but app.module.ts:215 imports TermsPageModule eagerly, so the page
  // shares the root TranslateService; it never calls use()/setDefaultLang(): the language is whatever the app already had (global in RN too).
  const url = db.upload_url3; // :18 this.url = dbService.upload_url3
  const [termsDetail, setTermsDetail] = useState<any>({}); // :12 terms_detail:any={}
  const [term, setTerm] = useState<any>(''); // :14 term:any=''
  const [viewW, setViewW] = useState(0); // img-box width (border box)
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [bannerFailed, setBannerFailed] = useState(false);
  const alive = useRef(true);

  // :25-31 ionViewDidLoad
  useEffect(() => {
    alive.current = true;
    setTerm(route?.params?.term); // :28 this.term=this.navParams.get('term')
    getTermsDetail(route?.params?.id); // :27 offer_id=navParams.get('id'), :29
    presentLoading(); // :30
    return () => {
      alive.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // :32-42 getTermsDetail(offer_id)
  // NOTE (security, not changed): karigar_id is the literal 22 for every user (:35).
  function getTermsDetail(offerId: any) {
    db.onPostRequestDataFromApi({ offer_id: offerId, karigar_id: 22 }, 'app_karigar/offerTermCondition', db.rootUrl).then(
      (r: any) => {
        loader.hide(); // :37 this.loading.dismiss() (before the model is assigned)
        const next = r?.offer; // :38
        if (next == null) {
          // NOTE (parity): `offer: null` (or a missing key, e.g. NOT FOUND) makes the template's `terms_detail.offer_banner` throw during Ionic's
          // change detection: the view keeps what it showed (banner of 'undefined', empty text) and no error is shown. RN skips the update
          // the same way instead of crashing.
          return;
        }
        if (alive.current) {
          setTermsDetail(next);
        }
      },
      // NOTE (parity): no error callback in Ionic: after an HTTP error the 'Please wait...' loader stays up (until the page changes).
      () => {},
    );
  }

  // :43-50 presentLoading(): content 'Please wait...', dismissOnPageChange: true
  function presentLoading() {
    loader.show('Please wait...', { dismissOnPageChange: true });
  }

  // html:15 `<img src="{{url+terms_detail.offer_banner}}">` (string concatenation: 'undefined' is appended while terms_detail is {})
  const bannerUri = url + termsDetail.offer_banner;
  useEffect(() => {
    let live = true;
    setNatural(null);
    setBannerFailed(false);
    Image.getSize?.(
      bannerUri,
      (w, h) => live && setNatural({ w, h }),
      () => live && setBannerFailed(true),
    );
    return () => {
      live = false;
    };
  }, [bannerUri]);
  // `img { max-width: 100% }` of an auto-sized <img> inside `.img-box` (border-box width minus the 6px borders): never enlarged.
  const innerW = Math.max(viewW - 12, 0);
  const imgW = natural ? Math.min(natural.w, innerW) : bannerFailed ? imageViewerMd.brokenImageSize : 0;
  const imgH = natural ? (natural.h * imgW) / natural.w : bannerFailed ? imageViewerMd.brokenImageSize : 0;

  const isTerms = term == 'term_and_conditions'; // eslint-disable-line eqeqeq
  // html:19-21 / :22-24 `[innerHTML]="terms_detail.terms"` / `.description`. NOTE (parity): Angular's innerHTML renders real markup; the kit's
  // stripHtml (<br> = line break, other tags dropped, entities decoded) is used, as for alerts. null/undefined renders empty.
  const raw = isTerms ? termsDetail.terms : termsDetail.description;
  const body = raw == null ? '' : stripHtml(String(raw));

  return (
    <View style={styles.screen}>
      {/* html:1-7 */}
      <IonHeader mainHeader remove>
        <IonNavbar color="primary" title={collapseWs(t(isTerms ? 'Terms & Condtion' : 'Description'))} />
      </IonHeader>

      <IonContent>
        {/* html:11-17 */}
        <View style={styles.container}>
          <View testID="terms-banner-box" style={styles.imgBox} onLayout={e => setViewW(e.nativeEvent.layout.width)}>
            <Image testID="terms-banner" source={{ uri: bannerUri }} resizeMode="cover" style={{ width: imgW, height: imgH, borderRadius: 10 }} />
          </View>
        </View>

        {/* html:19-21 and :22-24 (one of the two shows) */}
        <View testID={isTerms ? 'terms-text' : 'terms-description'} style={styles.termsText}>
          <Text testID="terms-body" style={[textStyle(14, 500, termsMd.ink, 24), styles.p]}>
            {body}
          </Text>
        </View>
      </IonContent>
    </View>
  );
}
