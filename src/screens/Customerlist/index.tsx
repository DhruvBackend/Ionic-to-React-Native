// Ported from: src/pages/customerlist/customerlist.html + .ts + .scss (+ .module.ts)
import React, { useEffect, useRef, useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { db } from '../../api/client';
import { IonContent } from '../../components/ionic/IonContent';
import { IonFab, IonFabButton } from '../../components/ionic/IonFab';
import { IonIcon } from '../../components/ionic/IonIcon';
import { IonInfiniteScroll, IonInfiniteScrollContent, type InfiniteScrollHandle } from '../../components/ionic/IonInfiniteScroll';
import { IonHeader, IonNavbar, IonToolbar } from '../../components/ionic/IonNavbar';
import { IonRefresher, IonRefresherContent } from '../../components/ionic/IonRefresher';
import { IonSearchbar } from '../../components/ionic/IonSearchbar';
import { Text } from '../../components/ionic/IonText';
import { textStyle } from '../../components/ionic/text';
import { md } from '../../theme/ionicMd';
import { scssColors } from '../../theme';
import { collapseWs, datePipe, interp, titlecase } from '../../ui/angularPipes';
import { useLoader } from '../../ui/useLoader';
import { styles as gridStyles } from '../ProductDetail/styles';
import { styles } from './styles';

interface Props {
  navigation: { push: (name: string, params?: object) => void };
}

const black = scssColors.black;

export default function CustomerlistScreen({ navigation }: Props) {
  const { t } = useTranslation(); // re-renders on i18n.changeLanguage, like the `| translate` pipe
  const loader = useLoader();
  const filter = useRef<any>({}); // :21 filter:any = {} (one object, mutated by every call)
  const customerRef = useRef<any>(undefined); // :24 customer: any[] (undefined until the first answer)
  const [customer, setCustomer] = useState<any>(undefined);
  const [flag, setFlag] = useState<any>(''); // :20 flag:any=''
  const [search, setSearch] = useState(''); // html:15 [(ngModel)]="filter.search"
  const alive = useRef(true);

  // :27-32 constructor. NOTE (parity): ionViewDidLoad (:34) only logs: not ported.
  useEffect(() => {
    alive.current = true;
    filter.current.sales_boy_id = db.userStorageData?.id; // :28
    presentLoading(); // :29
    getCustomer(''); // :30
    return () => {
      alive.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // :38-45 presentLoading(): content 'Please wait...', dismissOnPageChange: true
  function presentLoading() {
    loader.show();
  }

  // :47-51 doRefresh(refresher)
  // NOTE (parity): complete() is called right away, without waiting for the response; getCustomer resets flag so the infinite scroll returns.
  function doRefresh(refresher: { complete: () => void }) {
    getCustomer('');
    refresher.complete();
  }

  // :53-56 onCancel(event): only console.log (bound to keyup.enter, html:16)
  function onCancel() {}

  // :58-74 getCustomer(search)
  function getCustomer(searchText: any) {
    setFlag(0); // :60
    filter.current.limit = 0; // :61
    filter.current.search = searchText; // :62
    setSearch(searchText);
    db.onPostRequestDataFromApi({ filter: filter.current }, 'app_karigar/sales_boy_customer_list', db.rootUrl).then(
      (response: any) => {
        loader.hide(); // :67 this.loading.dismiss() (before the model is assigned)
        // NOTE (parity): a null body throws at response.karigars after the loader is gone: nothing else happens.
        if (response == null) {
          return;
        }
        customerRef.current = response.karigars; // :68
        if (alive.current) {
          setCustomer(response.karigars);
        }
      },
      // NOTE (parity): no error callback in Ionic: after an HTTP error the 'Please wait...' loader stays up (until the page changes).
      () => {},
    );
  }

  // :76-97 loadData(infiniteScroll)
  function loadData(infiniteScroll: InfiniteScrollHandle) {
    // NOTE (parity): `this.customer.length` throws while customer is undefined/null (before or after a malformed answer): the handler dies
    // before the request and the infinite scroll stays in its loading state.
    if (customerRef.current == null) {
      return;
    }
    filter.current.limit = customerRef.current.length; // :78 the next offset
    db.onPostRequestDataFromApi({ filter: filter.current }, 'app_karigar/sales_boy_customer_list', db.rootUrl).then(
      (r: any) => {
        // NOTE (parity): a null body throws at r.karigars: nothing happens (the infinite scroll stays loading).
        if (r == null) {
          return;
        }
        const resData = r.karigars; // :82
        // :84 `resData == ''` (loose): '' and [] both equal '' in JS, so an empty page ends paging until the next search/refresh.
        if (resData == '') { // eslint-disable-line eqeqeq
          if (alive.current) {
            setFlag(1);
          }
        } else {
          setTimeout(() => {
            // NOTE (parity): `this.customer.concat(...)` on a null list throws inside the timer: complete() never runs.
            if (customerRef.current == null) {
              return;
            }
            const next = customerRef.current.concat(resData); // :91
            customerRef.current = next;
            if (alive.current) {
              setCustomer(next);
            }
            infiniteScroll.complete();
          }, 1000);
        }
      },
      // NOTE (parity): no error callback in Ionic: the infinite scroll stays in its loading state after an HTTP error.
      () => {},
    );
  }

  // :100-102 goToDetail(id)
  function goToDetail(id: any) {
    navigation.push('Customerdetail', { id });
  }

  // :104-106 goOnCustomerAdd()
  function goOnCustomerAdd() {
    navigation.push('Customeradd');
  }

  const rows: any[] = Array.isArray(customer) ? customer : [];

  return (
    <View style={styles.screen}>
      {/* html:7-20 <ion-header class="main-header remove" no-border> */}
      <IonHeader mainHeader remove noBorder>
        <IonNavbar color="primary" title={collapseWs(t('Customer'))} />
        {/* html:12 <ion-toolbar class="toolbarHeight" color="primary"> */}
        <IonToolbar color="primary" toolbarHeight>
          <View style={gridStyles.addSearch}>
            <View style={gridStyles.filter}>
              {/* html:14-16 (ngModelChange) searches on EVERY keystroke, no debounce; (keyup.enter) only logs */}
              <IonSearchbar
                type="search"
                placeholder="Search"
                value={search}
                onChangeText={(v: string) => {
                  filter.current.search = v;
                  setSearch(v);
                  getCustomer(v);
                }}
                onSubmit={onCancel}
              />
            </View>
          </View>
        </IonToolbar>
      </IonHeader>

      {/* html:22 <ion-content padding>; the <ion-fab> is Ionic's fixed content */}
      <IonContent
        padding
        fixedContent={
          // html:55-57 (click) is on the <ion-fab> element
          <IonFab horizontal="right" vertical="bottom">
            <IonFabButton color="primary" icon="add" onPress={goOnCustomerAdd} />
          </IonFab>
        }
      >
        {/* html:23-30 */}
        <IonRefresher onRefresh={doRefresh}>
          <IonRefresherContent pullingIcon="arrow-dropdown" pullingText="Pull to refresh" refreshingSpinner="circles" refreshingText="Refreshing..." />
        </IonRefresher>

        {/* html:33-53 <div class="main-history padding0"> */}
        <View>
          {rows.map((row: any, i: number) => (
            // html:34 (click)="goToDetail(row.id)"
            // NOTE (parity): html:51 `*ngIf="customer.length == 0"` (the no_found image) sits INSIDE the *ngFor row, so it can never show:
            // an empty list is a blank page.
            <Pressable key={i} testID={`customer-item-${i}`} style={styles.csList} onPress={() => goToDetail(row.id)}>
              <View style={styles.middleBlock}>
                <View style={styles.dateStatus}>
                  {/* html:37 `.middle-block p { font-size: 12px; line-height: 18px }` */}
                  <Text testID={`customer-date-${i}`} style={textStyle(12, 400, md.textColor, 18)}>
                    <Text style={textStyle(12, 700, md.textColor, 18)}>{`${collapseWs(t('Date Created'))}:`}</Text>
                    {datePipe(row.date_created, 'd MMMM y')}
                  </Text>
                </View>
              </View>

              <View style={styles.topBlock}>
                {/* `.cs-list .top-block p { font-size: 14px; color: #000; font-weight: 600 }` */}
                <Text testID={`customer-name-${i}`} style={textStyle(14, 600, black)}>
                  {interp(titlecase(row.first_name))}
                </Text>
                <View style={styles.numberBlock}>
                  <Text testID={`customer-mobile-${i}`} style={textStyle(12, 400, md.textColor, 20)}>
                    {interp(row.mobile_no)}
                  </Text>
                  {/* html:46 <a class="dialer" href="tel:{{row.mobile_no}}">. NOTE (parity): the click also bubbles to the card's goToDetail. */}
                  <Pressable
                    testID={`customer-dialer-${i}`}
                    style={styles.dialer}
                    onPress={() => {
                      goToDetail(row.id);
                      Linking.openURL(`tel:${interp(row.mobile_no)}`);
                    }}
                  >
                    <IonIcon name="md-call" size={20} color={md.linkColor} />
                  </Pressable>
                </View>
                <Text testID={`customer-address-${i}`} style={textStyle(14, 600, black)}>
                  {`${interp(titlecase(row.address))} ${interp(titlecase(row.state))} ${interp(titlecase(row.district))} ${interp(titlecase(row.city))} ${interp(row.pincode)}`}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* html:58-64 *ngIf="flag!=1" */}
        {flag != 1 ? ( // eslint-disable-line eqeqeq
          <IonInfiniteScroll threshold="100px" onInfinite={loadData}>
            <IonInfiniteScrollContent loadingSpinner="bubbles" loadingText="Loading more data..." />
          </IonInfiniteScroll>
        ) : null}
      </IonContent>
    </View>
  );
}
