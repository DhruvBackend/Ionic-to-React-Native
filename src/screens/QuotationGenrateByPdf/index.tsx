// Ported from: src/pages/quotation-genrate-by-pdf/quotation-genrate-by-pdf.html + .ts + .scss
import React, { useEffect, useRef, useState } from 'react';
import { Image, View } from 'react-native';
import { db } from '../../api/client';
import { IonButton } from '../../components/ionic/IonButton';
import { IonContent } from '../../components/ionic/IonContent';
import { IonFabButton } from '../../components/ionic/IonFab';
import { IonInputItem } from '../../components/ionic/IonInput';
import { IonList } from '../../components/ionic/IonList';
import { IonHeader, IonNavbar } from '../../components/ionic/IonNavbar';
import { IonicSelectable } from '../../components/ionic/IonicSelectable';
import { Text } from '../../components/ionic/IonText';
import { textStyle } from '../../components/ionic/text';
import { openExternal } from '../../native';
import { quotationMd } from '../../theme/ionicMdQuotationGenrateByPdf';
import { interp } from '../../ui/angularPipes';
import { showLoading, showToast } from '../../ui/overlays';
import { styles } from './styles';

interface Props {
  navigation: { popTo: (name: string, params?: object) => void };
}

const str = (v: any): string => (v === null || v === undefined ? '' : String(v)); // ion-input shows the model as text
// `.edit ion-list ... .label[floating] { font-size: 15px !important }` (page scss :111-114)
const labelStyle = { fontSize: 15 };

// html:176-182 `<p><strong>Label: </strong> {{value}}</p>`
function Line({ label, value, testID }: { label: string; value: any; testID?: string }) {
  return (
    <Text testID={testID} style={styles.p}>
      <Text style={styles.strong}>{label}</Text> {interp(value)}
    </Text>
  );
}

