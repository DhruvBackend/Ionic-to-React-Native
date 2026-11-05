// Ported from: src/pages/nearest-dealer/nearest-dealer.html + .ts + .scss
import React, { useEffect, useRef, useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { db } from '../../api/client';
import { IonContent } from '../../components/ionic/IonContent';
import { IonHeader, IonNavbar, IonToolbar } from '../../components/ionic/IonNavbar';
import { IonSearchbar } from '../../components/ionic/IonSearchbar';
import { Text } from '../../components/ionic/IonText';
import { MaterialIcon } from '../../components/ionic/MaterialIcon';
import { textStyle } from '../../components/ionic/text';
import { client } from '../../config/client';
import { openNavigation } from '../../native';
import { colors } from '../../theme';
import { md } from '../../theme/ionicMd';
import { nearestDealerMd as N } from '../../theme/ionicMdNearestDealer';
import { collapseWs, interp, titlecase } from '../../ui/angularPipes';
import { showToast } from '../../ui/overlays';
import { useLoader } from '../../ui/useLoader';
import { location1Xml } from './location1';
import { styles } from './styles';

interface Props {
  navigation?: object;
  route?: { params?: { pincode?: any; type?: any } };
}

// NOTE (parity): nearest-dealer.module.ts has its own TranslateModule.forRoot but the page never calls use(): global i18n (same as Contact).
export default function NearestDealerScreen({ route }: Props) {
  const { t } = useTranslation();
  const loader = useLoader();
  const alive = useRef(true);
  const [, setTick] = useState(0);
  const rerender = () => {
    if (alive.current) {
      setTick(n => n + 1);
    }
  };
  const [viewport, setViewport] = useState(0);
  // :21-22 / :27 fields: search:any={} (pincode and type are set in ionViewDidLoad), dealerData:any=[], loadData:any=1
  const search = useRef<any>({});
  const dealerData = useRef<any>([]);
  const loadData = useRef<any>(1);
  // The last render that completed: when an Angular binding throws (`dealerData: null`, a row without company_name ...), that DOM stays.
  const lastGood = useRef<{ title: string; body: React.ReactNode[] } | null>(null);

  // :19-26 ionViewDidLoad
  useEffect(() => {
    alive.current = true;
    search.current.pincode = route?.params?.pincode; // :22
    search.current.type = route?.params?.type; // :23
    rerender();
    getNearestDealer(search.current.type); // :25
    return () => {
      alive.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // :29-48 getNearestDealer(type)
  function getNearestDealer(type: any) {
    loader.show(); // dbService.onShowLoadingHandler(): 'Please wait...', dismissOnPageChange: true
    if (!search.current.pincode) {
      search.current.pincode = route?.params?.pincode; // :33
    }
    db.onPostRequestDataFromApi({ pincode: search.current.pincode, type }, 'app_karigar/nearestDealer', db.rootUrl).then(
      (r: any) => {
        loader.hide(); // :37 dbService.onDismissLoadingHandler(), before anything is read
        try {
          dealerData.current = r.dealerData; // :39 (a null body throws here)
          loadData.current = 0;
        } catch {
          // TypeError in Ionic's subscribe callback
        } finally {
          rerender();
        }
      },
      () => {
        loader.hide(); // :44
      },
    );
  }

  // :49-65 getNearestDealerSearch(type): (keyup.enter) on the searchbar; no loader
  function getNearestDealerSearch(type: any) {
    if (!search.current.pincode) {
      search.current.pincode = route?.params?.pincode; // :51
    }
    db.onPostRequestDataFromApi({ pincode: search.current.pincode, type }, 'app_karigar/nearestDealer', db.rootUrl).then(
      (r: any) => {
        try {
          dealerData.current = r.dealerData;
          loadData.current = 0;
        } catch {
          // TypeError in Ionic's subscribe callback
        } finally {
          rerender();
        }
      },
      // NOTE (parity): no loader here, and an HTTP error is swallowed.
      () => {},
    );
  }

  // :67-83 show_loc(data)
  function show_loc(data: any) {
    if (data.lat && data.lng) {
      // launchNavigator.navigate([lat, lng], { app: GOOGLE_MAPS }): the native wrapper (NOTE: the plugin is not in the shipped Topbath build, so the
      // wrapper answers 'unavailable' unless the client's nativeNavigation feature is on). The result is only console.logged in Ionic.
      openNavigation(Number(data.lat), Number(data.lng));
    } else {
      showToast('No Location Found'); // dbService.presentToast
    }
  }

  const dial = (number: string) => {
    Linking.openURL(`tel:${number}`);
  };

  // The template as one render; every binding is read without guards, so a null throws like Angular's change detection would.
  function buildView() {
    const list = dealerData.current;
    const type = search.current.type;
    // html:4 {{ 'Nearest' | translate}} {{search.type | titlecase}}
    const title = collapseWs(`${t('Nearest')} ${interp(titlecase(type))}`).trim();
    const body: React.ReactNode[] = [];

    // html:17-27 `.nothing-here` (*ngIf="!dealerData.length && loadData==0")
    if (!list.length && loadData.current == 0) { // eslint-disable-line eqeqeq
      body.push(
        <View key="nothing" testID="nd-nothing" style={[styles.nothingHere, { height: viewport * 0.8 }]}>
          <Text testID="nd-nothing-text" style={[textStyle(14, 400, md.textColor), styles.nothingText]}>
            {collapseWs(`${t('No')} ${interp(type)} ${t('Found In Your Area Kindly Contact Our Executive')}`)}
          </Text>
          {/* html:21 <a href="tel:+91 8470012000"> (the number is the client's `contact.nearestDealerPhone`) */}
          <Text testID="nd-customer-care" onPress={() => dial(client.contact.nearestDealerPhone)} style={[textStyle(14, 400, md.textColor), styles.nothingLink]}>
            {t('Customer Care')}
          </Text>
        </View>,
      );
    }

    // html:30-62 `.prlist` (*ngIf="search.type=='Dealer'")
    if (type == 'Dealer') { // eslint-disable-line eqeqeq
      body.push(
        <View key="dealers" testID="nd-dealers">
          {list.map((data: any, i: number) => {
            const letter = data.company_name.substring(0, 1).toUpperCase(); // html:34
            return (
              <View key={i} testID={`nd-dealer-${i}`} style={styles.box}>
                <View style={styles.heading}>
                  <View style={styles.distName}>
                    <Text
                      testID={`nd-letter-${i}`}
                      style={[textStyle(14, 700, colors.white, 38), styles.firstLetter, { backgroundColor: N.letterBackground }]}
                    >
                      {letter}
                    </Text>
                    <View style={styles.nameNumber}>
                      <Text testID={`nd-name-${i}`} style={[textStyle(14, 400, md.textColor), styles.name]}>
                        {collapseWs(interp(titlecase(data.company_name)))}
                      </Text>
                      <View style={styles.textWithIc}>
                        <MaterialIcon name="call" size={18} color={md.textColor} style={styles.textRelatIcon} />
                        <Text
                          testID={`nd-mobile-${i}`}
                          onPress={() => dial(interp(data.mobile))}
                          style={[textStyle(14, 400, colors.primary, 32), styles.mobileLink]}
                        >
                          {collapseWs(interp(data.mobile))}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
                {/* html:46-50 `.loacte` is absolute against the box, so it is a child of the box here */}
                {data.lat && data.lng ? (
                  <View style={styles.loacte}>
                    <Pressable testID={`nd-locate-${i}`} onPress={() => show_loc(data)} style={styles.loacteButton}>
                      <SvgXml xml={location1Xml} width={30} height={30} />
                      {/* the inline <img> leaves the line box's descender gap (about 4px) below it */}
                      <View style={styles.strut} />
                    </Pressable>
                  </View>
                ) : null}
                {/* html:60 `.cs-type` (click)="show_loc(data)" */}
                <Pressable testID={`nd-address-${i}`} onPress={() => show_loc(data)} style={styles.csType}>
                  <MaterialIcon name="place" size={16} color={md.textColor} style={styles.csTypeIcon} />
                  <Text style={[textStyle(12, 400, md.textColor), styles.csTypeText]}>
                    {collapseWs(`${interp(titlecase(data.address))} ,${interp(titlecase(data.city))} ,${interp(data.pincode)}, ${interp(titlecase(data.state))}`)}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>,
      );
    }

    // html:64-90 (*ngIf="search.type=='Plumber'")
    if (type == 'Plumber') { // eslint-disable-line eqeqeq
      body.push(
        <View key="plumbers" testID="nd-plumbers" style={styles.plumberList}>
          {list.map((data: any, i: number) => {
            const letter = data.first_name.substring(0, 1).toUpperCase(); // html:70
            return (
              <View key={i} testID={`nd-plumber-${i}`} style={styles.listBox}>
                <View style={styles.mid}>
                  <View style={styles.contentInfo}>
                    <View style={styles.leftInfo}>
                      <View style={styles.circle}>
                        <Text style={textStyle(14, 600, colors.navy)}>{letter}</Text>
                      </View>
                    </View>
                    <View style={styles.rightInfo}>
                      <Text testID={`nd-plumber-name-${i}`} style={textStyle(11, 500, colors.navy)}>
                        {collapseWs(interp(titlecase(data.first_name)))}
                      </Text>
                      <Text testID={`nd-plumber-mobile-${i}`} style={textStyle(11, 400, colors.navy)}>
                        {collapseWs(interp(data.mobile_no))}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.tagInfo}>
                    <Pressable testID={`nd-plumber-dial-${i}`} onPress={() => dial(interp(data.mobile_no))}>
                      <MaterialIcon name="phone" size={20} color={N.callIcon} />
                    </Pressable>
                  </View>
                </View>
                <View style={styles.lower}>
                  <Text style={[textStyle(11, 400, colors.navy), styles.lowerLabel]}>{t('Address')}</Text>
                  <Text testID={`nd-plumber-address-${i}`} style={textStyle(11, 500, colors.navy)}>
                    {collapseWs(`${interp(titlecase(data.address))} ,${interp(titlecase(data.city))} ,${interp(data.pincode)}, ${interp(titlecase(data.state))}`)}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>,
      );
    }
    return { title, body };
  }

  let view: ReturnType<typeof buildView>;
  try {
    view = buildView();
    lastGood.current = view;
  } catch {
    // NOTE (parity): a binding that throws aborts Angular's change detection: the DOM of the last completed render stays.
    view = lastGood.current ?? { title: '', body: [] };
  }

  return (
    <View style={styles.screen}>
      {/* html:1-14 <ion-header class="main-header remove"> */}
      <IonHeader mainHeader remove>
        <IonNavbar color="primary" title={view.title} />
        {/* html:5: <ion-toolbar class="primary-bg"> (no rule defines primary-bg: a plain toolbar) */}
        <IonToolbar>
          <View style={styles.addSearch}>
            <View style={styles.filter}>
              {/* html:8 (keyup.enter) searches, [(ngModel)]="search.pincode"; the box has no `type`: Ionic's default 'search' */}
              <IonSearchbar
                placeholder={collapseWs(t('Search By Pincode'))}
                value={search.current.pincode === undefined || search.current.pincode === null ? undefined : String(search.current.pincode)}
                onChangeText={(v: string) => {
                  search.current.pincode = v;
                }}
                onSubmit={() => getNearestDealerSearch(search.current.type)}
              />
            </View>
          </View>
        </IonToolbar>
      </IonHeader>

      {/* html:16 <ion-content> */}
      <IonContent onLayout={e => setViewport(e.nativeEvent.layout.height)}>{view.body}</IonContent>
    </View>
  );
}
