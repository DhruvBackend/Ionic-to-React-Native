// Ported from: src/pages/news-detail/news-detail.html + .ts + .scss (+ .module.ts)
import React, { useEffect, useRef, useState } from 'react';
import { Image, View } from 'react-native';
import { db } from '../../api/client';
import { Header } from '../../components/ionic/IonNavbar';
import { IonContent } from '../../components/ionic/IonContent';
import { MaterialIcon } from '../../components/ionic/MaterialIcon';
import { Text } from '../../components/ionic/IonText';
import { textStyle } from '../../components/ionic/text';
import { activeNavNames } from '../../navigation/navigationRef';
import { md } from '../../theme/ionicMd';
import { newsMd as N } from '../../theme/ionicMdNews';
import { datePipe, interp, titlecase } from '../../ui/angularPipes';
import { useLoader } from '../../ui/useLoader';
import { styles } from './styles';

// app.getActiveNav() page names that news-detail.ts:56 looks for, without the 'Page' suffix.
const ROOT_PAGES = ['Home', 'GiftList', 'Transaction', 'Profile', 'MainHome'];
const IMG_H = 277; // `.pr-img { height: 277px }`
const PADDING = 16; // ion-content padding

interface Props {
  navigation: {
    addListener?: (type: 'focus' | 'blur', cb: () => void) => () => void;
    getState?: () => any;
    popToTop?: () => void;
  };
  route?: { params?: any };
}

export default function NewsDetailScreen({ navigation, route }: Props) {
  const loader = useLoader();
  const alive = useRef(true);
  const [detail, setDetail] = useState<any>({}); // :11 news_detail:any={}
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [boxW, setBoxW] = useState(0); // .pr-img width, for `img { max-width: 100% }`
  const [scrollTop, setScrollTop] = useState(0);
  const [contentH, setContentH] = useState(0);

  // :24-29 ionViewDidLoad: news_id = navParams.get('id'); getNewsDetail(news_id); presentLoading()
  useEffect(() => {
    alive.current = true;
    getNewsDetail(route?.params?.id);
    presentLoading();
    return () => {
      alive.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // :50-72 ionViewDidLeave. React Navigation's 'blur' fires on a push over this screen, like Ionic's didLeave.
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

  // :31-38 getNewsDetail(news_id)
  // NOTE (parity): no error callback in Ionic: after an HTTP error the 'Please wait...' loader stays up and the page stays blank.
  function getNewsDetail(newsId: any) {
    db.onPostRequestDataFromApi({ news_id: newsId }, 'app_master/newsDetail', db.rootUrl).then(
      (r: any) => {
        loader.hide(); // :35 this.loading.dismiss()
        // NOTE (parity): a null body throws at r['news'] (after the dismiss). A null `news` is assigned (:36) and the template then
        // throws on `news_detail.image`: the DOM of the last completed render stays. RN keeps its state in both cases.
        if (r == null || r.news == null) {
          return;
        }
        if (alive.current) {
          setDetail(r.news);
        }
      },
      () => {},
    );
  }

  // :40-47 presentLoading(): dismissOnPageChange true
  function presentLoading() {
    loader.show('Please wait...', { dismissOnPageChange: true });
  }

  // html:11 <img src={{news_detail.image}}>: height 100% of the 277 box, auto width, `img { max-width: 100% }`
  const imageUri = interp(detail.image);
  useEffect(() => {
    setNatural(null);
    if (!imageUri) {
      return undefined;
    }
    let live = true;
    Image.getSize?.(
      imageUri,
      (w, h) => live && setNatural({ w, h }),
      () => {},
    );
    return () => {
      live = false;
    };
  }, [imageUri]);
  // NOTE (parity): `max-width: 100%` squeezes a very wide picture horizontally (its height stays 100%).
  const imgW = natural ? Math.min((natural.w * IMG_H) / natural.h, boxW || Infinity) : 0;

  // html:9 `.fix { position: sticky; top: 0 }`: inside the scroll content (padding 16) it pins the picture to the top edge once the
  // content scrolls past its natural place, down to the bottom of the content box (content height minus the 16 padding).
  const maxShift = Math.max(contentH - PADDING - (PADDING + IMG_H), 0);
  const shift = Math.min(Math.max(scrollTop - PADDING, 0), maxShift);

  return (
    <View style={styles.screen}>
      {/* html:2-6 plain <ion-header> + <ion-navbar> (no colour) */}
      <Header title="News Detail" />
      {/* html:8 <ion-content padding> */}
      <IonContent
        padding
        onScroll={e => setScrollTop(e.nativeEvent.contentOffset.y)}
        onContentSizeChange={(_w, h) => setContentH(h)}
      >
        {/* html:9-13 .fix > .pr-img > img */}
        <View testID="news-fix" style={[styles.fix, { transform: [{ translateY: shift }] }]}>
          <View style={styles.prImg} onLayout={e => setBoxW(e.nativeEvent.layout.width)}>
            {natural ? <Image testID="news-image" source={{ uri: imageUri }} resizeMode="stretch" style={{ width: imgW, height: IMG_H }} /> : null}
          </View>
        </View>
        {/* html:14-23 .box > .date, .social: unstyled blocks */}
        <View testID="news-box">
          <View style={styles.iconLine}>
            <MaterialIcon name="date_range" />
          </View>
          <Text testID="news-date" style={textStyle(14, 400, md.textColor, 17)}>
            {datePipe(detail.date_created, 'd MMM, y')}
          </Text>
          <View style={styles.iconLine}>
            <MaterialIcon name="public" />
          </View>
          <Text testID="news-source" style={textStyle(14, 400, md.textColor, 17)}>
            {interp(detail.source)}
          </Text>
        </View>
        {/* html:24-27 .pr-about */}
        <View style={styles.prAbout}>
          <Text testID="news-title" style={[textStyle(16, 500, N.heading, 22), styles.h1]}>
            {interp(titlecase(detail.title))}
          </Text>
          <Text testID="news-desc" style={textStyle(14, 400, N.body, 24)}>
            <Text style={textStyle(14, 700, N.body, 24)}>Description</Text>
            {` : ${interp(detail.desc)}`}
          </Text>
        </View>
      </IonContent>
    </View>
  );
}
