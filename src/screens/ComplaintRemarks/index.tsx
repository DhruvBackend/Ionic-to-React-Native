// Ported from: src/pages/complaint-remarks/complaint-remarks.html + .ts + .scss (+ .module.ts)
import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { db } from '../../api/client';
import { IonContent } from '../../components/ionic/IonContent';
import { IonList, IonItem } from '../../components/ionic/IonList';
import { IonHeader, IonNavbar } from '../../components/ionic/IonNavbar';
import { IonRefresher, IonRefresherContent } from '../../components/ionic/IonRefresher';
import { Text } from '../../components/ionic/IonText';
import { textStyle } from '../../components/ionic/text';
import { complaintRemarksMd as R } from '../../theme/ionicMdComplaintRemarks';
import { collapseWs, datePipe, interp } from '../../ui/angularPipes';
import { styles } from './styles';

interface Props {
  navigation?: object;
  route?: { params?: { id?: any } };
}

export default function ComplaintRemarksScreen({ route }: Props) {
  const alive = useRef(true);
  // complaint-remarks.ts:11-13 fields
  const [remarks, setRemarks] = useState<any>([]); // complaint_remark:any=[]
  // :27 `this.complaint_id = this.navParams.get('id')`
  const complaintId = route?.params?.id;

  // :26-30 constructor: getComplaintRemark(). ionViewDidLoad only logs.
  // NOTE (parity): complaint-remarks.module.ts has no TranslateModule and the template has no `| translate`: all text is hardcoded English.
  // NOTE (parity): `presentLoading()` (:37-44) is never called (dead code): the page shows no loader.
  useEffect(() => {
    alive.current = true;
    getComplaintRemark();
    return () => {
      alive.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // :46-51 doRefresh(refresher)
  // NOTE (parity): complete() is called right away, without waiting for the response.
  function doRefresh(refresher: { complete: () => void }) {
    getComplaintRemark();
    refresher.complete();
  }

  // :53-62 getComplaintRemark()
  function getComplaintRemark() {
    db.onPostRequestDataFromApi({ complaints_id: complaintId }, 'app_karigar/getComplaintHistoryRemark', db.rootUrl).then(
      (response: any) => {
        if (!response) {
          return; // TypeError at `response.complaintHistory`
        }
        if (alive.current) {
          setRemarks(response.complaintHistory);
        }
      },
      // NOTE (parity): no error callback in Ionic: nothing happens after an HTTP error.
      () => {},
    );
  }

  // NOTE (parity): `*ngFor` over a null / undefined `complaintHistory` (malformed response) draws no rows and does not throw.
  const rows: any[] = Array.isArray(remarks) ? remarks : [];
  const h4 = textStyle(14, 600, R.ink);

  return (
    <View style={styles.screen}>
      {/* html:8-12 */}
      <IonHeader mainHeader remove>
        <IonNavbar color="primary" title="Remark-history" />
      </IonHeader>

      <IonContent>
        {/* html:15-22 */}
        <IonRefresher onRefresh={doRefresh}>
          <IonRefresherContent pullingIcon="arrow-dropdown" pullingText="Pull to refresh" refreshingSpinner="circles" refreshingText="Refreshing..." />
        </IonRefresher>

        {/* html:24-39 */}
        {rows.map((row: any, i: number) => {
          // NOTE (parity): a null row makes Ionic's template throw; RN shows an empty row.
          const r = row ?? {};
          return (
            <IonList key={i} testID={`remark-list-${i}`} style={styles.list}>
              <IonItem button testID={`remark-${i}`} style={styles.item} innerStyle={styles.inner}>
                <View style={styles.label}>
                  <View style={styles.timeTable}>
                    <View style={styles.info}>
                      <Text testID={`remark-${i}-date`} style={[h4, styles.h4]}>
                        {interp(datePipe(r.date_created, 'd MMMM y'))}
                      </Text>
                      <Text testID={`remark-${i}-time`} style={[h4, styles.h4]}>
                        {interp(datePipe(r.date_created, 'h:mm a'))}
                      </Text>
                    </View>
                    <View style={styles.remarkDetail}>
                      <Text testID={`remark-${i}-text`} style={textStyle(14, 400, R.paragraph, 19)}>
                        <Text style={textStyle(14, 600, R.ink, 19)}>Remark:</Text>
                        {collapseWs(` ${interp(r.remark)}`)}
                      </Text>
                    </View>
                  </View>
                </View>
              </IonItem>
            </IonList>
          );
        })}
      </IonContent>
    </View>
  );
}
