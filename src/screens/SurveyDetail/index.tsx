// Ported from: src/pages/survey/survey-detail/survey-detail.html + .ts + .scss
import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { db } from '../../api/client';
import { IonButton } from '../../components/ionic/IonButton';
import { IonRadio, IonRadioGroup } from '../../components/ionic/IonChoice';
import { IonContent } from '../../components/ionic/IonContent';
import { IonItem, IonList } from '../../components/ionic/IonList';
import { IonHeader, IonNavbar } from '../../components/ionic/IonNavbar';
import { Text } from '../../components/ionic/IonText';
import { textStyle } from '../../components/ionic/text';
import { colors } from '../../theme';
import { md } from '../../theme/ionicMd';
import { normalLineHeight } from '../../theme/ionicMdOverlays';
import { fontFor } from '../../theme/typography';
import { collapseWs, interp } from '../../ui/angularPipes';
import { showAlert } from '../../ui/overlays';
import { useLoader } from '../../ui/useLoader';
import { styles } from './styles';

interface Props {
  navigation?: object;
  route?: { params?: { id?: any } };
}

// `<ion-radio item-left class="mr5">`: item-left slot, margin-right 5 (see styles.radioStart). IonItem sorts its children by `ionSlot`.
function RadioStart(props: { value: string }) {
  return (
    <View style={styles.radioStart}>
      <IonRadio slot="start" color="primary" value={props.value} />
    </View>
  );
}
RadioStart.ionSlot = 'start';

// [P] `.label-md { font-size: 14px; font-weight: 500 }` (no colour: the kit turns a checked radio's label primary)
const labelText = { ...fontFor(500), fontSize: 14, lineHeight: normalLineHeight(14) };

