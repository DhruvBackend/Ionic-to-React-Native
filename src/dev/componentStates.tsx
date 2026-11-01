// DEVELOPMENT ONLY: the RN twin of the Ionic harness page parity/reference/gallery/parity-gallery.ts.txt. Each id renders ONE component
// state with the kit replicas, with the same inputs the Ionic page gets, for the parity states `_components.<id>`
// (parity/states.d/_components.json). Opened by the debug route `_ComponentState`:
//   adb shell am start -a android.intent.action.VIEW -d 'topbathrn://open?screen=_ComponentState&params={"id":"alert-plain"}'
// __tests__/componentStates.test.ts keeps the id lists of both sides and of the states file identical.
//
// Determinism (same as the Ionic side): no autoplay, toasts and loaders without a duration, no typing. The loading spinners cannot be
// frozen on RN, so the spinner phase differs in `loading-default` and `infinite-scroll` (expected).
import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ImageViewer } from '../components/ImageViewer';
import { IonButton } from '../components/ionic/IonButton';
import { buttonMd } from '../theme/ionicMdContent';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
} from '../components/ionic/IonCard';
import {
  IonCheckbox,
  IonRadio,
  IonRadioGroup,
} from '../components/ionic/IonChoice';
import {
  IonCol,
  IonContent,
  IonGrid,
  IonRow,
} from '../components/ionic/IonContent';
import { IonDatetime } from '../components/ionic/IonDatetime';
import { IonFab, IonFabButton } from '../components/ionic/IonFab';
import {
  IonInfiniteScroll,
  IonInfiniteScrollContent,
} from '../components/ionic/IonInfiniteScroll';
import { IonInputItem } from '../components/ionic/IonInput';
import { IonItem, IonList, IonListHeader } from '../components/ionic/IonList';
import {
  Header,
  IonBarButton,
  IonHeader,
  IonToolbar,
} from '../components/ionic/IonNavbar';
import { IonSearchbar } from '../components/ionic/IonSearchbar';
import { IonSegment, IonSegmentButton } from '../components/ionic/IonSegment';
import { IonSelect } from '../components/ionic/IonSelect';
import { IonSlide, IonSlides } from '../components/ionic/IonSlides';
import { IonTabButton, IonTabRow } from '../components/ionic/IonTabs';
import {
  IonicSelectable,
  type SelectableHandle,
} from '../components/ionic/IonicSelectable';
import { MaterialIcon } from '../components/ionic/MaterialIcon';
import { tabsMd } from '../theme/ionicMdPage';
import { fontFor } from '../theme/typography';
import { tabsFor } from '../navigation/tabs';
import {
  showActionSheet,
  showAlert,
  showLoading,
  showToast,
} from '../ui/overlays';
import { SAMPLE_IMAGE } from './gallery/sampleImage';

type Handle = { dismiss(): void } | void;

// Same data as the Ionic page (STATES / EXECUTIVES in parity-gallery.ts.txt).
const STATES = [
  'Delhi',
  'Haryana',
  'Punjab',
  'Rajasthan',
  'Uttar Pradesh',
  'Uttarakhand',
];
const STATE_OPTIONS = STATES.map(s => ({ label: s, value: s }));
const EXECUTIVES = [
  'Ramesh Kumar',
  'Suresh Verma',
  'Anita Sharma',
  'Mohit Gupta',
  'Pooja Singh',
  'Rahul Jain',
].map((n, i) => ({ id: i + 1, first_name: n }));

