// Ported from: src/pages/video/video.html + .ts + .scss
import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { db } from '../../api/client';
import { WebEmbed } from '../../components/WebEmbed';
import { IonContent } from '../../components/ionic/IonContent';
import { IonInfiniteScroll, IonInfiniteScrollContent, type InfiniteScrollHandle } from '../../components/ionic/IonInfiniteScroll';
import { IonHeader, IonNavbar } from '../../components/ionic/IonNavbar';
import { Text } from '../../components/ionic/IonText';
import { textStyle } from '../../components/ionic/text';
import { activeNavNames } from '../../navigation/navigationRef';
import { collapseWs, interp, titlecase } from '../../ui/angularPipes';
import { md } from '../../theme/ionicMd';
import { useLoader } from '../../ui/useLoader';
import { imgSize, nothingXml } from './nothing';
import { descColor, styles } from './styles';

// app.getActiveNav() page names that video.ts:101-111 looks for, without the 'Page' suffix.
const ROOT_PAGES = ['Home', 'GiftList', 'Transaction', 'Profile', 'MainHome'];

interface Props {
  navigation: {
    addListener?: (type: 'blur', cb: () => void) => () => void;
    getState?: () => any;
    popToTop?: () => void;
  };
  route?: { params?: { cat?: any } };
}

// NOTE (parity): video.module.ts has no own TranslateModule: the app's current language shows (RN: global i18n).
export default function VideoScreen({ navigation, route }: Props) {
  const { t } = useTranslation(); // re-renders on i18n.changeLanguage, like the `| translate` pipe
  const loader = useLoader();
  const alive = useRef(true);
  const category = route?.params?.cat; // :30 this.category = navParams.get('cat') (the default '' is always overwritten, even by undefined)
  // :15 filter:any={} (one object for the page's life: getVideoList sets limit/category, loadData changes limit)
  const filter = useRef<any>({});
  const [videoList, setVideoList] = useState<any>([]); // :16 video_list:any=[]
  const listRef = useRef<any>([]);
  const [loadData0, setLoadData0] = useState<any>(0); // :20 load_data:any=0
  const [flag, setFlag] = useState<any>(''); // :21 flag:any=''
  const [viewport, setViewport] = useState(0);

  // :35-40 ionViewDidLoad
  useEffect(() => {
    alive.current = true;
    getVideoList(); // :38
    presentLoading(); // :39
    return () => {
      alive.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // :98-120 ionViewDidLeave. React Navigation's 'blur' fires on a push over this screen and on a tab switch, like Ionic's didLeave.
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

  // :41-62 getVideoList()
  function getVideoList() {
    setLoadData0(0); // :43
    filter.current.limit = 0; // :44
    filter.current.category = category; // :45
    db.onPostRequestDataFromApi({ filter: filter.current, karigar_id: db.userStorageData?.id }, 'app_master/videoList', db.rootUrl).then(
      (r: any) => {
        loader.hide(); // :52 this.loading.dismiss() (before the list is assigned)
        const next = r?.video; // :53
        if (next == null) {
          // NOTE (parity): `video: null` (or a missing key) makes `video_list.length` throw at :57 / in the template: the view keeps what it
          // showed before (nothing) and no error is shown. RN skips the update the same way instead of crashing.
          return;
        }
        if (alive.current) {
          listRef.current = next;
          setVideoList(next);
          setLoadData0(1); // :54
        }
        // :56-58 each url goes through bypassSecurityTrustResourceUrl: RN loads the string as is.
      },
      // NOTE (parity): no error callback in Ionic: after an HTTP error the 'Please wait...' loader stays up (until the page changes).
      () => {},
    );
  }

  // :63-70 presentLoading(): content 'Please wait...', dismissOnPageChange: true
  function presentLoading() {
    loader.show();
  }

  // :73-96 loadData(infiniteScroll)
  function loadData(infiniteScroll: InfiniteScrollHandle) {
    filter.current.limit = listRef.current.length; // :75
    db.onPostRequestDataFromApi({ filter: filter.current }, 'app_master/videoList', db.rootUrl).then(
      (r: any) => {
        if (!r) {
          return; // TypeError at `r['video']` in Ionic: complete() never runs
        }
        if (r.video == '') { // eslint-disable-line eqeqeq
          // NOTE (parity): loose == '': an empty array (and '') ends paging for good (flag is never reset); complete() is not called, the
          // element is removed by *ngIf="flag!=1".
          if (alive.current) {
            setFlag(1);
          }
        } else if (Array.isArray(r.video)) {
          // NOTE (parity): Ionic re-wraps every url of the whole list with bypassSecurityTrustResourceUrl here, including the ones that are
          // already wrapped from the first page (:84-86); RN keeps plain strings (see the report).
          setTimeout(() => {
            listRef.current = listRef.current.concat(r.video); // :82
            if (alive.current) {
              setVideoList(listRef.current);
            }
            infiniteScroll.complete(); // :88
          }, 1000);
        }
        // NOTE (parity): a non-array `video` (null) makes Ionic throw while wrapping urls: complete() never runs. RN does nothing.
      },
      // NOTE (parity): no error callback in Ionic: the infinite scroll stays in its loading state.
      () => {},
    );
  }

  // html:4-5 `<ion-title *ngIf="!category">` / `*ngIf="category"`
  const title = !category ? collapseWs(t('Videos')) : collapseWs(interp(titlecase(category)));
  // html:8 `*ngIf="!video_list.length && load_data == '1'"`
  const nothing = !videoList.length && loadData0 == '1'; // eslint-disable-line eqeqeq
  const imgW = 150; // `.nothing-here img { width: 150px }`

  return (
    <View style={styles.screen}>
      {/* html:2-6 `.main-header.remove` + `<ion-navbar>` (no colour) */}
      <IonHeader mainHeader remove>
        <IonNavbar title={title} />
      </IonHeader>

      {/* html:8-30 */}
      <IonContent onLayout={e => setViewport(e.nativeEvent.layout.height)}>
        {/* html:8-18 */}
        {nothing ? (
          <View testID="video-empty" style={[styles.nothingHere, { height: viewport * 0.8 }]}>
            <View style={styles.outer}>
              <View style={styles.innear}>
                <SvgXml xml={nothingXml} width={imgW} height={(imgW * imgSize.height) / imgSize.width} />
                <Text style={[textStyle(14, 400, md.textColor), styles.nothingText]}>{collapseWs(t('Data not Available'))}</Text>
              </View>
            </View>
          </View>
        ) : null}
        {/* html:19-24 */}
        {videoList.map((list: any, i: number) => (
          <View key={i} testID={`video-item-${i}`}>
            {/* html:20 `<iframe [src]="list.url" width="100%" height="180" rameborder="0" ...>`: the misspelt attribute keeps the default
                inset border (see WebEmbed) */}
            <WebEmbed testID={`video-embed-${i}`} uri={interp(list.url)} height={180} border="inset" iframe />
            <View style={styles.vidText}>
              <Text testID={`video-desc-${i}`} style={textStyle(13, 400, descColor, 20)}>
                {interp(list.desc)}
              </Text>
            </View>
          </View>
        ))}
        {/* html:25-30 */}
        {flag != 1 ? ( // eslint-disable-line eqeqeq
          <IonInfiniteScroll threshold="100px" onInfinite={loadData}>
            <IonInfiniteScrollContent loadingSpinner="bubbles" loadingText="Loading more data..." />
          </IonInfiniteScroll>
        ) : null}
      </IonContent>
    </View>
  );
}