// html:174-176 `.product-img img { width: 100% }` in a 90x90 flex box: the natural aspect ratio, centred (Image.getSize, as GiftDetail does).
// NOTE (parity): a failed / not yet loaded picture draws nothing (Chrome's broken-image box is not reproduced).
function RowImage({ uri, testID }: { uri: string; testID: string }) {
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  useEffect(() => {
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
  return <Image testID={testID} source={{ uri }} style={[styles.productImgImg, { height: natural ? (90 * natural.h) / natural.w : 0 }]} />;
}

// NOTE (parity): the module has no TranslateModule and the page has no `| translate`: every text is literal.
export default function QuotationGenrateByPdfScreen({ navigation }: Props) {
  // :34-40 constructor: data / filter are plain objects mutated in place (ngModel targets); keys appear in typing order
  const data = useRef<any>({ mobile_no: '', address: '', full_name: '' }); // :38-40
  const filter = useRef<any>({}); // :26 `filter:any = {}`, shared by every list call
  const quotationData = useRef<any[]>([]); // :24
  const [, setTick] = useState(0);
  const rerender = () => setTick(n => n + 1);
  const [products, setProducts] = useState<any>([]); // :31 `products`

  // :54-62 getProductCategoryList() from the constructor: no loader. NOTE (parity): prod_cat_list is filled and never shown
  // (the category selects are commented out in the html).
  function getProductCategoryList() {
    filter.current.limit = 0;
    db.post_rqst({ filter: filter.current }, 'app_master/parentCategory_List_quotation')
      .then((r: any) => {
        void r.category; // a null body throws inside the subscribe callback (only logged in Ionic)
      })
      .catch(() => {});
  }
  // :273-290. `event` is '' on load (so `.text` is undefined) or {text} from (onSearch)
  function getProductName(event: any) {
    filter.current.search = event.text;
    filter.current.limit = 0;
    db.post_rqst({ filter: filter.current }, 'app_master/quotation_List')
      .then((r: any) => {
        setProducts(r.products);
      })
      .catch(() => {});
  }
  useEffect(() => {
    getProductCategoryList();
    getProductName('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // NOTE (parity): get_subcategory (:63-86) and getProductList (:88-105) call childCategoryList_quotation / productList_quotation, but the
  // category / sub-category selects that called them are commented out in the html: nothing reaches them, so they are not ported
  // (their contracts and fixtures exist).

  // :232-244 findProductId, run by (ngModelChange) of the product picker
  function findProductId(code: any) {
    const index = products.findIndex((row: any) => row.id == code.id); // eslint-disable-line eqeqeq
    if (index != -1) { // eslint-disable-line eqeqeq
      data.current.price = products[index].price;
      data.current.sub_category = products[index].sub_category;
      data.current.main_category = products[index].main_category;
      data.current.qty = products[index].qty;
      data.current.total_amount = products[index].total_amount;
    }
  }

  // html:65-69 [(ngModel)]="data.product_name" (ngModelChange)="findProductId(data.product_name)" (change)="getpoint(...)"
  // NOTE (parity): `(change)` is a DOM event that ionic-selectable 3.5.0 never emits (its output is onChange), so getpoint() never runs.
  // The picker has no canClear, so the value is never null here.
  function onProductChange(v: any) {
    data.current.product_name = v;
    findProductId(v);
    rerender();
  }

  // :188-196 totalAmount, run by (ngModelChange) of the quantity input
  // NOTE (parity): parseInt of '' / a missing price is NaN, shown as "NaN" in the readonly Total Amount box.
  function totalAmount(event: any) {
    data.current.total_amount = parseInt(event) * parseInt(data.current.price);
  }

  const resetFields = () => {
    const d = data.current;
    d.main_category = '';
    d.sub_category = '';
    d.product_name = '';
    d.qty = '';
    d.total_amount = '';
    d.price = '';
  };

  // :131-182 addToList
  function addToList() {
    const d = data.current;
    // NOTE (parity): main_category / sub_category are text boxes (strings), so `.id` is undefined and the two *_id keys are never sent.
    d.main_category_id = d.main_category.id;
    d.sub_category_id = d.sub_category.id;
    d.product_id = d.product_name.id;
    d.material_code = d.product_name.material_code;
    d.actual_image_name = d.product_name.actual_image_name;
    d.product_name = d.product_name.product_name;

    if (quotationData.current.length <= 0) {
      quotationData.current.push(JSON.parse(JSON.stringify(d)));
      resetFields();
    } else {
      // NOTE (parity): d.product_name is the NAME string by now, so `.id` is undefined and no row matches: the same product is listed
      // again instead of adding its quantity; the "already exists" branch is effectively dead.
      const isExistIndex = quotationData.current.findIndex((row: any) => row.product_id == d.product_name.id); // eslint-disable-line eqeqeq
      if (isExistIndex == -1) { // eslint-disable-line eqeqeq
        quotationData.current.push(JSON.parse(JSON.stringify(d)));
        resetFields();
      } else {
        const row = quotationData.current[isExistIndex];
        row.qty = parseInt(row.qty) + parseInt(d.qty);
        row.total_amount = parseInt(row.total_amount) + parseInt(d.total_amount);
        resetFields();
      }
    }
    rerender();
  }

  // :107-123 deleteItem(i) + presentToast()
  function deleteItem(i: number) {
    quotationData.current.splice(i, 1);
    showToast('Delete successfully');
    rerender();
  }

  // :201-251 submit()
  function submit() {
    // NOTE (parity): `this.quotationData < 1` compares the ARRAY: [] -> '' -> 0 (< 1 is true), a longer array -> NaN (false); `>= 20` is NaN-false too.
    if ((quotationData.current as any) < 1) {
      showToast('Please add one item at least!');
      return;
    }
    if ((quotationData.current as any) >= 20) {
      showToast('No more product add to list!');
      return;
    }
    const d = data.current;
    if (d.mobile_no == '' || d.address == '' || d.full_name == '') { // eslint-disable-line eqeqeq
      showToast('Please fill in all required fields!');
      return;
    }
    d.product_list = quotationData.current;
    d.karigar_id = db.userStorageData.id;
    // NOTE (parity): presentLoading2 {content: '', dismissOnPageChange: false}; dismissed only on status 'success': any other answer,
    // a null body or a failed request leaves the loader up (no error callback), so no useLoader().wrap.
    const loading = showLoading({ content: '', dismissOnPageChange: false });
    db.post_rqst(d, 'app_karigar/quotation_pdf')
      .then((r: any) => {
        if (r.status == 'success') { // eslint-disable-line eqeqeq
          loading.dismiss();
          openExternal(db.upload_url3 + r.file_name, '_system'); // iab.create(url + file_name, '_system')
          navigation.popTo('Home'); // navCtrl.popTo(HomePage)
        }
      })
      .catch(() => {});
  }

  const d = data.current;
  const list = quotationData.current;
  const addDisabled = !d.main_category || !d.qty || !d.sub_category || !d.product_name; // html:164

  return (
    <View style={styles.screen}>
      {/* html:1-7 plain ion-navbar (no main-header); the title is an h1 (2.6rem) */}
      <IonHeader>
        <IonNavbar title={<Text style={textStyle(26, 500, quotationMd.titleColor, 31)}>Add Quotation</Text>} />
      </IonHeader>

      <IonContent>
        {/* html:10-30 */}
        <View style={styles.edit}>
          <IonList style={styles.editList}>
            <IonInputItem
              testID="full_name"
              variant="edit"
              floating
              label="Name "
              requiredMark
              labelStyle={labelStyle}
              value={str(d.full_name)}
              onChangeText={s => {
                // NOTE (parity): (keypress)="namecheck($event)" lets only letters, + - and space through; RN cannot tell typing from paste
                d.full_name = s.replace(/[^A-Z+\-a-z ]/g, '');
                rerender();
              }}
            />
            <IonInputItem
              testID="mobile_no"
              variant="edit"
              floating
              label="Mobile No."
              requiredMark
              labelStyle={labelStyle}
              type="tel"
              // NOTE (parity): maxlength / minlength / required on <ion-input> are only Angular validators nothing reads: any length is sent
              value={str(d.mobile_no)}
              onChangeText={s => {
                d.mobile_no = s;
                rerender();
              }}
            />
            <IonInputItem
              testID="address"
              variant="edit"
              floating
              label="Address"
              requiredMark
              labelStyle={labelStyle}
              value={str(d.address)}
              onChangeText={s => {
                d.address = s.replace(/\b\w/g, l => l.toUpperCase()); // (ngModelChange)="caps_add(data.address)" :127
                rerender();
              }}
            />
          </IonList>
        </View>

        {/* html:36-163 */}
        <View style={[styles.edit, styles.sprateBlock]}>
          <IonList style={styles.editList}>
            <IonicSelectable
              testID="product_name"
              variant="editCsSelectable"
              itemStyle={styles.mt16} // html:59 `<ion-item class="cs-selectable mt16">`
              label="Select Product"
              items={products}
              value={typeof d.product_name === 'object' && d.product_name ? d.product_name : null}
              itemValueField="product_name"
              itemTextField="product_name"
              canSearch
              onChange={v => onProductChange(v)}
              onSearch={e => getProductName(e)}
            />
            <IonInputItem
              testID="main_category"
              variant="edit"
              floating
              label="Select Category"
              labelStyle={labelStyle}
              value={str(d.main_category)}
              onChangeText={s => {
                d.main_category = s;
                rerender();
              }}
            />
            <IonInputItem
              testID="sub_category"
              variant="edit"
              floating
              label="Select Sub Category"
              labelStyle={labelStyle}
              value={str(d.sub_category)}
              onChangeText={s => {
                d.sub_category = s;
                rerender();
              }}
            />
            <IonInputItem
              testID="qty"
              variant="edit"
              floating
              label="Quantity"
              labelStyle={labelStyle}
              type="tel"
              // NOTE (parity): min / maxlength / minlength are only validators: more than 3 digits can be typed
              value={str(d.qty)}
              onChangeText={s => {
                d.qty = s;
                totalAmount(s);
                rerender();
              }}
            />
            <IonInputItem testID="price" variant="edit" floating label="Price" labelStyle={labelStyle} type="tel" readOnly value={str(d.price)} />
            <IonInputItem testID="total_amount" variant="edit" floating label="Total Amount" labelStyle={labelStyle} type="tel" readOnly value={str(d.total_amount)} />
          </IonList>
          {/* html:165 `<div class="mt16">` */}
          <View style={styles.btnWrap}>
            <IonButton testID="add-to-list" csBtn disabled={addDisabled} onPress={addToList}>
              Add To List
            </IonButton>
          </View>
        </View>

        {/* html:165-189 newest first (flex-direction: column-reverse) */}
        <View style={styles.cardList}>
          {list.map((row: any, i: number) => (
            <View key={i} testID={`quotation-row-${i}`} style={styles.cardItem}>
              <View style={styles.dataContent}>
                <Line label="Category Name: " value={row.main_category} />
                <Line label="Sub-Category Name: " value={row.sub_category} />
                <Line label="Product: " value={row.product_name} />
                <View style={styles.itemFlex}>
                  <Line label="Quantity: " value={row.qty} />
                  <Line label="Price: " value={row.price} />
                  <Line label="Total Amount: " value={row.total_amount} />
                </View>
              </View>
              <View style={styles.productImg}>
                <RowImage testID={`quotation-img-${i}`} uri={interp(db.product_image_url + row.actual_image_name)} />
              </View>
              <View style={styles.dataAction}>
                                <IonFabButton testID={`delete-${i}`} color={'red' as any} mini size={30} iconSize={20} icon="trash" onPress={() => deleteItem(i)} />
              </View>
            </View>
          ))}
        </View>

        {/* html:190-192 */}
        {list.length > 0 ? (
          <View style={styles.btnWrap}>
            <IonButton testID="quotation-save" csBtn onPress={submit}>
              Save
            </IonButton>
          </View>
        ) : null}
      </IonContent>
    </View>
  );
}
