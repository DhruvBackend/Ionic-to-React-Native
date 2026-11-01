// Keeps the three descriptions of the `_components.*` parity states in step: parity/states.d/_components.json, the RN registry
// (src/dev/componentStates.tsx) and the Ionic harness page (parity/reference/gallery/parity-gallery.*), so none can drift.
import fs from 'fs';
import path from 'path';
import { COMPONENT_STATE_IDS, renderComponentState } from '../src/dev/componentStates';
import { SAMPLE_IMAGE } from '../src/dev/gallery/sampleImage';

const ROOT = path.join(__dirname, '..');
const gallery = (f: string) => fs.readFileSync(path.join(ROOT, 'parity', 'reference', 'gallery', f), 'utf8');
const states: any[] = JSON.parse(fs.readFileSync(path.join(ROOT, 'parity', 'states.d', '_components.json'), 'utf8'));
const ids = states.map(s => String(s.id).replace(/^_components\./, ''));
const sorted = (a: string[]) => [...a].sort();

// ids the Ionic page can render: the keys of OPENERS (overlays / forced states) plus the *ngSwitchCase values of the template
function ionicIds(): string[] {
  const ts = gallery('parity-gallery.ts.txt');
  const block = ts.slice(ts.indexOf('export const OPENERS'), ts.indexOf('export const STATES'));
  const openers = [...block.matchAll(/^ {2}'([a-z0-9-]+)':/gm)].map(m => m[1]);
  const html = gallery('parity-gallery.html');
  const cases = [...html.matchAll(/\*ngSwitchCase="'([a-z0-9-]+)'"/g)].map(m => m[1]);
  return [...new Set([...openers, ...cases])];
}

describe('_components parity states', () => {
  it('has unique ids and the RN route + Ionic page every state needs', () => {
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of states) {
      expect(s.screen).toBe('_ComponentState');
      expect(s.params).toEqual({ id: String(s.id).replace(/^_components\./, '') });
      expect(String(s.ionicNav)).toContain("Page('ParityGallery')");
    }
  });

  it('every state id has a renderer on the RN side, and the RN registry has no extras', () => {
    expect(sorted(COMPONENT_STATE_IDS)).toEqual(sorted(ids));
  });

  it('every state id is rendered by the Ionic harness page, which has no extras', () => {
    // 'blank' (tab roots and the back-button filler) is the page's default case and is not a state
    expect(sorted(ionicIds())).toEqual(sorted(ids));
  });

  it('the RN registry renders an element for every id (unknown ids render null)', () => {
    for (const id of ids) {
      expect(renderComponentState(id)).not.toBeNull();
    }
    expect(renderComponentState('nope')).toBeNull();
  });

  it('both sides use the same ImageViewer picture', () => {
    expect(gallery('sample-image.b64').trim()).toBe(SAMPLE_IMAGE.replace('data:image/png;base64,', ''));
  });

  it('states reached by a tap name an RN testID that exists in the registry source', () => {
    const src = fs.readFileSync(path.join(ROOT, 'src', 'dev', 'componentStates.tsx'), 'utf8');
    for (const s of states.filter(x => x.rnAction)) {
      const id = String(s.rnAction).replace(/^tap:/, '').replace(/-cover$/, '');
      expect(src).toContain(`testID="${id}"`);
    }
  });
});
