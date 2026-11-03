// A stack navigator that moves pages like Ionic 3.9.5 md (plan Task 9 part 4, "pageTransition").
//
// Why not native-stack: its Android animations are fixed XML resources (no 40 px offset, no 280 ms / 200 ms,
// no cubic-bezier curves; `animationDuration` is iOS only). @react-navigation/stack can run custom specs but
// needs react-native-gesture-handler, whose 3.x line dropped the PanGestureHandler API that package imports, and
// Ionic md has no swipe-back anyway. So this is a small JS stack on top of React Navigation's StackRouter:
// navigation state, params, focus events and `navigation.*` actions are the library's, only the drawing is ours.
//
// Ionic behaviour copied (src/theme/ionicMdPage.ts, transitions/transition-md.js):
//   forward (push / setRoot): the new page animates in (translateY 40 -> 0, opacity .01 -> 1, 280 ms) over the old
//     one, which is hidden when it ends;
//   back (pop / popToRoot):   the old top page animates out (translateY 0 -> 40, opacity 1 -> 0, 200 ms) over the
//     page that comes back, which does not animate;
//   routes with options.presentation 'modal' use ModalMDSlideIn / ModalMDSlideOut (same numbers) and the page below
//     stays visible, as under an Ionic ModalController page;
//   setRoot / reset is instant (nav-controller-base.js:145-152 setPages: animate false); old pages unmount at once;
//   the first page of a navigator is not animated; touches are blocked while a page moves (Ionic disables the app).
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import {
  createNavigatorFactory,
  StackActions,
  StackRouter,
  useNavigationBuilder,
  type ParamListBase,
  type StackNavigationState,
} from '@react-navigation/native';
import { pageTransition } from '../theme/ionicMdPage';
import { enterSpec, leaveSpec, planTransition, PresentationContext, type Presentation, type TransitionPlan } from './pageTransition';

type Route = StackNavigationState<ParamListBase>['routes'][number];
interface Descriptor {
  options: { presentation?: Presentation };
  render: () => React.ReactNode;
}

const NONE: TransitionPlan = { type: 'none' };

interface ViewState {
  source: StackNavigationState<ParamListBase>;
  extras: { route: Route; role: 'leaving' }[]; // routes already gone from the state but still drawn
  plan: TransitionPlan;
}

function presentationOf(d: Descriptor | undefined): Presentation {
  return d?.options?.presentation === 'modal' ? 'modal' : 'card';
}

function Card({
  phase,
  presentation,
  visible,
  onDone,
  testID,
  children,
}: {
  phase: 'idle' | 'entering' | 'leaving';
  presentation: Presentation;
  visible: boolean;
  onDone: () => void;
  testID: string;
  children: React.ReactNode;
}) {
  const progress = useRef(new Animated.Value(0)).current;
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    if (phase === 'idle') {
      return undefined;
    }
    const spec = phase === 'entering' ? enterSpec(presentation) : leaveSpec(presentation);
    progress.setValue(0);
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: spec.duration,
      easing: Easing.bezier(...spec.easing),
      useNativeDriver: true,
    });
    anim.start(({ finished }) => {
      if (finished) {
        done.current();
      }
    });
    return () => anim.stop();
  }, [phase, presentation, progress]);

  let animated: { opacity: Animated.AnimatedInterpolation<number>; transform: { translateY: Animated.AnimatedInterpolation<number> }[] } | null = null;
  if (phase !== 'idle') {
    const spec = phase === 'entering' ? enterSpec(presentation) : leaveSpec(presentation);
    animated = {
      opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [...spec.opacity] }),
      transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [...spec.translateY] }) }],
    };
  }
  return (
    <Animated.View
      testID={testID}
      // NOTE (parity): no background here. Ionic's .modal-wrapper has no background in main.css (the page inside paints its own:
      // cancelpolicy-modal ion-content.popup-modal rgba(0,0,0,.5), ViewProfile .module 90% black), so the page below shows through.
      style={[StyleSheet.absoluteFill, styles.clip, animated, !visible && styles.hidden]}
      accessibilityElementsHidden={!visible}
      importantForAccessibility={visible ? 'auto' : 'no-hide-descendants'}
    >
      {children}
    </Animated.View>
  );
}

// Navigation actions that arrive while a page is moving. Ionic runs them one after the other
// (NavControllerBase._queueTrns / _nextTrns), so they are held here and dispatched when the transition has ended.
// NOTE (parity): only actions that change the stack are held (the ones below); params and focus work go straight through.
interface Queue {
  busy: boolean;
  pending: any[];
}
const STACK_ACTIONS = ['NAVIGATE', 'PUSH', 'POP', 'POP_TO_TOP', 'GO_BACK', 'REPLACE', 'RESET'];

