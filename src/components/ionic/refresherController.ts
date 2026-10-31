// The pull-to-refresh state machine of Ionic 3.9.5 components/refresher/refresher.js, free of DOM and React so it can
// be tested. Same states ('inactive' | 'pulling' | 'ready' | 'refreshing' | 'cancelling' | 'completing'), same
// thresholds and the same quirks:
//  - the content follows the finger 1:1 (`_setCss(deltaY)`, no resistance; IonContent maps the native scroll offset to dy),
//  - pulling past pullMax starts the refresh while the finger is still down (refresher.js:311-315),
//  - releasing in `ready` starts the refresh, releasing in `pulling` cancels (refresher.js `_onEnd`),
//  - `complete()` closes after a 120 ms delay; both closings use the stylesheet's 320 ms transition (the JS passes
//    duration '' to `_setCss`), and a 600 ms fallback timer ends the state if no transitionend arrives.
// NOTE (parity): refresher.js:_onMove ignores moves less than 16 ms apart; that sampling is not reproduced.
import { refresherMd } from '../../theme/ionicMdScroll';

export type RefresherState = 'inactive' | 'pulling' | 'ready' | 'refreshing' | 'cancelling' | 'completing';

export interface RefresherHandle {
  readonly state: RefresherState;
  readonly progress: number;
  complete(): void;
  cancel(): void;
}

export interface RefresherOptions {
  pullMin?: number;
  pullMax?: number;
  snapbackDuration?: number;
  onRefresh?: (r: RefresherHandle) => void; // (ionRefresh)
  onPull?: (r: RefresherHandle) => void; // (ionPull)
  onStart?: (r: RefresherHandle) => void; // (ionStart)
}

export interface RefresherView {
  setState(state: RefresherState): void;
  // Move the scroll element to translateY(y). `durationMs` 0 = immediate; `curve` true = the stylesheet's
  // cubic-bezier(.36,.66,.04,1) transition; `delayMs` = transition-delay.
  translate(y: number, durationMs: number, delayMs: number): void;
}

export class RefresherController implements RefresherHandle {
  state: RefresherState = 'inactive';
  progress = 0;
  opts: RefresherOptions;
  private startY: number | null = null;
  private deltaY: number | null = null;
  private didStart = false;
  private y = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor(private view: RefresherView, opts: RefresherOptions = {}) {
    this.opts = opts;
  }

  private get pullMin() {
    return this.opts.pullMin ?? refresherMd.pullMin;
  }
  private get pullMax() {
    // refresher.js:141 `this.pullMax = this.pullMin + 60` runs in the constructor: fixed 120 whatever pullMin is
    return this.opts.pullMax ?? refresherMd.pullMax;
  }
  private get snapback() {
    return this.opts.snapbackDuration ?? refresherMd.snapbackDuration;
  }

  private setState(s: RefresherState) {
    this.state = s;
    this.view.setState(s);
  }
  private css(y: number, durationMs: number, delayMs = 0) {
    this.y = y;
    this.view.translate(y, durationMs, delayMs);
  }

  // refresher.js:_onStart (pointer down)
  start(scrollTop: number, touches = 1): boolean {
    if (touches > 1 || this.state !== 'inactive' || scrollTop > 0) {
      return false;
    }
    this.startY = 0; // deltaY is measured from the touch start, so the origin is 0
    this.progress = 0;
    return true;
  }

  // refresher.js:_onMove; `dy` is currentY - startY
  move(dy: number, scrollTop = 0): void {
    if (
      this.startY === null ||
      this.state === 'refreshing' ||
      this.state === 'cancelling' ||
      this.state === 'completing'
    ) {
      return;
    }
    this.deltaY = dy;
    if (dy <= 0) {
      this.progress = 0;
      if (this.state !== 'inactive') {
        this.setState('inactive');
      }
      if (this.y > 0) {
        this.css(0, 0);
      }
      return;
    }
    if (this.state === 'inactive') {
      if (scrollTop > 0) {
        this.progress = 0;
        this.startY = null;
        return;
      }
      this.state = 'pulling';
      this.view.setState('pulling');
    }
    this.css(dy, 0);
    this.progress = dy / this.pullMin;
    if (!this.didStart) {
      this.didStart = true;
      this.opts.onStart?.(this);
    }
    this.opts.onPull?.(this);
    if (dy < this.pullMin) {
      this.setState('pulling');
    } else if (dy > this.pullMax) {
      this.beginRefresh();
    } else {
      this.setState('ready');
    }
  }

  // refresher.js:_onEnd (pointer up)
  end(): void {
    if (this.state === 'ready') {
      this.beginRefresh();
    } else if (this.state === 'pulling') {
      this.cancel();
    }
    this.startY = null;
  }

  private beginRefresh() {
    this.setState('refreshing');
    this.css(this.pullMin, this.snapback);
    this.opts.onRefresh?.(this);
  }

  complete(): void {
    this.close('completing', refresherMd.completeDelayMs);
  }
  cancel(): void {
    this.close('cancelling', 0);
  }

  private close(state: RefresherState, delayMs: number) {
    clearTimeout(this.timer);
    this.setState(state);
    const moving = this.y !== 0;
    this.css(0, refresherMd.contentTransitionMs, delayMs);
    // transitionend fires after delay + duration only if the transform really changes; otherwise the 600 ms fallback
    const wait = moving ? delayMs + refresherMd.contentTransitionMs : refresherMd.closeFallbackMs;
    this.timer = setTimeout(() => {
      this.setState('inactive');
      this.progress = 0;
      this.didStart = false;
      this.startY = this.deltaY = null;
      this.css(0, 0);
    }, wait);
  }

  destroy(): void {
    clearTimeout(this.timer);
  }
}
