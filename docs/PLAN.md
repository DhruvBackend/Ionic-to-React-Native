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

Source of truth: the design spec (`docs/superpowers/specs/2026-10-29-topbath-rn-migration-design.md`, section 6.1) and the implementation plan (`docs/superpowers/plans/2026-10-29-topbath-rn-migration.md`). This table is a summary and must match spec section 6.1 and `docs/inventory.json` (117 screens = 61 live/push-only in phases 1-5, 56 dead behind feature flags in phases 6-7). Phase screen counts: 7 / 22 / 11 / 15 / 6 / 16 / 40.

| Phase | Name (screens) | Content |
|---|---|---|
| 0 | Foundation | WIP fix, deps, white-label, first APK on phone, nav shell, shared components, native wrappers, mocks/fixtures, contract framework, reference harness, screen-card generator |
| 1 | Onboarding & auth (7) | Language, SelectRegistrationType, MobileLogin, Otp, Registration, AboutusModal, Tabs, plus start-up/version/back logic |
| 2 | Core loyalty (22) | Home (Plumber + Seller/Dealer variants), MainHome, Profile, ViewProfile, PointList, PointHistory, OfferList, Offers, Terms, GiftDetail, CancelpolicyModal, CancelationPolicy, Transaction, ShippingDetail, Notification, Feedback, Pointtranfer, CoupanCode, ScanPoint, SalesPointTransfer, Super30, PointLocation |
| 3 | Catalogue & content (11) | Category, SubCategory, Products, ProductDetail, ProductSubdetail, NewArrivals, VideoCategory, Video, About, Contact, QuotationGenrateByPdf |
| 4 | Complaints & service (15) | AddNewComplaint, ComplaintHistory, ComplaintDetail, CancelComplaint, ComplaintRemarks, MyCamplaints, PulmberCustomerDetail, PlumberCheckin, TaskClose, CustomerList, CustomerAdd, CustomerDetail, PlumberList, PlumberAdd, PlumberDetail |
| 5 | Sales Executive (6) | SalesExecHome, SalesExecAddPlumber, SalesExecAddSeller, SalesExecAddDealer, SalesExecPlumberList, SalesExecPlumberDetail |
| 6 | Unreachable loyalty pages (16) | flagged off for Topbath, see spec section 6.3 |
| 7 | SFA module (40) | flagged off for Topbath, see spec section 6.3 |
| 8 | Native & release | push (flagged off for Topbath), icons/splash per client, release signing (outside the repo), forced-update rollout, Android permission prompts, full regression, Play internal track |
| 9 | Second client | prove the white-label with a second real client's config; diff that client's Ionic source against Topbath's |
| 10 | iOS | gated on spec section 9.1 |

Feedback, Transaction and ShippingDetail are push-only entry points: still ported, reached in tests via deep link. The Topbath release does not wait for phases 6-7 (their flags are off).

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