// ---- overlays: opened on mount, dismissed on unmount. Options are the Topbath call sites (cited in parity-gallery.ts.txt) ----
export const OVERLAY_OPENERS: Record<string, () => Handle> = {
  'alert-plain': () =>
    showAlert({
      title: 'Alert!',
      cssClass: 'action-close',
      subTitle: 'Coupon Already Used',
      buttons: ['OK'],
    }),
  'alert-message': () =>
    showAlert({
      title: 'Message!',
      cssClass: 'action-close',
      subTitle: 'Order placed successfully',
      buttons: ['OK'],
    }),
  'alert-full': () =>
    showAlert({
      title: 'Are You Sure?',
      subTitle: 'Your Order Data Will Be Discarded ',
      message: 'This is a longer message line to show the grey message text.',
      buttons: [{ text: 'Cancel', role: 'cancel' }, { text: 'Confirm' }],
    }),
  'alert-confirm': () =>
    showAlert({
      title: 'Are You Sure?',
      subTitle: 'Your Order Data Will Be Discarded ',
      cssClass: 'action-close',
      buttons: [
        { text: 'Cancel', role: 'cancel', handler: () => undefined },
        {
          text: 'Confirm',
          cssClass: 'close-action-sheet',
          handler: () => undefined,
        },
      ],
    }),
  'alert-radio': () =>
    showAlert({
      inputs: [
        { type: 'radio', label: 'Coupon Scan', value: 'scan', checked: true },
        { type: 'radio', label: 'Enter Coupon Code', value: 'code' },
      ],
      buttons: ['Cancel', { text: 'OK', handler: () => undefined }],
    }),
  'alert-checkbox': () =>
    showAlert({
      title: 'Pick',
      inputs: [
        { type: 'checkbox', label: 'One', value: '1', checked: true },
        { type: 'checkbox', label: 'Two', value: '2' },
        { type: 'checkbox', label: 'Three', value: '3' },
      ],
      buttons: ['Cancel', { text: 'OK', handler: () => undefined }],
    }),
  'alert-text-input': () =>
    showAlert({
      title: 'Login',
      inputs: [
        { name: 'username', placeholder: 'Username' },
        { name: 'password', placeholder: 'Password', type: 'password' },
      ],
      buttons: ['Cancel', { text: 'Login', handler: () => undefined }],
    }),
  'alert-3-buttons': () =>
    showAlert({
      title: 'Three',
      message: 'Vertical buttons',
      buttons: ['One', 'Two', 'Three'],
    }),
  'alert-version-update': () =>
    showAlert({
      title: 'Update Available',
      message:
        'A newer version of this app is available for download. Please update it from PlayStore !',
      buttons: [
        { text: 'Cancel', handler: () => undefined },
        { text: 'Update Now', handler: () => undefined },
      ],
    }),
  'alert-modal': () =>
    showAlert({
      title: 'Stop Time',
      message: 'Do you want to stop work time?',
      cssClass: 'alert-modal',
      buttons: [
        { text: 'Yes', handler: () => undefined },
        { text: 'No', role: 'cancel', handler: () => undefined },
      ],
    }),
  'loading-default': () =>
    showLoading({ content: 'Please wait...', dismissOnPageChange: true }),
  'loading-gif': () =>
    showLoading({
      spinner: 'hide',
      content: '<img src="./assets/imgs/gif.svg" class="h55" />',
    }),
  'toast-bottom': () =>
    showToast('Your Data Is Safe', { duration: 0, position: 'bottom' }),
  'toast-top': () =>
    showToast('Please Allow Location !!', { duration: 0, position: 'top' }),
  'toast-middle': () =>
    showToast('Middle toast', { duration: 0, position: 'middle' }),
  'toast-close': () =>
    showToast('With close button', {
      duration: 0,
      position: 'bottom',
      showCloseButton: true,
    }),
  'actionsheet-plain': () =>
    showActionSheet({
      title: 'Choose',
      buttons: [
        { text: 'First' },
        { text: 'Second' },
        { text: 'Cancel', role: 'cancel' },
      ],
    }),
  'actionsheet-icons': () =>
    showActionSheet({
      title: 'Profile photo',
      cssClass: 'cs-actionsheet',
      buttons: [
        {
          cssClass: 'sheet-m',
          text: 'Camera',
          icon: 'camera',
          handler: () => undefined,
        },
        {
          cssClass: 'sheet-m1',
          text: 'Gallery',
          icon: 'image',
          handler: () => undefined,
        },
        {
          cssClass: 'cs-cancel',
          text: 'Cancel',
          role: 'cancel',
          handler: () => undefined,
        },
      ],
    }),
};

