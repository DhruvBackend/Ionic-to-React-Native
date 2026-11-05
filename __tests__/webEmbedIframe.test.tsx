// The iframe wrapper page must give html/body a full height, or the iframe's height:100% falls back to 150px
// (Contact / PointLocation maps were cut short on the phone, 2026-11-04).
import { iframeHtml } from '../src/components/WebEmbed';

test('iframe wrapper page: html and body are 100% high, iframe fills them', () => {
  const html = iframeHtml('https://example.test/embed?a=1&b=2');
  expect(html).toContain('<html style="height:100%">');
  expect(html).toMatch(/<body style="[^"]*height:100%/);
  expect(html).toContain('height="100%"');
  expect(html).toContain('src="https://example.test/embed?a=1&amp;b=2"');
});

describe('embedUri', () => {
  const { embedUri } = require('../src/components/WebEmbed');
  const api = require('../src/api/client');
  afterEach(() => jest.restoreAllMocks());
  test('uploaded media from the mock transport: an empty page (fixture files do not exist on the server)', () => {
    jest.spyOn(api, 'isMockTransport').mockReturnValue(true);
    expect(embedUri('https://devcrm.abacusdesk.com/x/uploads/complaint_71.mp4')).toBe('about:blank');
    expect(embedUri('https://www.google.com/maps/embed?pb=1')).toBe('https://www.google.com/maps/embed?pb=1');
  });
  test('real server: the URL is untouched', () => {
    jest.spyOn(api, 'isMockTransport').mockReturnValue(false);
    expect(embedUri('https://devcrm.abacusdesk.com/x/uploads/complaint_71.mp4')).toBe('https://devcrm.abacusdesk.com/x/uploads/complaint_71.mp4');
  });
});
