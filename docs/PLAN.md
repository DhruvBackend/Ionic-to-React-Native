# Top Bath (Topsan) — Ionic → React Native plan & status

**Goal:** convert the Ionic 3 Topsan app (`Basiq360-Abacusdesk/Topbath_App_loyalty`) to bare React Native, screen for screen, keeping every API contract unchanged.
**Where:** `C:\Users\dhruv\Projects\topbath-rn` — local git only, no remote, never pushed.
**Stack:** React Native 0.88.1 (New Architecture, Hermes), React 19.3, TypeScript.
**Inventory:** see [INVENTORY.md](INVENTORY.md) — 117 screens, 4 languages.
**How-to for other agents:** see [PLAYBOOK.md](PLAYBOOK.md). **What I learned:** see [LEARNING-LOG.md](LEARNING-LOG.md).

## Rules (short)
- Straight conversion; security (token, OTP, user IDs) copied as-is, flagged with `// NOTE (security, not changed):`.
- `MOCK` mode by default; `DEV`/`LIVE` only when asked.
- Every screen file has a header naming its Ionic source; every deviation is commented.
- One local commit per screen or small group.

## Phases

| # | Phase | Screens | Gate | Status |
|---|---|---|---|---|
| 0 | Foundation | scaffold, libraries, theme, i18n, storage, API client + mock, navigation shell, shared components, debug APK on phone | app opens on phone | 🔄 in progress |
| 1 | Onboarding & auth | language, select-registration-type, login-section/* (login-screen, mobile-login, otp, registration), otpverify, customeradd, terms, tabs | mock login works for every role | ⏳ |
| 2 | Core loyalty | home, main-home, profile, edit-profile, view-profile, scan-point, scane-pages/*, points/*, point-history, transaction, gift-gallery/*, cancelpolicy-modal, cancelation-policy, shipping-detail, pointtranfer, offers, offer-list, notification, super30 | scan → points → redeem works | ⏳ |
| 3 | Catalogue & content | products, category, sub-category, product-detail, product-subdetail, newarrivals, digitalcatalog, favorite-product, search, news, news-detail, video, video-category, about, aboutus-modal, contact, enquiry, feedback, survey/*, quotation-genrate-by-pdf, nearest-dealer, point-location | all content screens render | ⏳ |
| 4 | Complaints & plumber service | complaints/*, retailer-add-complaint, retailer-list-complaint, complaint-remarks, cancel-complaint, plumber-camplaints/*, plumber-checkin, task-close, plumber-list, plumber-detail, plumber-add | complaint lifecycle works | ⏳ |
| 5 | Sales Exec / Seller / Dealer | sales-exec-home, sales-exec-add-dealer/plumber/seller, sales-exec-plumber-list/detail, sales-point-transfer, customerlist, customerdetail, dealer-home, dealer-profile | each role's tabs complete | ⏳ |
| 6 | SFA (employee) module | login, otpverify (SFA), sales-app/* (14), dashboard, attendence, work-type-modal, add-leave, leave-list, travel-add, travel-list, dealer-check-in, dealer-dealer-list, dealer-discount, dealer-executive-app, dealer-executive-list, executiv-detail, executive-edit, executive-popover, leads-detail, add-order, dealer-addorder, cart-detail, order-list, order-detail, dealer-order, executive-order-detail | order + attendance flows work | ⏳ |
| 7 | Native & release | push (Firebase), icon/splash, local release keystore, release APK, full regression | sign-off checklist | ⏳ |

## Phase 0 checklist
- [x] Scaffold RN 0.88.1, package `com.topsan.app`, debug suffix `.rn`, app name "Topsan" / "Topsan RN"
- [x] Local git (no remote), Kotlin sources moved to `com/topsan/app`
- [x] Inventory script + INVENTORY.md
- [ ] First debug APK builds
- [ ] APK installed on phone (needs USB debugging + phone connected)
- [ ] Libraries installed (navigation, storage, i18n, icons, …)
- [ ] theme / i18n (en, es, hin, nep) / storage wrapper
- [ ] API client (port of dbservice.ts) + MOCK layer + Jest tests
- [ ] Navigation shell (root stack, role tabs, SFA stack)
- [ ] Shared components (Header, Loader, EmptyState, SearchableSelect, ImageZoom)

## Open items (not blocking)
- Test account / dev-server access for DEV mode — ask team.
- `google-services.json` for push (Firebase project `grafedoer`) — Phase 7.
- Maps API key if any screen needs the Google Maps SDK — check in Phase 3.
- Repo contains `topsan.keystore` (Play signing key) and the bundle uploads videos to another client's path (`grafdoer`) — reported to teammate, not touched.