function OverlayState({ id }: { id: string }) {
  // The Ionic gallery opens the overlay from ionViewDidEnter (after the page transition), so a
  // dismissOnPageChange loader is not dismissed by the transition's own viewDidLeave. IonStack's
  // page-change notification fires 280 ms after the push (RootNavigator), hence the 400 ms.
  useEffect(() => {
    let h: { dismiss(): void } | void;
    const t = setTimeout(() => {
      h = OVERLAY_OPENERS[id]();
    }, 400);
    return () => {
      clearTimeout(t);
      h?.dismiss();
    };
  }, [id]);
  return <IonContent />;
}

// ---- helpers shared by the markup states ----
const noop = () => undefined;
const FIELD = { backgroundColor: '#F8FFFC', padding: 16, flexGrow: 1 }; // .main-field (variables.scss:821-827)

// <div class="main-field"><div class="cs-form mb10"><ion-list>...
function MainField({ children }: { children: React.ReactNode }) {
  return (
    <View style={FIELD}>
      <View style={styles.mb10}>
        <IonList>{children}</IonList>
      </View>
    </View>
  );
}

function BlankPage({ header }: { header: React.ReactNode }) {
  return (
    <>
      {header}
      <IonContent />
    </>
  );
}

// ---- states that render markup ----
const MARKUP: Record<string, () => React.ReactElement> = {
  'navbar-main-remove': () => (
    <BlankPage
      header={
        <Header
          mainHeader
          remove
          color="primary"
          title="my offer"
          showBack
          end={<IonBarButton icon="md-add-circle" color="light" />}
        />
      }
    />
  ),
  'navbar-main': () => (
    <BlankPage
      header={
        <Header
          mainHeader
          color="primary"
          title="Offers"
          showBack
          end={<IonBarButton icon="md-add-circle" />}
        />
      }
    />
  ),
  'navbar-plain': () => (
    <BlankPage
      header={
        <Header
          title="Plain navbar"
          showBack
          end={<IonBarButton icon="md-more" />}
        />
      }
    />
  ),
  'navbar-primary-end': () => (
    <BlankPage
      header={
        <Header
          color="primary"
          title="Executive Detail"
          showBack
          end={<IonBarButton icon="md-more" color="light" />}
        />
      }
    />
  ),
  'navbar-h80-white': () => (
    <BlankPage header={<Header color="white" tall showBack />} />
  ),

  'tabs-plumber': () => <TabsPage role="Plumber" />,
  'tabs-sales-exec': () => <TabsPage role="Sales_Executive" />,
  'tabs-customer': () => <TabsPage role="Customer" />,

  'segment-tab-btn': () => (
    <BlankPage
      header={
        <IonHeader>
          <IonToolbar color="white">
            <IonSegment inTabBtn value="Pending">
              <IonSegmentButton value="Pending">Pending</IonSegmentButton>
              <IonSegmentButton value="Closed">Closed</IonSegmentButton>
              <IonSegmentButton value="Cancel">Cancel</IonSegmentButton>
            </IonSegment>
          </IonToolbar>
        </IonHeader>
      }
    />
  ),
  'segment-default': () => (
    <BlankPage
      header={
        <IonHeader>
          <IonToolbar color="light">
            <IonSegment value="Pending">
              <IonSegmentButton value="Pending">Pending</IonSegmentButton>
              <IonSegmentButton value="Closed">Closed</IonSegmentButton>
              <IonSegmentButton value="Cancel">Cancel</IonSegmentButton>
            </IonSegment>
          </IonToolbar>
        </IonHeader>
      }
    />
  ),

  // <div class="search add-search"> (margin 0, max-height 68, padding 0) > <div class="filter"> (flex, width 100%)
  'searchbar-add-search': () => (
    <BlankPage
      header={
        <IonHeader>
          <IonToolbar color="primary" toolbarHeight>
            <View style={styles.addSearch}>
              <View style={styles.filter}>
                <IonSearchbar
                  type="search"
                  placeholder="Search"
                  context="addSearch"
                />
              </View>
            </View>
          </IonToolbar>
        </IonHeader>
      }
    />
  ),
  'searchbar-gift-list': () => (
    <IonContent padding>
      <View style={styles.spacer40} />
      {/* <div class="search">: `.search { position: relative; padding-left: 16px; margin-top: -23px; display: flex; max-height: 40px }` (main.css) */}
      <View style={styles.giftSearch}>
        <IonSearchbar type="text" context="search" />
      </View>
    </IonContent>
  ),
  'searchbar-bare': () => (
    <BlankPage
      header={
        <IonHeader>
          <IonToolbar>
            <IonSearchbar context="bare" />
          </IonToolbar>
        </IonHeader>
      }
    />
  ),

  'buttons-solid': () => (
    <IonContent padding>
      <View>
        <IonButton color="primary" block round style={styles.mb16}>
          Submit
        </IonButton>
      </View>
      <View style={styles.row}>
        <IonButton>Default</IonButton>
      </View>
      <View>
        <IonButton full color="primary">
          Full
        </IonButton>
      </View>
      <View>
        <IonButton color="primary" block round disabled>
          Disabled
        </IonButton>
      </View>
    </IonContent>
  ),
  'buttons-icons-outline': () => (
    <IonContent padding>
      <View style={styles.row}>
        <IonButton iconOnly="add" color="light" />
      </View>
      <View style={styles.row}>
        <IonButton color="danger" iconStart="add" background={buttonMd.greenColorBackground}>
          Scan
        </IonButton>
      </View>
      <View style={styles.row}>
        <IonButton kind="clear" small>
          Small
        </IonButton>
      </View>
      <View style={styles.row}>
        <IonButton kind="outline">Out</IonButton>
      </View>
    </IonContent>
  ),
  'buttons-cs': () => (
    <IonContent padding>
      <View style={styles.row}>
        <IonButton csBtn style={styles.mb50}>
          Save
        </IonButton>
      </View>
      <View style={styles.row}>
        <IonButton csBtn reBtn style={styles.mt32}>
          Update
        </IonButton>
      </View>
      <View>
        <IonButton full round pdfBtn>
          <MaterialIcon
            name="picture_as_pdf"
            size={24}
            color="#ffffff"
            style={styles.pdfIcon}
          />
          {' Generate PDF'}
        </IonButton>
      </View>
    </IonContent>
  ),

  'list-radio': () => (
    <IonContent>
      <IonList>
        <IonRadioGroup value="Plumber">
          <IonListHeader borderHeading>Select Registration Type</IonListHeader>
          {[
            ['Plumber', 'Plumber'],
            ['Seller', 'Sales_Boy'],
            ['Dealer', 'Dealer'],
          ].map(([label, value]) => (
            <IonItem key={value} label={label}>
              <IonRadio color="primary" value={value} />
            </IonItem>
          ))}
        </IonRadioGroup>
      </IonList>
    </IonContent>
  ),
  'list-checkbox': () => (
    <IonContent>
      <IonList>
        <IonItem label="Same as Working Address">
          <IonCheckbox color="dark" />
        </IonItem>
        <IonItem>
          <IonCheckbox color="secondary" checked />
        </IonItem>
      </IonList>
    </IonContent>
  ),

  'form-cs-input': () => (
    <IonContent contentStyle={styles.grow}>
      <MainField>
        <IonInputItem
          variant="csInput"
          floating
          label="Name"
          requiredMark
          value=""
        />
        <IonInputItem
          variant="csInput"
          floating
          label="City"
          value="Gurugram"
        />
        <IonInputItem
          variant="csInput"
          floating
          label="Pincode"
          type="tel"
          maxLength={6}
          value="12"
          error
          validation={{ valid: true }} // [(ngModel)] with a value: ng-valid, so the last item's bottom border is green
        />
      </MainField>
    </IonContent>
  ),
  'input-plain': () => (
    <IonContent>
      <IonList>
        {/* [(ngModel)] on the Ionic side: ng-valid + a value draws the green md underline */}
        <IonInputItem
          floating
          label="Mobile"
          type="tel"
          value="98765"
          validation={{ valid: true }}
        />
        <IonInputItem placeholder="Search" value="" />
      </IonList>
    </IonContent>
  ),
  'form-edit': () => (
    <IonContent>
      {/* <div class="edit"> : `.edit { margin: 0 16px }` (main.css) */}
      <View style={styles.editWrap}>
        <IonList>
          <IonSelect
            variant="editCsNormalSelect"
            itemStyle={styles.mt16mb0} // class="cs-normal-select mt16 mb0" (both !important)
            label="Select type"
            placeholder="Select Type"
            options={[
              { label: 'Full Day', value: 'Full Day' },
              { label: 'Half Day', value: 'Half Day' },
            ]}
            value="Full Day"
          />
          <IonInputItem
            variant="edit"
            floating
            label="Subject *"
            placeholder="Enter Subject"
            value=""
          />
          <IonInputItem
            variant="edit"
            floating
            label="Name"
            value="Ramesh Kumar"
          />
          <IonDatetime
            variant="edit"
            floating
            label="Leave Start Date *"
            displayFormat="MMM DD, YYYY"
            placeholder="Select Leave Start Date"
            value=""
          />
          <IonInputItem
            variant="editTextarea"
            floating
            label="Description"
            textarea
            placeholder="Enter Description"
            value=""
          />
        </IonList>
      </View>
    </IonContent>
  ),

  // pickers: the closed fields; the open ids below are opened by rnAction (select, datetime) or the ref (selectable)
  'selectable-closed': () => <SelectableState open={false} />,
  'select-open': () => (
    <IonContent contentStyle={styles.grow}>
      <MainField>
        <IonSelect
          testID="cs-select-state"
          variant="csSelect"
          label="State"
          options={STATE_OPTIONS}
          value="Haryana"
        />
      </MainField>
    </IonContent>
  ),
  'datetime-open': () => (
    <IonContent contentStyle={styles.grow}>
      <MainField>
        <IonDatetime
          testID="cs-date-dob"
          variant="csDate"
          label="Date of Birth"
          displayFormat="DD/MM/YYYY"
          max="2026-12-31"
          value="1990-05-15"
        />
      </MainField>
    </IonContent>
  ),
  'selectable-open': () => <SelectableState open />,
  'selectable-search': () => <SelectableState open search="Su" />,

  'card-grid': () => (
    <IonContent>
      <IonCard>
        <IonCardHeader>Customer survey</IonCardHeader>
        <IonCardContent afterHeader>Card content text</IonCardContent>
      </IonCard>
      <IonGrid>
        <IonRow>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thr', 'Fri', 'Sat'].map(d => (
            <IonCol key={d} col={1}>
              <Text style={styles.colText}>{d}</Text>
            </IonCol>
          ))}
        </IonRow>
      </IonGrid>
    </IonContent>
  ),
  fab: () => (
    <IonContent
      fixedContent={
        <>
          <IonFab horizontal="right" vertical="bottom">
            <IonFabButton color="primary" icon="add" />
          </IonFab>
          <IonFab horizontal="left" vertical="top">
            <IonFabButton color="danger" mini icon="add" />
          </IonFab>
        </>
      }
    />
  ),
  'infinite-scroll': () => <InfiniteState />,
  slides: () => (
    <IonContent>
      <View>
        <IonSlides pager>
          {['#e57373', '#64b5f6', '#81c784'].map(c => (
            <IonSlide key={c}>
              <View style={[styles.slide, { backgroundColor: c }]} />
            </IonSlide>
          ))}
        </IonSlides>
      </View>
    </IonContent>
  ),
};

