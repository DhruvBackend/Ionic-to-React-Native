// Ported from: src/pages/feedback/feedback.html + .ts + .scss (+ .module.ts)
import React, { useEffect, useRef, useState } from 'react';
import { TextInput, View } from 'react-native';
import { db } from '../../api/client';
import { IonButton } from '../../components/ionic/IonButton';
import { IonContent } from '../../components/ionic/IonContent';
import { Header } from '../../components/ionic/IonNavbar';
import { activeNavNames } from '../../navigation/navigationRef';
import { scssColors } from '../../theme';
import { feedbackMd as F } from '../../theme/ionicMdFeedback';
import { showAlert } from '../../ui/overlays';
import { styles } from './styles';

// app.getActiveNav() page names that feedback.ts:56 looks for, without the 'Page' suffix.
const ROOT_PAGES = ['Home', 'GiftList', 'Transaction', 'Profile', 'MainHome'];

interface Props {
  navigation: {
    reset: (state: object) => void;
    addListener?: (type: 'blur', cb: () => void) => () => void;
    getState?: () => any;
    popToTop?: () => void;
  };
}

export default function FeedbackScreen({ navigation }: Props) {
  // feedback.ts:12 data:any={}; the textarea is [(ngModel)]="data.feedback" (undefined until typed)
  const data = useRef<any>({});
  const [feedback, setFeedback] = useState<string>('');

  // :50-72 ionViewDidLeave. React Navigation's 'blur' fires on a screen change like Ionic's didLeave.
  // NOTE (parity): when the nav that is active after leaving shows one of the root pages (and its previous page is not one of them),
  // this.navCtrl.popToRoot() runs.
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

  // :39-48 showSuccess(text)
  function showSuccess(text: string) {
    showAlert({ title: 'ThankYou!', subTitle: text, buttons: ['OK'] });
  }

  // :28-37 submitFeedback(data)
  // NOTE (parity): no validation and no disabled state: an empty (never typed) textarea submits too; `feedback: undefined` is dropped by
  // JSON.stringify, so the body is just {karigar_id}. No loader. No error callback: after an HTTP error nothing happens (no alert, no navigation).
  // NOTE (parity): any successful answer counts (the response is only logged), whatever its status says.
  function submitFeedback(text: any) {
    db.onPostRequestDataFromApi(
      { karigar_id: db.userStorageData?.id, feedback: text },
      'app_karigar/feedback',
      db.rootUrl,
    ).then(
      () => {
        showSuccess(' Your feedback has been submitted sucessfully'); // NOTE (parity): leading space and typo 'sucessfully'
        // this.navCtrl.setRoot(TabsPage,{index:'0'}): the alert stays up over Tabs
        navigation.reset({ index: 0, routes: [{ name: 'Tabs', params: { index: '0' } }] });
      },
      () => {},
    );
  }

  return (
    <View style={styles.screen}>
      {/* html:1-11. `.main-header.remove`: flat navbar, back button shown, white title. */}
      <Header
        mainHeader
        remove
        color="primary"
        title="Feedback"
        overlay={
          <View style={styles.headerIcons}>
            <IonButton testID="feedback-send" background="transparent" style={styles.hdrIconButton} onPress={() => submitFeedback(data.current.feedback)}>
              {/* NOTE (parity): `assets/icons/sent.svg` does not exist in the Ionic app (404): Chrome's broken image, nothing drawn here.
                  Unverified on the Ionic capture: the 25px-wide box keeps the button size. */}
              <View testID="feedback-sent-img" style={styles.sentImg} />
            </IonButton>
          </View>
        }
      />
      {/* html:13-17 <ion-content padding> */}
      <IonContent padding>
        <View testID="feedback-input" style={styles.feedbackInput}>
          {/* NOTE (parity): bare <textarea> with static text "Write something" inside. ngModel's first writeValue(undefined) sets it to '',
              so the field starts empty and "Write something" is the placeholder. */}
          <TextInput
            testID="feedback-textarea"
            value={feedback}
            onChangeText={text => {
              data.current.feedback = text;
              setFeedback(text);
            }}
            multiline
            placeholder="Write something"
            placeholderTextColor={F.placeholder}
            underlineColorAndroid="transparent"
            style={[styles.textarea, !feedback && styles.textareaPlaceholder, { color: scssColors.black }]}
          />
        </View>
      </IonContent>
    </View>
  );
}
