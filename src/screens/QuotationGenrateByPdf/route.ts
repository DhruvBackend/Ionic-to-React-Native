// Ported from: src/pages/quotation-genrate-by-pdf/quotation-genrate-by-pdf.module.ts (+ the nav target in quotation-genrate-by-pdf.ts)
import type { RouteMeta } from '../../navigation/types';

// Ionic: quotation-genrate-by-pdf.ts:259 navCtrl.popTo(HomePage) after the PDF is made (no push / setRoot). Roles: Sales_Boy, Dealer (card). Feature flag quotation.
const route: RouteMeta = {
  name: 'QuotationGenrateByPdf',
  presentation: 'card',
  feature: 'quotation',
  links: ['Home'],
};

export default route;
