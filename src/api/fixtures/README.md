# Endpoint fixtures

One file per backend endpoint. The RN MOCK backend (`src/api/mock`) and the parity harness (the Ionic reference build) both answer from these files, so the two apps are compared on identical data.

## Naming
`<endpoint with "/" replaced by "__">.json`, for example `app_karigar/karigarHome` → `app_karigar__karigarHome.json`.

Files starting with `_` are shared data, not endpoints (`gen-fixtures.mjs` skips them).

`_sessions.json` maps a role (`Plumber`, `Sales_Boy`, `Dealer`, `Sales_Executive`, `Customer`, `Retailer`, `SFA`, `Employee`, `DrLogin`) to the `userStorageData` the Ionic app stores after login. The debug deep link (`role=<Role>`) and the Ionic reference capture both seed it. Everything in it is fake (ids 9000xx, phones 90000000xx); each `token` is an unsigned JWT whose `sub` is the id, which is what `jwt-decode` in `src/api/client.ts` reads.

## Shape
```json
{
  "endpoint": "app_karigar/karigarHome",
  "server": "root",
  "variants": {
    "default":   { "status": "SUCCESS", "karigar": { "...": "..." } },
    "empty":     { "status": "SUCCESS", "karigar": {} },
    "malformed": { "status": "SUCCESS", "karigar": null },
    "NOT FOUND": { "status": "NOT FOUND" }
  }
}
```
- `server` is `root` (dd_api), `sfa` (crm/api/app) or `server_url` (dd_api/index.php/app/).
- `default` is required. `malformed` is required once a screen uses the endpoint (plan Review Focus 2).
- Response shapes follow the fields the Ionic page actually reads (see the screen's `card.md`).
- Use realistic but fake data: Indian names, 10-digit numbers starting 9/8/7, no real people.

## HTTP error variants
A variant of the form `{ "$httpError": 500, "body": { ... } }` makes the mock throw the same `HttpError(status, body)` the network transport throws for a non-2xx response, so a screen's error callback runs. `$httpError` must be an integer 400-599; `body` is optional (default `{}`). Example: `"error": { "$httpError": 500, "body": {} }`, selected with `setFixtureVariant(endpoint, 'error')`. The Ionic reference harness should answer such a variant with the same status.

## After adding or renaming a file
Run `node scripts/gen-fixtures.mjs`. `npm test` runs it automatically (`pretest`).

## In tests
```ts
import { setFixtureVariant, resetMock } from '../src/api/mock';
beforeEach(() => resetMock());
setFixtureVariant('app_karigar/profile', 'suspended');
```