// tabs.html: the tab bar of one role set with tab 0 selected; the page above it is blank. The bar styles are IonTabBar's.
function TabsPage({ role }: { role: string }) {
  return (
    <View style={styles.tabsPage} testID="component-state-tabs">
      <View style={styles.grow} />
      <IonTabRow testID="ion-tabbar" style={styles.tabbar}>
        {tabsFor(role).map((t, i) => (
          <IonTabButton
            key={t.icon}
            icon={t.icon}
            label={t.title}
            selected={i === 0}
            onPress={noop}
          />
        ))}
      </IonTabRow>
    </View>
  );
}

// registration.html:243-254 inside .main-field; open / search drive the ref the way a tap and typing would.
function SelectableState({ open, search }: { open: boolean; search?: string }) {
  const ref = useRef<SelectableHandle>(null);
  useEffect(() => {
    if (!open) {
      return;
    }
    const t = setTimeout(() => {
      ref.current?.open();
      if (search) {
        setTimeout(() => ref.current?.search(search), 400);
      }
    }, 100);
    return () => clearTimeout(t);
  }, [open, search]);
  return (
    <IonContent contentStyle={styles.grow}>
      <MainField>
        <IonicSelectable
          ref={ref}
          testID="cs-selectable-exec"
          variant="csSelect"
          label="Select Sales Executive (optional)"
          items={EXECUTIVES}
          itemValueField="first_name"
          itemTextField="first_name"
          hasVirtualScroll
          canSearch
          canClear
          value={null}
          onChange={noop}
        />
      </MainField>
    </IonContent>
  );
}

