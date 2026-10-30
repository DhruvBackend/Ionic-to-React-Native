// Ported from: src/providers/dbservice/dbservice.ts (DbserviceProvider)
//
// Same field names and method names as the Ionic service so screens port line by line:
//   Ionic:  this.service.onPostRequestDataFromApi(data, 'app_karigar/x', this.service.rootUrl).subscribe(ok, err)
//   RN:     db.onPostRequestDataFromApi(data, 'app_karigar/x', db.rootUrl).then(ok, err)
//
// Differences from Ionic (and why):
// - Returns Promises instead of RxJS Observables: React has no RxJS in its idioms and every
//   Ionic caller only used .subscribe(success, error), which maps 1:1 to .then(success, error).
// - Non-2xx responses reject with an HttpError, matching Angular HttpClient's error callback.
// - Every request is built the same way (URL, method, headers, body) and handed to a transport:
//   the network in DEV/LIVE, src/api/mock in MOCK. Contract tests wrap the transport to check the
//   exact request Ionic would have sent, whatever the mode.
// - UI helpers (alert/loading/toast/mobile key filter) move to the Ionic replica kit (plan Task 9) — they are UI, not HTTP.
import { jwtDecode } from 'jwt-decode';
import { MODE, URLS } from '../config/env';
import { mockRequest } from './mock';
import { storage } from '../storage';

export class HttpError extends Error {
  constructor(public status: number, public error: unknown) {
    super(`HTTP ${status}`);
  }
}

type Headers = Record<string, string>;

class DbService {
  token_value: any = '';
  tokenInfo: any;
  karigar_id: any = '';
  // Set by the app after login / on start-up (Ionic: app.component.ts and login pages).
  userStorageData: any;
  protected token_data: any;

  readonly rootUrl = URLS.rootUrl;
  readonly rootUrlSfa = URLS.rootUrlSfa;
  readonly server_url = URLS.rootUrl + 'index.php/app/';
  readonly image_url = URLS.image_url;
  readonly upload_url = URLS.rootUrl;
  readonly upload_url1 = URLS.upload_url1;
  readonly upload_url2 = URLS.upload_url2;
  readonly upload_url3 = URLS.upload_url3;
  readonly video_url = URLS.video_url;
  readonly product_image_url = URLS.product_image_url;
  readonly category_url = URLS.category_url;

  // Ionic ran this in the constructor; RN calls it once at start-up (App.tsx).
  async token() {
    this.token_value = await storage.get('token');
    this.tokenInfo = this.getDecodedAccessToken(this.token_value);
    if (this.tokenInfo) {
      this.karigar_id = this.tokenInfo.sub;
    }
  }

  getDecodedAccessToken(token: string): any {
    try {
      return jwtDecode(token);
    } catch {
      return null;
    }
  }

  set_token_value(value: any) {
    this.token_data = value;
  }

  get_token_data() {
    return this.token_data;
  }

  private userHeaders(): Headers {
    const headers: Headers = { 'Content-Type': 'application/json' };
    if (this.userStorageData && this.userStorageData.token) {
      // NOTE (security, not changed): token sent in both Authorization and a custom Token header, as in Ionic.
      headers.Authorization = 'Bearer ' + this.userStorageData.token;
      headers.Token = 'Bearer ' + this.userStorageData.token;
    }
    return headers;
  }

  onPostRequestDataFromApi(requestData: any, fn: string, serverURL: string): Promise<any> {
    return send('POST', serverURL, fn, this.userHeaders(), requestData);
  }

  onGetRequestDataFromApi(fn: string, serverURL: string): Promise<any> {
    return send('GET', serverURL, fn, this.userHeaders());
  }

  get_rqst(fn: string): Promise<any> {
    const headers = { 'Content-Type': 'application/json', Token: 'Bearer ' + this.token_value };
    return send('GET', this.rootUrl, fn, headers);
  }

  post_rqst(request_data: any, fn: string): Promise<any> {
    // NOTE (security, not changed): set_token_value() is never called anywhere in the Ionic app,
    // so this header is sent as "Bearer undefined" there too. Kept identical on purpose.
    this.token_value = this.get_token_data();
    this.tokenInfo = this.getDecodedAccessToken(this.token_value);
    if (this.tokenInfo) {
      this.karigar_id = this.tokenInfo.sub;
    }
    const headers = { 'Content-Type': 'application/json', Token: 'Bearer ' + this.token_value };
    return send('POST', this.rootUrl, fn, headers, request_data);
  }
}

// The fully built request, exactly as it would go over the wire.
export interface ApiRequest {
  method: 'GET' | 'POST';
  url: string; // serverURL + fn
  headers: Headers;
  body?: string; // JSON text; undefined for GET
  serverURL: string;
  fn: string;
  data?: any; // the body before JSON encoding (what the mock handlers receive)
}

export type Transport = (req: ApiRequest) => Promise<any>;

const networkTransport: Transport = async req => {
  const res = await fetch(req.url, { method: req.method, headers: req.headers, body: req.body });
  const text = await res.text();
  let data: any = text;
  try {
    data = JSON.parse(text);
  } catch {
    // non-JSON body: Angular would also hand back the raw error; keep the text
  }
  if (!res.ok) {
    throw new HttpError(res.status, data);
  }
  return data;
};

const mockTransport: Transport = req => mockRequest(req.method, req.fn, req.data, req.serverURL);

let transport: Transport = MODE === 'MOCK' ? mockTransport : networkTransport;

// Swap the transport (tests only: contract checks record requests, then pass them on).
export function getTransport(): Transport {
  return transport;
}
export function setTransport(t: Transport): void {
  transport = t;
}

function send(method: 'GET' | 'POST', serverURL: string, fn: string, headers: Headers, data?: any): Promise<any> {
  return transport({
    method,
    url: serverURL + fn,
    headers,
    body: method === 'POST' ? JSON.stringify(data) : undefined,
    serverURL,
    fn,
    data,
  });
}

// Single shared instance, like Angular's @Injectable() provider.
export const db = new DbService();
