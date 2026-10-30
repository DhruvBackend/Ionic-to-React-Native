# Request contracts

One file per backend endpoint, recording **exactly what the Ionic app sends**. Every screen test checks its RN calls against these files with `expectContract()` (`__tests__/helpers/contract.ts`). That's how "the backend sees no difference" is proven, endpoint by endpoint.

## Naming
`<endpoint with "/" replaced by "__">.json`, for example `auth/login` → `auth__login.json`.

## Shape
```json
{
  "endpoint": "auth/login",
  "helper": "onPostRequestDataFromApi",
  "server": "root",
  "method": "POST",
  "headers": "user",
  "body": { "mobile_no": "9876543210", "mode": "=App" },
  "ionicSource": "src/pages/login-section/otp/otp.ts:78"
}
```

| Field | Values | Taken from the Ionic call site |
|---|---|---|
| `helper` | `onPostRequestDataFromApi`, `onGetRequestDataFromApi`, `post_rqst`, `get_rqst` | the dbservice method called |
| `server` | `root` (rootUrl, dd_api), `sfa` (rootUrlSfa, crm/api/app), `server_url` (dd_api/index.php/app/) | the 3rd argument, or `rootUrl` for `post_rqst`/`get_rqst` |
| `method` | `POST`, `GET` | `on*Post*`/`post_rqst` = POST, `on*Get*`/`get_rqst` = GET |
| `headers` | `user` for the `on*` helpers, `tokenOnly` for `post_rqst`/`get_rqst` | must agree with `helper` |
| `body` | the request body's key structure | the object literal passed as the 1st argument |
| `ionicSource` | `src/pages/...ts:<line>` | where the call is, for reviewers |

### Body rules
- **Keys must match exactly.** A missing or extra key fails, and this applies to nested objects too.
- **Leaf values are not compared**, so example values are only documentation. To pin a value, start the string with `=`: `"mode": "=App"` means the request must send `"App"`.
- `"body": "="` means Ionic sends the literal empty string `""` (e.g. `app_karigar/app_version`).
- `"body": null` means no body (GET).
- **Arrays** are checked by the shape of their first element: `"qr_code": [{ "qr_code": "", "coupon_value": "" }]`.

### `headers`
- `user`: `Content-Type`, plus `Authorization` and `Token` (`Bearer <token>`) when logged in. That's `onPostRequestDataFromApi`/`onGetRequestDataFromApi`.
- `tokenOnly`: `Content-Type` and `Token` only, even when logged in. That's `post_rqst`/`get_rqst`. Ionic sends `Bearer undefined`/`Bearer null` here, and RN copies it (NOTE security, not changed).

## In a screen test
```ts
import { expectContract } from '../../../__tests__/helpers/contract';

test('submits the Ionic auth/login body', async () => {
  await expectContract('auth/login', async () => {
    // render the screen and press the button that triggers the call
  }, { loggedIn: false });
});
```
The call still gets its normal mock response, so the screen keeps working during the check.