// dealer-discount.html:36-39 after 20 fixed-height rows, scrolled to the end: the real infinite scroll enters `loading` and stays there.
function InfiniteState() {
  const content = useRef<React.ComponentRef<typeof IonContent>>(null);
  useEffect(() => {
    // the scroll puts the infinite scroll into `loading`; its content grows the page, so scroll to the end again (same as the Ionic page)
    const t = setTimeout(
      () => content.current?.scrollToEnd({ animated: false }),
      300,
    );
    const t2 = setTimeout(
      () => content.current?.scrollToEnd({ animated: false }),
      900,
    );
    // The Ionic reference scrolls to the end AFTER body.android-15 shrank the page (its page opens late in the run); RN's Android 15
    // frame (ANDROID_15_DELAY_MS after app start) shrinks the ScrollView after the first two scrolls, which would leave the end cut off.
    const t3 = setTimeout(
      () => content.current?.scrollToEnd({ animated: false }),
      3000,
    );
    return () => {
      clearTimeout(t);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);
  return (
    <IonContent ref={content}>
      {Array.from({ length: 20 }, (_, i) => (
        <View key={i} style={styles.infRow}>
          <Text style={styles.infText}>Row {i + 1}</Text>
        </View>
      ))}
      <IonInfiniteScroll threshold="100px" onInfinite={noop}>
        <IonInfiniteScrollContent
          loadingSpinner="bubbles"
          loadingText="Loading more data..."
        />
      </IonInfiniteScroll>
      <View style={styles.h80} />
    </IonContent>
  );
}

// ImageViewer: the ViewProfilePage modal over a blank page (the Ionic side opens it from ionViewDidEnter).
function ImageViewerState() {
  const [visible, setVisible] = React.useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);
  return (
    <>
      <IonContent />
      <ImageViewer
        uri={SAMPLE_IMAGE}
        visible={visible}
        onClose={() => setVisible(false)}
      />
    </>
  );
}

export const COMPONENT_STATE_IDS: string[] = [
  ...Object.keys(OVERLAY_OPENERS),
  'image-viewer',
  ...Object.keys(MARKUP),
];

export function renderComponentState(id: string): React.ReactElement | null {
  if (OVERLAY_OPENERS[id]) {
    return <OverlayState id={id} />;
  }
  if (id === 'image-viewer') {
    return <ImageViewerState />;
  }
  const make = MARKUP[id];
  return make ? make() : null;
}

const styles = StyleSheet.create({
  grow: { flexGrow: 1 },
  mb10: { marginBottom: 10 },
  editWrap: { marginHorizontal: 16 },
  giftSearch: { flexDirection: 'row', paddingLeft: 16, marginTop: -23, maxHeight: 40 },
  mt16mb0: { marginTop: 16, marginBottom: 0 },
  mb16: { marginBottom: 16 },
  mb50: { marginBottom: 50 },
  mt32: { marginTop: 32 },
  row: { flexDirection: 'row' }, // a block wrapper of an inline-block button: the button keeps its own width
  h80: { height: 80 }, // dealer-discount.html:41 <div class="h80">
  spacer40: { height: 40 },
  slide: { height: 120 },
  addSearch: { margin: 0, maxHeight: 68, padding: 0 },
  filter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  pdfIcon: { marginRight: 10 },
  colText: { ...fontFor(400), fontSize: 14, color: '#000' },
  tabsPage: { flex: 1, backgroundColor: '#fff' },
  tabbar: {
    flexDirection: 'row',
    backgroundColor: tabsMd.tabbar.background,
    boxShadow: tabsMd.tabbar.shadow,
    zIndex: 10,
  },
  infRow: {
    height: 44,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    justifyContent: 'center',
  },
  infText: { ...fontFor(400), fontSize: 14, color: '#000' },
});
