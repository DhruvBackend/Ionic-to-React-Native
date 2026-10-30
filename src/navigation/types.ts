// What a screen declares in src/screens/<Name>/route.ts; scripts/gen-routes.mjs adds the component.
import type { ComponentType } from 'react';
import type { FeatureKey } from '../config/types';

export interface RouteMeta {
  // The Ionic page class name without "Page" (e.g. 'PulmberCustomerDetail'); equals the folder name.
  name: string;
  // 'modal' for pages Ionic opened with ModalController: they open above the tabs, like Ionic overlays.
  presentation: 'card' | 'modal';
  // Set for screens the client may not have (spec §6.3). Topbath: unreachable screens are flagged off.
  feature?: FeatureKey;
  // Every route this screen can navigate to (from the Ionic push/setRoot/modal calls). Read by the
  // reachability test that proves flagged screens stay unreachable for Topbath (plan Phase 6).
  links: string[];
}

export interface RouteDef extends RouteMeta {
  component: ComponentType<any>;
}