function IonStackView({
  state,
  descriptors,
  queue,
  dispatch,
}: {
  state: StackNavigationState<ParamListBase>;
  descriptors: Record<string, Descriptor>;
  queue: Queue;
  dispatch: (action: any) => void;
}) {
  // Descriptors of routes that already left the state, so their page can finish animating out.
  const known = useRef<Record<string, Descriptor>>({});
  Object.assign(known.current, descriptors);

  const [view, setView] = useState<ViewState>({ source: state, extras: [], plan: NONE });
  let current = view;
  if (view.source !== state) {
    // Derive the transition during render (React's "adjust state when a prop changes" pattern).
    const prev = view.source.routes;
    const prevKeys = prev.map(r => r.key);
    const nextKeys = state.routes.map(r => r.key);
    if (prevKeys.length === nextKeys.length && prevKeys.every((k, i) => k === nextKeys[i])) {
      // Same pages (params, a child navigator's state synced into route.state): keep any running transition.
      current = { ...view, source: state };
    } else {
      const plan = planTransition(prevKeys, nextKeys);
      const extras: ViewState['extras'] = [];
      // NOTE (parity): only the top page of a multi-page change is drawn; the others vanish instantly like in Ionic.
      if (plan.type === 'pop') {
        extras.push({ route: prev.find(r => r.key === plan.leaving)!, role: 'leaving' });
      }
      current = { source: state, extras, plan };
    }
    setView(current);
  }

  const plan = current.plan;
  queue.busy = plan.type !== 'none';
  const finish = () => {
    queue.busy = false;
    setView(v => (v.plan === plan ? { ...v, extras: [], plan: NONE } : v));
  };

  // Safety net: a transition whose animation never reports back must not block the app for good.
  const [flush, setFlush] = useState(0);
  useEffect(() => {
    if (plan.type === 'none') {
      return undefined;
    }
    const t = setTimeout(finish, pageTransition.enter.duration + 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan]);
  // Run the held actions one at a time, each after the previous transition has ended.
  useEffect(() => {
    if (plan.type === 'none' && queue.pending.length > 0) {
      const action = queue.pending.shift();
      dispatch(action);
      setFlush(n => n + 1);
    }
  }, [plan, state, flush, queue, dispatch]);

  const extraKeys = new Set(current.extras.map(e => e.route.key));
  for (const k of Object.keys(known.current)) {
    if (!descriptors[k] && !extraKeys.has(k)) {
      delete known.current[k];
    }
  }
  const visibleKeys = new Set<string>();
  // The top page, and the pages below it while only modal pages (Ionic overlays) cover them.
  for (let i = state.routes.length - 1; i >= 0; i--) {
    visibleKeys.add(state.routes[i].key);
    if (presentationOf(descriptors[state.routes[i].key]) !== 'modal') {
      break;
    }
  }
  if (plan.under) {
    visibleKeys.add(plan.under); // forward: the old page shows under the entering one until it has finished
  }

  const items: { route: Route; phase: 'idle' | 'entering' | 'leaving' }[] = [
    ...state.routes.map(route => ({ route, phase: route.key === plan.entering ? ('entering' as const) : ('idle' as const) })),
    ...current.extras.filter(e => e.role === 'leaving').map(e => ({ route: e.route, phase: 'leaving' as const })),
  ];

  return (
    <View testID="ion-stack" style={styles.root} pointerEvents={plan.type === 'none' ? 'auto' : 'none'}>
      {items.map(({ route, phase }) => {
        const d = descriptors[route.key] ?? known.current[route.key];
        return (
          <Card
            key={route.key}
            testID={`ion-card-${route.name}`}
            phase={phase}
            presentation={presentationOf(d)}
            visible={phase === 'leaving' || visibleKeys.has(route.key)}
            onDone={finish}
          >
            <PresentationContext.Provider value={presentationOf(d)}>{d.render()}</PresentationContext.Provider>
          </Card>
        );
      })}
    </View>
  );
}

function IonStackNavigator({ id, initialRouteName, children, screenOptions, screenListeners, screenLayout, layout, UNSTABLE_router }: any) {
  const queue = useRef<Queue>({ busy: false, pending: [] }).current;
  const { state, descriptors, navigation, render } = useNavigationBuilder(StackRouter, {
    id,
    initialRouteName,
    children,
    screenOptions,
    screenListeners,
    screenLayout,
    layout,
    UNSTABLE_router: (original: any) => ({
      ...(UNSTABLE_router ? UNSTABLE_router(original) : null),
      getStateForAction(s: any, action: any, options: any) {
        if (queue.busy && STACK_ACTIONS.includes(action.type)) {
          queue.pending.push(action);
          return s; // handled, nothing changes yet
        }
        return original.getStateForAction(s, action, options);
      },
    }),
  } as any);

  // Ionic Tabs.select(): tapping the selected tab pops that tab's stack to its root page. (Same as native-stack.)
  useEffect(() => {
    let handle: ReturnType<typeof requestAnimationFrame> | undefined;
    // there may not be a tab navigator in the parents
    const unsubscribe = (navigation as any).addListener?.('tabPress', (e: any) => {
      const isFocused = navigation.isFocused();
      if (handle !== undefined) {
        cancelAnimationFrame(handle);
      }
      // next frame, so every listener has run and defaultPrevented is known
      handle = requestAnimationFrame(() => {
        const current = navigation.getState();
        if (isFocused && e.data?.behavior?.popToTop !== false && current.index > 0 && !e.defaultPrevented) {
          navigation.dispatch({ ...StackActions.popToTop(), target: current.key });
        }
      });
    });
    return () => {
      unsubscribe?.();
      if (handle !== undefined) {
        cancelAnimationFrame(handle);
      }
    };
  }, [navigation]);

  return render(<IonStackView state={state as StackNavigationState<ParamListBase>} descriptors={descriptors as any} queue={queue} dispatch={navigation.dispatch} />);
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hidden: { display: 'none' },
  clip: { overflow: 'hidden' }, // .ion-page { contain: strict }: nothing (shadows) paints outside the page box
});

// createIonStackNavigator() -> { Navigator, Screen, Group }, used like createNativeStackNavigator().
// Screen options: { presentation?: 'card' | 'modal' } (see RouteMeta.presentation).
export const createIonStackNavigator: () => any = () => createNavigatorFactory(IonStackNavigator)();
