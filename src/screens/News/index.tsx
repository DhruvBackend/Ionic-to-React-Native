// Ported from: src/pages/news/news.html + .ts + .scss (+ .module.ts)
import React, { useEffect, useRef, useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { db } from '../../api/client';
import { Header } from '../../components/ionic/IonNavbar';
import { IonContent } from '../../components/ionic/IonContent';
import { IonInfiniteScroll, IonInfiniteScrollContent, type InfiniteScrollHandle } from '../../components/ionic/IonInfiniteScroll';
import { Text } from '../../components/ionic/IonText';
import { textStyle } from '../../components/ionic/text';
import { activeNavNames } from '../../navigation/navigationRef';
import { md } from '../../theme/ionicMd';
import { interp, titlecase } from '../../ui/angularPipes';
import { useLoader } from '../../ui/useLoader';
import { styles } from './styles';

// app.getActiveNav() page names that news.ts:75-98 looks for, without the 'Page' suffix.
const ROOT_PAGES = ['Home', 'GiftList', 'Transaction', 'Profile', 'MainHome'];
const INLINE_GAP = 4; // an inline <img> sits on the text baseline: ~4px descender gap below it
const STRUT = 17; // an empty line box of 14px Roboto (`line-height: normal`)

interface Props {
  navigation: {
    push: (name: string, params?: object) => void;
    addListener?: (type: 'focus' | 'blur', cb: () => void) => () => void;
    getState?: () => any;
    popToTop?: () => void;
  };
  route?: { params?: any };
}

// html:12-14 `<div class="thumb"><img src={{list.image}} alt=""></div>`: natural size, `img { max-width: 100% }`, inline (baseline gap below it)
function Thumb({ uri, maxWidth, testID }: { uri: string; maxWidth: number; testID: string }) {
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  useEffect(() => {
    if (!uri) {
      return undefined;
    }
    let live = true;
    setNatural(null);
    Image.getSize?.(
      uri,
      (w, h) => live && setNatural({ w, h }),
      () => {},
    );
    return () => {
      live = false;
    };
  }, [uri]);
  const w = natural ? Math.min(natural.w, maxWidth || natural.w) : 0;
  const h = natural ? (natural.h * w) / natural.w : 0;
  return (
    <View testID={`${testID}-box`}>
      {natural ? <Image testID={testID} source={{ uri }} resizeMode="stretch" style={{ width: w, height: h }} /> : null}
      <View style={{ height: natural ? INLINE_GAP : STRUT }} />
    </View>
  );
}

// LowerCasePipe: a falsy value is returned as it is.
// NOTE (parity): Angular throws InvalidPipeArgument for a non-string; RN converts it.
function lowerCase(v: any): any {
  return v ? String(v).toLowerCase() : v;
}

export default function NewsScreen({ navigation }: Props) {
  const loader = useLoader();
  const alive = useRef(true);
  const filter = useRef<any>({}); // :11 filter:any={}
  const listRef = useRef<any>(''); // :12 news_list:any='' (the latest value; loadData reads `this.news_list`)
  const [newsList, setNewsList] = useState<any>('');
  const [flag, setFlag] = useState<any>(''); // :53 flag:any=''
  const [width, setWidth] = useState(0); // .glsec width, for `img { max-width: 100% }`

  // :22-27 ionViewDidLoad: getNewsList() then presentLoading()
  useEffect(() => {
    alive.current = true;
    getNewsList();
    presentLoading();
    return () => {
      alive.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // :75-98 ionViewDidLeave. React Navigation's 'blur' fires on a push over this screen, like Ionic's didLeave.
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

  // :29-32 goOnNewsDetailPage(id)
  function goOnNewsDetailPage(id: any) {
    navigation.push('NewsDetail', { id });
  }

  // :33-42 getNewsList()
  // NOTE (parity): no error callback in Ionic: after an HTTP error the 'Please wait...' loader stays up and the page stays blank.
  function getNewsList() {
    filter.current.limit = 0; // :35
    db.onPostRequestDataFromApi({ filter: filter.current }, 'app_master/newsList', db.rootUrl).then(
      (r: any) => {
        loader.hide(); // :39 this.loading.dismiss()
        // NOTE (parity): a null body throws at r['news'] (after the dismiss): the list stays as it was.
        if (r == null) {
          return;
        }
        listRef.current = r.news; // :40
        if (alive.current) {
          setNewsList(r.news);
        }
      },
      () => {},
    );
  }

  // :43-49 presentLoading(): dismissOnPageChange true
  function presentLoading() {
    loader.show('Please wait...', { dismissOnPageChange: true });
  }

  // :54-72 loadData(infiniteScroll)
  function loadData(infiniteScroll: InfiniteScrollHandle) {
    // NOTE (parity): `this.news_list.length` throws when news_list is null/undefined (malformed first answer): the handler dies before
    // the request and the infinite scroll stays in its loading state.
    if (listRef.current == null) {
      return;
    }
    filter.current.limit = listRef.current.length; // :56
    db.onPostRequestDataFromApi({ filter: filter.current }, 'app_master/newsList', db.rootUrl).then(
      (r: any) => {
        // NOTE (parity): a null body throws at r['news']: nothing happens (the infinite scroll stays loading).
        if (r == null) {
          return;
        }
        // :60 `r['news']==''` (loose): '' and [] both equal '' in JS, so an empty page ends paging for good. complete() is not called:
        // the element is removed by *ngIf="flag!=1".
        if (r.news == '') { // eslint-disable-line eqeqeq
          if (alive.current) {
            setFlag(1);
          }
        } else {
          setTimeout(() => {
            // NOTE (parity): `this.news_list.concat(...)` on a null list throws inside the timer: complete() never runs.
            if (listRef.current == null) {
              return;
            }
            const next = ([] as any[]).concat(listRef.current === '' ? [] : listRef.current, r.news); // :66
            listRef.current = next;
            // NOTE (parity): `concat(null)` appends a null row; Ionic's template then throws on `list.id` and the DOM of the last
            // completed render stays: RN skips the state update the same way.
            if (alive.current && next.every((x: any) => x != null)) {
              setNewsList(next);
            }
            infiniteScroll.complete(); // :68
          }, 1000);
        }
      },
      // NOTE (parity): no error callback in Ionic: after an HTTP error the infinite scroll stays in its loading state.
      () => {},
    );
  }

  const rows: any[] = Array.isArray(newsList) ? newsList : [];

  return (
    <View style={styles.screen}>
      {/* html:2-6 plain <ion-header> + <ion-navbar> (no colour) */}
      <Header title="Latest News" />
      {/* html:8 <ion-content padding> */}
      <IonContent padding>
        {/* html:9 <div class="glsec m16"> */}
        <View style={styles.glsec} onLayout={e => setWidth(e.nativeEvent.layout.width)}>
          {rows.map((list: any, i: number) => (
            <Pressable key={i} testID={`news-item-${i}`} onPress={() => goOnNewsDetailPage(list.id)}>
              {/* html:11-17 .figuree > .csr > .thumb > img */}
              <Thumb uri={interp(list.image)} maxWidth={width} testID={`news-image-${i}`} />
              {/* html:18-22 .csl > .description > p: `lowercase | titlecase`, 14px Roboto, margin 0 */}
              <Text testID={`news-title-${i}`} style={textStyle(14, 400, md.textColor, 17)}>
                {interp(titlecase(lowerCase(list.title)))}
              </Text>
            </Pressable>
          ))}
        </View>
        {/* html:25-31 *ngIf="flag!=1" (inside ion-content, after .glsec) */}
        {flag != 1 ? ( // eslint-disable-line eqeqeq
          <IonInfiniteScroll threshold="100px" onInfinite={loadData}>
            <IonInfiniteScrollContent loadingSpinner="bubbles" loadingText="Loading more data..." />
          </IonInfiniteScroll>
        ) : null}
      </IonContent>
    </View>
  );
}
