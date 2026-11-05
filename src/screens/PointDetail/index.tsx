// Ported from: src/pages/points/point-detail/point-detail.html + .ts + .scss (+ .module.ts)
import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { SvgCss } from 'react-native-svg/css'; // the picture colours its paths through an internal <style>: SvgXml ignores it (all black)
import { db } from '../../api/client';
import { IonContent } from '../../components/ionic/IonContent';
import { IonHeader, IonNavbar } from '../../components/ionic/IonNavbar';
import { Text } from '../../components/ionic/IonText';
import { textStyle } from '../../components/ionic/text';
import { activeNavNames } from '../../navigation/navigationRef';
import { md } from '../../theme/ionicMd';
import { collapseWs, datePipe, interp } from '../../ui/angularPipes';
import { useLoader } from '../../ui/useLoader';
import { gift1Size, gift1Svg } from './giftSvg';
import { styles } from './styles';

// app.getActiveNav() page names that point-detail.ts:61 looks for, without the 'Page' suffix.
const ROOT_PAGES = ['Home', 'GiftList', 'Transaction', 'Profile', 'MainHome'];

interface Props {
  navigation: {
    push?: (name: string, params?: object) => void;
    addListener?: (type: 'blur' | 'focus', cb: () => void) => () => void;
    getState?: () => any;
    popToTop?: () => void;
  };
  route?: { params?: { id?: any } };
}

// What the template's text bindings show (the `{{ }}` interpolations of point-detail.html).
interface Bindings {
  date: string;
  point: string;
}

export default function PointDetailScreen({ navigation, route }: Props) {
  const loader = useLoader();
  const alive = useRef(true);
  const [, setTick] = useState(0);
  const rerender = () => {
    if (alive.current) {
      setTick(n => n + 1);
    }
  };
  const couponDetail = useRef<any>(''); // :11 coupon_detail:any=''
  // Angular keeps the text of its last successful change detection when a binding throws.
  const lastGood = useRef<Bindings | null>(null);

  // :22-28 ionViewDidLoad: the request first, then the loader (the answer is asynchronous, so the loader is always open before it)
  useEffect(() => {
    alive.current = true;
    getCouponDetail(route?.params?.id); // :25-26 this.coupon_id = navParams.get('id')
    loader.show('Please wait...', { dismissOnPageChange: true }); // :27 presentLoading() (:39-46)
    return () => {
      alive.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // :47-70 ionViewDidLeave. React Navigation's 'blur' fires on a push over this screen, like Ionic's didLeave.
  // NOTE (parity): when the nav that is active after leaving shows one of the root pages (and its previous page is not one of them),
  // this.navCtrl.popToRoot() runs. At a stack root it does nothing.
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

  // :30-37 getCouponDetail(coupon_id)
  function getCouponDetail(couponId: any) {
    db.onPostRequestDataFromApi({ coupon_id: couponId, karigar_id: db.userStorageData?.id }, 'app_karigar/couponDetail', db.rootUrl).then(
      (r: any) => {
        loader.hide(); // :35 this.loading.dismiss(), before anything is read
        try {
          couponDetail.current = r.coupon; // :36 (a null body throws here: coupon_detail keeps its value)
        } catch {
          // TypeError in Ionic's subscribe callback
        } finally {
          rerender();
        }
      },
      // NOTE (parity): no error callback in Ionic: after an HTTP error the 'Please wait...' loader stays up (the page keeps its empty template).
      () => {},
    );
  }

  // The template's change detection: `coupon_detail` null/undefined (answer without a `coupon`) makes the first binding throw
  // (`null.scan_date`): nothing is updated, the DOM keeps the last good render (the initial one: empty date, ' Point').
  // NOTE (parity): the date pipe throws InvalidPipeArgument for an unparseable value; the shared pipe prints empty instead (not modelled).
  const cd = couponDetail.current;
  if (cd !== null && cd !== undefined) {
    lastGood.current = {
      date: datePipe(cd.scan_date, 'd MMMM y'), // html:11 {{coupon_detail.scan_date | date:'d MMMM y'}}
      // html:13 {{coupon_detail.actual_coupon_point}} Point: the leading space of the block collapses away
      point: collapseWs(`${interp(cd.actual_coupon_point)} Point`).replace(/^ /, ''),
    };
  }
  const b: Bindings = lastGood.current ?? { date: '', point: 'Point' };

  return (
    <View style={styles.screen}>
      {/* html:2-6 */}
      <IonHeader>
        <IonNavbar color="primary" title="Points Detail" />
      </IonHeader>

      {/* html:8-16 <ion-content padding> */}
      <IonContent padding>
        <View testID="pointdetail-content" style={styles.detailContent}>
          {/* html:10 */}
          <Text style={textStyle(26, 500, md.textColor, 31.2)}>Get Point</Text>
          {/* html:11 NOTE (parity): an empty <p> has no line box: no height */}
          {b.date !== '' ? (
            <Text testID="pointdetail-date" style={textStyle(14, 400, md.textColor)}>
              {b.date}
            </Text>
          ) : null}
          {/* html:12 assets/imgs/gift-1.svg: an inline <img> on the baseline, then the strut gap */}
          <SvgCss testID="pointdetail-image" xml={gift1Svg} width={gift1Size.width} height={gift1Size.height} />
          <View style={styles.imgGap} />
          {/* html:13 */}
          <Text testID="pointdetail-point" style={textStyle(24, 500, md.textColor, 28.8)}>
            {b.point}
          </Text>
        </View>
      </IonContent>
    </View>
  );
}