// NOTE (parity): survey-detail.module.ts has its own TranslateModule.forRoot but the page never calls use(): global i18n (same as Contact).
export default function SurveyDetailScreen({ route }: Props) {
  const { t } = useTranslation();
  const loader = useLoader();
  const alive = useRef(true);
  const [, setTick] = useState(0);
  const rerender = () => {
    if (alive.current) {
      setTick(n => n + 1);
    }
  };
  // :17-24 fields (the '' initial values matter: `detail.length` of '' is 0, `questionCheckCount` shows blank until checkcount() runs)
  const surveyId = useRef<any>(''); // surveyId:any=''
  const surveyDetail = useRef<any>(''); // surveyDetail:any=''
  const detail = useRef<any>(''); // detail:any=''
  const questionCheckCount = useRef<any>(''); // questionCheckCount:any=''
  // The last render that completed: when an Angular binding throws (null `details` / `question`), the DOM of that render stays.
  const lastGood = useRef<{ title: string; hasCount: boolean; body: React.ReactNode[] } | null>(null);

  // :37-43 ionViewDidLoad: surveyId = navParams.get('id'), getSurveyDetail(surveyId), then presentLoading()
  useEffect(() => {
    alive.current = true;
    surveyId.current = route?.params?.id;
    getSurveyDetail(surveyId.current);
    loader.show('Please wait...', { dismissOnPageChange: true });
    return () => {
      alive.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // :47-61 getSurveyDetail(surveyId)
  function getSurveyDetail(id: any) {
    db.onPostRequestDataFromApi({ id: String(id), user_id: db.userStorageData?.id }, 'master/surveyDetail', db.rootUrl).then(
      (response: any) => {
        loader.hide(); // :51 this.loading.dismiss(), before anything is read
        try {
          surveyDetail.current = response.details; // :54 (a null body throws here)
          if (response != null) {
            detail.current = response.details.question; // :58 (details: null throws: detail keeps its value)
          }
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

  // :69-86 checkcount(value): counts the questions that have a selected_answer
  function checkcount() {
    questionCheckCount.current = 0;
    for (let i = 0; i < detail.current.length; i++) {
      if (detail.current[i].selected_answer) {
        questionCheckCount.current++;
      }
    }
    rerender();
  }

  // :88-132 surveySubmit()
  function surveySubmit() {
    if (questionCheckCount.current != detail.current.length) { // eslint-disable-line eqeqeq
      showAlert({
        title: 'Error',
        message: 'All questions fill compulsory. ',
        buttons: [{ text: 'ok', handler: () => {} }], // handler: console.log('Cancel clicked')
      });
      return;
    }
    db.onPostRequestDataFromApi(
      { question: detail.current, survey_id: surveyId.current, user_id: db.userStorageData?.id },
      'master/saveSurveyAnswer',
      db.rootUrl,
    ).then(
      (response: any) => {
        try {
          if (response.msg == 'success') { // eslint-disable-line eqeqeq
            showAlert({
              title: 'Success',
              message: 'Your form Submit Succesfully', // sic
              buttons: [{ text: 'ok', handler: () => {} }],
            });
          }
          // NOTE (parity): any other answer does nothing (no failure message).
        } catch {
          // TypeError on a null body: uncaught error in Ionic's subscribe callback
        }
      },
      // NOTE (parity): no error callback in Ionic: after an HTTP error nothing happens.
      () => {},
    );
  }

  // The template as one render; every binding is read without guards, so a null throws like Angular's change detection would.
  function buildView() {
    const list = detail.current;
    const title = collapseWs(interp(surveyDetail.current.title)); // html:11 {{surveyDetail.title}}
    const hasCount = (!list.length as any) == 0; // eslint-disable-line eqeqeq
    // html:35-47 `ul > li *ngFor` (an `ngFor` over '' / undefined renders nothing)
    const items = (list || []).map((q: any, qi: number) => (
      <View key={qi} testID={`survey-question-${qi}`} style={styles.question}>
        {/* html:37 h2 `{{i+1}}. {{list.question}}` */}
        <Text style={textStyle(14, 500, md.textColor, 20)}>{collapseWs(`${qi + 1}. ${interp(q.question)}`)}</Text>
        {/* html:38-46: one ion-list + radio-group per answer, all bound to the same model list.selected_answer */}
        {(q.answers || []).map((ans: any, ai: number) => (
          <IonList key={ai} style={styles.answerList}>
            <IonRadioGroup
              value={q.selected_answer}
              onChange={v => {
                q.selected_answer = v; // [(ngModel)]="list.selected_answer"
                checkcount(); // (ionChange)="checkcount()"
              }}
            >
              <IonItem
                testID={`survey-ans-${qi}-${ai}`}
                noLines // [P] `.item-md.item-block .item-inner { border-bottom: 0 !important }`
                label={collapseWs(interp(ans.answer))}
                labelStyle={styles.answerLabel}
                labelTextStyle={labelText} // [P] `.label-md { font-size: 14px; font-weight: 500 }`
              >
                {/* html:42 value={{ans.id}}: an interpolated attribute, so a string */}
                <RadioStart value={interp(ans.id)} />
              </IonItem>
            </IonRadioGroup>
          </IonList>
        ))}
      </View>
    ));
    // The screen's own children are listed directly (no Fragment) so that stickyChildIndices [0] is the `.survey-count`.
    const body: React.ReactNode[] = [];
    // html:12-31 `.survey-count` (position: sticky; top: 0). NOTE (parity): the `*ngIf="detail.length == 0"` 'Data not Found' block inside it can
    // never show (the outer ngIf needs a non-empty list): not ported.
    if (hasCount) {
      body.push(
        <View key="count" testID="survey-count" style={styles.surveyCount}>
          <View style={styles.countBox}>
            <Text style={[textStyle(12, 400, colors.white, 20), styles.countLabel]}>{t('Total')}</Text>
            <Text testID="survey-total" style={[textStyle(14, 600, colors.white, 20), styles.countValue]}>
              {interp(list.length)}
            </Text>
          </View>
          <View style={styles.countBox}>
            <Text style={[textStyle(12, 400, colors.white, 20), styles.countLabel]}>{t('Filled')}</Text>
            <Text testID="survey-filled" style={[textStyle(14, 600, colors.white, 20), styles.countValue]}>
              {interp(questionCheckCount.current)}
            </Text>
          </View>
          <View style={styles.countBox}>
            <Text style={[textStyle(12, 400, colors.white, 20), styles.countLabel]}>{t('Not Filled')}</Text>
            <Text testID="survey-not-filled" style={[textStyle(14, 600, colors.white, 20), styles.countValue]}>
              {interp(list.length - questionCheckCount.current)}
            </Text>
          </View>
        </View>,
      );
    }
    // html:34-47
    body.push(
      <View key="que" testID="survey-que">
        {items}
      </View>,
    );
    // html:48-56 NOTE (parity): the empty `<p>{{selected_answer}}</p>` below the button (a component field that is never assigned) has no height.
    if (hasCount) {
      body.push(
        <View key="save" style={styles.padding16}>
          <IonButton testID="survey-save" csBtn onPress={surveySubmit}>
            {t('Save')}
          </IonButton>
        </View>,
      );
    }
    // html:58 <div class="h50">&nbsp;</div>
    body.push(<View key="h50" style={styles.h50} />);
    return { title, hasCount, body };
  }

  let view: ReturnType<typeof buildView>;
  try {
    view = buildView();
    lastGood.current = view;
  } catch {
    // NOTE (parity): a binding that throws (`surveyDetail: null`, `question: null`, a null row) aborts Angular's change detection: the DOM of the
    // last completed render stays.
    view = lastGood.current ?? { title: '', hasCount: false, body: [<View key="h50" style={styles.h50} />] };
  }

  return (
    <View style={styles.screen}>
      {/* html:8-14 <ion-header class="main-header remove"> */}
      <IonHeader mainHeader remove>
        <IonNavbar color="primary" title={view.title} />
      </IonHeader>

      {/* html:16 <ion-content> */}
      <IonContent stickyChildIndices={view.hasCount ? [0] : undefined}>{view.body}</IonContent>
    </View>
  );
}
