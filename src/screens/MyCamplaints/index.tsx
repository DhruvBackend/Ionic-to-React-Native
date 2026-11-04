// Ported from: src/pages/plumber-camplaints/my-camplaints/my-camplaints.html + .ts + .scss (+ .module.ts)
import React, { useEffect, useRef, useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { db } from '../../api/client';
import { IonContent } from '../../components/ionic/IonContent';
import { IonInputItem } from '../../components/ionic/IonInput';
import { IonInfiniteScroll, IonInfiniteScrollContent, type InfiniteScrollHandle } from '../../components/ionic/IonInfiniteScroll';
import { IonList } from '../../components/ionic/IonList';
import { IonHeader, IonNavbar, IonToolbar } from '../../components/ionic/IonNavbar';
import { IonRefresher, IonRefresherContent } from '../../components/ionic/IonRefresher';
import { IonSelectBox, useIonSelect } from '../../components/ionic/IonSelect';
import { MaterialIcon } from '../../components/ionic/MaterialIcon';
import { Text } from '../../components/ionic/IonText';
import { textStyle } from '../../components/ionic/text';
import { myComplaintsMd as C } from '../../theme/ionicMdMyCamplaints';
import { collapseWs, interp, titlecase } from '../../ui/angularPipes';
import { useLoader } from '../../ui/useLoader';
import { noFoundSize, noFoundXml } from '../OfferList/noFound';
import { styles } from './styles';

interface Props {
  navigation: { push: (name: string, params?: object) => void };
  route?: { params?: { type?: any } };
}

// global `.Closed / .Pending / .Reject, .Cancel { color: ... !important }` ([T] 499-516) for `class="{{val.status}}"` on the status `p`
const statusColor = (s: any) => (s == 'Closed' ? C.closed : s == 'Pending' ? C.pending : s == 'Cancel' ? C.cancel : C.inkSoft); // eslint-disable-line eqeqeq

const statusText = (s: any) => (s == 'Pending' || s == 'Closed' || s == 'Cancel' ? s : ''); // eslint-disable-line eqeqeq

export default function MyCamplaintsScreen({ navigation, route }: Props) {
  const { t } = useTranslation(); // re-renders on i18n.changeLanguage, like the `| translate` pipe
  const loader = useLoader();
  const alive = useRef(true);
  const [viewport, setViewport] = useState(0);

  // my-camplaints.ts:19-25 fields. `filter` is ONE object mutated by every call; `data.type` is overwritten by getComplaintlist(type).
  // NOTE (parity): my-camplaints.module.ts has its own TranslateModule.forRoot, but the page never calls setDefaultLang/use(): the language is the app's.
  const dataType = useRef<any>(route?.params?.type); // :34 this.data.type = navParams.get('type')
  const filter = useRef<any>({});
  const [search, setSearch] = useState<any>(undefined); // filter.search (ngModel)
  const [status, setStatus] = useState<any>(undefined); // filter.status (ngModel): undefined until ionViewDidLoad sets ''
  const [flag, setFlag] = useState<any>(''); // flag:any=''
  // `complaint_list : any = []`; null / undefined (malformed) shows the `.data-not` image
  const listRef = useRef<any>([]);
  const [list, setListState] = useState<any>([]);
  const setList = (v: any) => {
    listRef.current = v;
    if (alive.current) {
      setListState(v);
    }
  };

  // :38-43 ionViewDidLoad: presentLoading(); getComplaintlist(this.data.type); filter.status = ''
  // NOTE (parity): the status is set after the first request was built, so that request has no `status` key.
  useEffect(() => {
    alive.current = true;
    presentLoading();
    getComplaintlist(dataType.current);
    filter.current.status = '';
    setStatus('');
    return () => {
      alive.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // :45-52 presentLoading(): 'Please wait...', dismissOnPageChange: true
  function presentLoading() {
    loader.show('Please wait...', { dismissOnPageChange: true });
  }

  // :54-59 doRefresh(refresher)
  // NOTE (parity): complete() is called right away, without waiting for the response.
  function doRefresh(refresher: { complete: () => void }) {
    getComplaintlist(dataType.current);
    refresher.complete();
  }

  // :61-82 getComplaintlist(type)
  function getComplaintlist(type: any) {
    dataType.current = type;
    setFlag(0);
    filter.current.limit = 0;
    db.onPostRequestDataFromApi(
      { plumber_id: db.userStorageData?.id, filter: filter.current, type: dataType.current },
      'app_karigar/getPlumberComplaintList',
      db.rootUrl,
    ).then(
      (response: any) => {
        loader.hide(); // :71 this.loading.dismiss() (only the constructor's loader exists: later calls dismiss nothing)
        if (!response) {
          return; // TypeError at `response['plumberComplaintList']`
        }
        setList(response.plumberComplaintList); // :72 (complaint_count :73 is never read by the template)
      },
      // NOTE (parity): no error callback in Ionic: after an HTTP error the 'Please wait...' loader stays up (until the page changes).
      () => {},
    );
  }

  // :84-105 loadData(infiniteScroll)
  function loadData(infiniteScroll: InfiniteScrollHandle) {
    if (listRef.current == null) {
      return; // `this.complaint_list.length` throws: no request, complete() never runs
    }
    filter.current.limit = listRef.current.length;
    db.onPostRequestDataFromApi(
      { plumber_id: db.userStorageData?.id, filter: filter.current, type: dataType.current },
      'app_karigar/getPlumberComplaintList',
      db.rootUrl,
    ).then(
      (r: any) => {
        if (!r) {
          return; // TypeError at `r['plumberComplaintList']`: complete() never runs
        }
        if (r.plumberComplaintList == '') { // eslint-disable-line eqeqeq
          // NOTE (parity): loose == '': an empty array ends paging until the next getComplaintlist resets `flag`; complete() is not called.
          if (alive.current) {
            setFlag(1);
          }
        } else {
          setTimeout(() => {
            setList(listRef.current.concat(r.plumberComplaintList));
            infiniteScroll.complete();
          }, 1000);
        }
      },
      // NOTE (parity): no error callback in Ionic: the infinite scroll stays in its loading state.
      () => {},
    );
  }

  // :107-125 plumberDetail(id)
  function plumberDetail(id: any) {
    navigation.push('PulmberCustomerDetail', { id, close_com: false });
  }
  // NOTE (parity): `complaint_count` (:25) and `close_com` (:26) are never read by the template. The `.found` div (html:25-27) is empty.

  // `<a class="phone-call" href="tel:...">`: the cordova webview follows the link (nothing bubbles: the anchor has no click handler)
  const dial = (mobile: any) => {
    Linking.openURL(`tel:${interp(mobile)}`);
  };

  const rows: any[] = Array.isArray(list) ? list : [];
  const ink = C.inkSoft;
  const imgH = 100; // `<img>` height 100px (see ComplaintHistory)

  const options = [
    { value: '', label: collapseWs(t('All')) },
    { value: 'Pending', label: collapseWs(t('Pending')) },
    { value: 'Closed', label: collapseWs(t('Closed')) },
    { value: 'Cancel', label: collapseWs(t('Cancel')) },
  ];

  const sel = useIonSelect({
    options,
    value: status,
    onChange: (v: any) => {
      // [(ngModel)]="filter.status" then (ngModelChange)="getComplaintlist(data.type)"
      filter.current.status = v;
      setStatus(v);
      getComplaintlist(dataType.current);
    },
  });

  return (
    <View style={styles.screen}>
      {/* html:1-30 */}
      <IonHeader mainHeader remove>
        <IonNavbar color="primary" title={collapseWs(t('My Complaints'))} />
        <IonToolbar color="primary">
          <View style={styles.serachFilter}>
            <IonList style={styles.list}>
              {/* NOTE (parity): the item has an `ion-input` and an `ion-select`; the select's `button.item-cover` (absolute, 100% x 100%) paints over
                  the whole item, so a tap anywhere opens the select and the search input cannot be focused. */}
              <IonInputItem
                testID="search"
                type="text"
                placeholder={collapseWs(t('Search'))}
                value={search}
                itemStyle={styles.searchItem}
                onChangeText={v => {
                  // [(ngModel)]="filter.search" then (ngModelChange)="getComplaintlist()"
                  // NOTE (parity): called with no argument: `this.data.type = undefined`, so the search (and every later paging / refresh request) sends no `type`.
                  filter.current.search = v;
                  setSearch(v);
                  getComplaintlist(undefined);
                }}
                cover={{ onPress: sel.open }}
                trailing={<IonSelectBox text={sel.text} />}
              />
            </IonList>
          </View>
        </IonToolbar>
      </IonHeader>

      <IonContent onLayout={e => setViewport(e.nativeEvent.layout.height)}>
        {/* html:35-37 `*ngIf="!complaint_list"`: an empty array is truthy, so only a null / undefined list shows the image */}
        {!list ? (
          <View testID="complaint-empty" style={[styles.dataNot, { height: Math.max(viewport - 50, 0) }]}>
            <SvgXml xml={noFoundXml} width={(imgH * noFoundSize.width) / noFoundSize.height} height={imgH} />
          </View>
        ) : null}

        {/* html:39-47 */}
        <IonRefresher onRefresh={doRefresh}>
          <IonRefresherContent pullingIcon="arrow-dropdown" pullingText="Pull to refresh" refreshingSpinner="circles" refreshingText="Refreshing..." />
        </IonRefresher>

        {/* html:49-91 */}
        {list ? (
          <View>
            <View style={styles.plumberCam}>
              {rows.map((val: any, i: number) => {
                // NOTE (parity): a null row (only from a malformed second page, concat(null)) makes Ionic's template throw; RN shows an empty box.
                const v = val ?? {};
                return (
                  <View key={i} testID={`complaint-${i}`} style={[styles.box, i === rows.length - 1 ? styles.boxLast : null]}>
                    <View style={styles.alphabet}>
                      <Text testID={`complaint-${i}-letter`} style={textStyle(14, 600, C.white)}>
                        {v.customerName ? v.customerName[0].toUpperCase() : ''}
                      </Text>
                    </View>
                    <View style={styles.title}>
                      <Pressable testID={`complaint-${i}-name-press`} onPress={() => plumberDetail(v.id)}>
                        <Text testID={`complaint-${i}-name`} style={[textStyle(14, 400, ink), styles.titleH4]}>
                          {interp(titlecase(v.customerName))}
                        </Text>
                      </Pressable>
                      <Pressable testID={`complaint-${i}-mobile-press`} onPress={() => plumberDetail(v.id)}>
                        <Text testID={`complaint-${i}-mobile`} style={textStyle(13, 400, C.phoneBlue)}>
                          {interp(v.customerMobileNo)}
                        </Text>
                      </Pressable>
                      <Pressable testID={`complaint-${i}-dial`} onPress={() => dial(v.customerMobileNo)} style={styles.phoneCall}>
                        <MaterialIcon name="call" size={22} color={C.callGreen} />
                      </Pressable>
                    </View>
                    {/* `class="add mt15"`: `.mt15` = margin-top 15 (!important, main.css) */}
                    <Pressable testID={`complaint-${i}-add`} onPress={() => plumberDetail(v.id)} style={styles.add}>
                      <View style={styles.com}>
                        <Text style={[textStyle(14, 500, ink), styles.h3]}>{collapseWs(t('Address'))}</Text>
                        <Text testID={`complaint-${i}-com`} style={[textStyle(13, 400, ink, 18), styles.addP]}>
                          {`${collapseWs(t('COM'))}#${interp(v.id)}`}
                        </Text>
                      </View>
                      <Text testID={`complaint-${i}-address`} style={[textStyle(13, 400, ink, 18), styles.addP]}>
                        {collapseWs(
                          `${interp(titlecase(v.address))} ${interp(titlecase(v.city))} ${interp(titlecase(v.district))} ${interp(titlecase(v.state))} ${interp(v.pincode)}`,
                        )}
                      </Text>
                    </Pressable>
                    <Pressable testID={`complaint-${i}-problem-press`} onPress={() => plumberDetail(v.id)} style={styles.pro12}>
                      <Text style={[textStyle(13, 500, ink), styles.pro12H4]}>{`${collapseWs(t('Nature Problem'))} :`}</Text>
                      <Text testID={`complaint-${i}-problem`} style={[textStyle(13, 400, ink), styles.shrink]}>
                        {interp(titlecase(v.nature_problem))}
                      </Text>
                    </Pressable>
                    <Pressable testID={`complaint-${i}-status-press`} onPress={() => plumberDetail(v.id)} style={styles.pro12}>
                      <Text style={[textStyle(13, 500, ink), styles.pro12H4]}>{`${collapseWs(t('Status'))} :`}</Text>
                      <Text testID={`complaint-${i}-status`} style={[textStyle(13, 400, statusColor(v.status))]}>
                        {statusText(v.status)}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>

            {/* html:79-86 *ngIf="flag!=1" */}
            {flag != 1 ? ( // eslint-disable-line eqeqeq
              <IonInfiniteScroll threshold="100px" onInfinite={loadData}>
                <IonInfiniteScrollContent loadingSpinner="bubbles" loadingText="Loading more data..." />
              </IonInfiniteScroll>
            ) : null}
          </View>
        ) : null}
      </IonContent>
    </View>
  );
}
