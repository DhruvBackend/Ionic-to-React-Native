// <ion-searchbar> (components/searchbar/searchbar.js, searchbar.md.scss) with the Topbath overrides
// (variables.scss:1239-1290 `.search` / `.search.add-search`, 9827-9837 global). See ionicMdScroll.ts.
//
// Events (searchbar.js):
//  - `onChangeText` = ngModelChange: fires on EVERY keystroke (the `value` setter calls onChange immediately).
//  - `onIonInput`   = (ionInput): debounced by `debounce` (250 ms default) via TimeoutDebouncer.
//  - clear button: ionClear now, then after 64 ms (16 * 4) `value = ''` (ngModelChange) and ionInput (not debounced),
//    only if there was a value; the input keeps focus (`_shouldBlur = false`).
//    NOTE (parity): the template binds BOTH (click) and (mousedown) to clearInput (searchbar.js:341), so one tap runs it twice:
//    ionClear fires twice, while the value reset and ionInput happen once (the second timer finds the value already ''). The same
//    holds for the cancel button (cancelSearchbar -> ionCancel and ionClear, each twice).
//  - `onSubmit` = (keyup.enter), which the pages bind themselves. Ionic's input keeps focus on Enter (keyup.enter does not blur
//    the input, the page just reads the model), hence submitBehavior="submit" (RN's default would blur and dismiss the keyboard).
//  - NOTE (parity): `text-transform: capitalize` on the typed text (variables.scss:1248, 1271) only changes how Ionic DRAWS the
//    text; the model keeps what was typed. RN's TextInput cannot draw a transformed copy of its own text, and
//    autoCapitalize="words" would change the typed text itself (different model value), so only the placeholder is
//    capitalised. Known limit: typed text shows as typed.
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Svg, { Path, Polygon } from 'react-native-svg';
import { ionicColors } from '../../theme';
import { searchbarIconPaths, searchbarMd, topbathSearchbar, type SearchbarContext } from '../../theme/ionicMdScroll';
import { fontFor } from '../../theme/typography';
import { IonIcon } from './IonIcon';

export interface IonSearchbarProps {
  value?: string; // [(ngModel)]
  onChangeText?: (value: string) => void; // ngModelChange (immediate)
  onIonInput?: (value: string) => void; // (ionInput) (debounced)
  onIonClear?: () => void;
  onIonCancel?: () => void;
  onSubmit?: () => void; // (keyup.enter)
  placeholder?: string; // default 'Search' (searchbar.js:59)
  debounce?: number; // default 250
  showCancelButton?: boolean; // default false (never set in Topbath)
  type?: 'text' | 'search'; // `type` attr; default 'search' (searchbar.js:63 `this.type = 'search'`), which gets the keyboard search key
  context?: SearchbarContext; // where the template puts it (default: .search.add-search, 17 of 20 usages; gift-list is .search; cart-detail (.cs-search) and main-distributor-list are bare)
  testID?: string;
}

function capitalizeWords(s: string): string {
  return s.replace(/(^|\s)(\S)/g, (_m, a: string, b: string) => a + b.toUpperCase());
}

export function IonSearchbar({
  value,
  onChangeText,
  onIonInput,
  onIonClear,
  onIonCancel,
  onSubmit,
  placeholder = searchbarMd.placeholder,
  debounce = searchbarMd.debounceMs,
  showCancelButton = false,
  type = 'search',
  context = 'addSearch',
  testID = 'ion-searchbar',
}: IonSearchbarProps) {
  const [val, setVal] = useState(value ?? '');
  const [focused, setFocused] = useState(false);
  const valRef = useRef(val);
  const input = useRef<React.ComponentRef<typeof TextInput>>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const clearTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const cb = useRef({ onChangeText, onIonInput });
  cb.current = { onChangeText, onIonInput };

  useEffect(() => {
    // ngModel writeValue: updates the box, emits nothing
    if (value !== undefined && value !== valRef.current) {
      valRef.current = value;
      setVal(value);
    }
  }, [value]);
  useEffect(
    () => () => {
      clearTimeout(timer.current);
      clearTimeout(clearTimer.current);
    },
    [],
  );

  const set = (v: string) => {
    valRef.current = v;
    setVal(v);
  };
  const emitInput = (v: string) => {
    // TimeoutDebouncer.debounce: wait <= 0 calls straight away (util/debouncer.js)
    clearTimeout(timer.current);
    if (debounce <= 0) {
      cb.current.onIonInput?.(v);
    } else {
      timer.current = setTimeout(() => cb.current.onIonInput?.(v), debounce);
    }
  };
  const onText = (v: string) => {
    set(v);
    cb.current.onChangeText?.(v);
    emitInput(v);
  };
  const clearOnce = () => {
    onIonClear?.();
    clearTimeout(clearTimer.current);
    // setTimeout(..., 16 * 4): fixes ionic#7527; ionInput here is emitted directly, not debounced
    clearTimer.current = setTimeout(() => {
      if (valRef.current !== '') {
        set('');
        cb.current.onChangeText?.('');
        cb.current.onIonInput?.('');
      }
    }, searchbarMd.clearDelayMs);
    input.current?.focus(); // _shouldBlur = false keeps the focus
  };
  const clearInput = () => {
    // NOTE (parity): (click) + (mousedown) both call clearInput: ionClear twice, the reset once
    clearOnce();
    clearOnce();
  };
  const cancel = () => {
    // NOTE (parity): same double binding on the cancel button: ionCancel and ionClear twice each
    for (let i = 0; i < 2; i++) {
      onIonCancel?.();
      clearOnce();
    }
    input.current?.blur();
  };

  const s = geometry(context);
  const showCancel = focused && showCancelButton;
  const hasValue = val !== '';
  return (
    <View testID={testID} style={[styles.host, { paddingHorizontal: s.paddingHorizontal }]}>
      <View style={[styles.container, { paddingRight: s.containerPaddingRight, height: s.containerHeight }]}>
        {showCancel ? (
          <Pressable
            testID={`${testID}-cancel`}
            onPress={cancel}
            style={[styles.cancel, { left: searchbarMd.cancelIconLeft }]}
          >
            <IonIcon name="md-arrow-back" size={24} color={ionicColors.dark} />
          </Pressable>
        ) : (
          <View
            testID={`${testID}-icon`}
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: s.iconLeft,
              top: s.iconTop,
              width: s.iconBox,
              height: s.iconBox,
              overflow: 'hidden', // box smaller than the 20 px background -> cropped (variables.scss:1281)
              zIndex: 1,
            }}
          >
            <Svg width={s.iconBackground} height={s.iconBackground} viewBox="0 0 512 512">
              <Path fill={searchbarMd.searchIconColor} d={searchbarIconPaths.search} />
            </Svg>
          </View>
        )}
        <TextInput
          ref={input}
          testID={`${testID}-input`}
          value={val}
          onChangeText={onText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onSubmitEditing={onSubmit}
          submitBehavior="submit" // Enter does not blur / dismiss the keyboard (keyup.enter only)
          placeholder={s.capitalize ? capitalizeWords(placeholder) : placeholder}
          placeholderTextColor={searchbarMd.placeholderColor}
          autoCorrect={false}
          autoComplete="off"
          spellCheck={false}
          returnKeyType={type === 'search' ? 'search' : 'default'}
          underlineColorAndroid="transparent"
          style={[
            fontFor(400),
            {
              height: s.inputHeight,
              marginTop: s.marginTop,
              borderRadius: s.inputRadius,
              borderWidth: s.borderWidth,
              borderColor: s.borderColor,
              paddingTop: 0,
              paddingBottom: 0,
              paddingLeft: s.paddingLeft,
              paddingRight: s.paddingRight,
              fontSize: s.fontSize,
              letterSpacing: s.letterSpacing,
              color: searchbarMd.textColor,
              backgroundColor: searchbarMd.inputBackground,
              textAlignVertical: 'center',
            },
            s.shadow ? { boxShadow: searchbarMd.inputShadow } : null,
          ]}
        />
        {focused && hasValue ? (
          <Pressable
            testID={`${testID}-clear`}
            onPress={clearInput}
            style={[styles.clear, { right: searchbarMd.clearIconRight }]}
          >
            <Svg width={searchbarMd.clearIconSize} height={searchbarMd.clearIconSize} viewBox="0 0 512 512">
              <Polygon fill={searchbarMd.clearIconColor} points={searchbarIconPaths.clear} />
            </Svg>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function geometry(context: SearchbarContext) {
  const md = searchbarMd;
  const tb = topbathSearchbar;
  if (context === 'addSearch') {
    const a = tb.addSearch;
    return {
      paddingHorizontal: a.paddingHorizontal,
      containerPaddingRight: a.containerPaddingRight,
      containerHeight: a.inputHeight,
      inputHeight: a.inputHeight,
      marginTop: 0,
      inputRadius: a.inputRadius,
      borderWidth: a.borderWidth,
      borderColor: undefined as string | undefined,
      paddingLeft: a.inputPadding.left,
      paddingRight: a.inputPadding.right,
      fontSize: a.fontSize,
      letterSpacing: a.letterSpacing,
      shadow: true,
      iconLeft: a.iconLeft,
      iconTop: a.iconTop,
      iconBox: a.iconBox,
      iconBackground: md.searchIconSize,
      capitalize: true,
    };
  }
  if (context === 'search') {
    const q = tb.search;
    return {
      paddingHorizontal: tb.global.paddingHorizontal, // global `padding:0 16px!important` beats `0 32px`
      containerPaddingRight: 0,
      containerHeight: q.inputHeight + q.marginTop, // block with a -27 px child margin in a flex item
      inputHeight: q.inputHeight,
      marginTop: q.marginTop,
      inputRadius: tb.global.inputRadius, // `border-radius:30px!important` beats 20px
      borderWidth: q.borderWidth,
      borderColor: q.borderColor,
      paddingLeft: md.inputPaddingHorizontal,
      paddingRight: md.inputPaddingHorizontal,
      fontSize: q.fontSize,
      letterSpacing: 0,
      shadow: false, // `box-shadow:none!important`
      iconLeft: q.iconLeft,
      iconTop: q.iconTop,
      iconBox: md.searchIconBox,
      iconBackground: q.iconBackgroundSize,
      capitalize: true,
    };
  }
  return {
    paddingHorizontal: tb.bare.paddingHorizontal,
    containerPaddingRight: 0,
    containerHeight: tb.bare.inputHeight,
    inputHeight: tb.bare.inputHeight,
    marginTop: 0,
    inputRadius: tb.global.inputRadius,
    borderWidth: 0,
    borderColor: undefined as string | undefined,
    paddingLeft: md.inputPaddingHorizontal,
    paddingRight: md.inputPaddingHorizontal,
    fontSize: md.inputFontSize,
    letterSpacing: 0,
    shadow: true,
    iconLeft: md.searchIconLeft,
    iconTop: md.searchIconTop,
    iconBox: md.searchIconBox,
    iconBackground: md.searchIconSize,
    capitalize: false,
  };
}

const styles = StyleSheet.create({
  // ion-searchbar{position:relative;display:flex;align-items:center;width:100%} (searchbar.scss)
  host: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  // .searchbar-input-container{position:relative;display:block;flex-shrink:1;width:100%}
  container: { position: 'relative', flexShrink: 1, width: '100%' },
  cancel: { position: 'absolute', top: 0, height: '100%', width: 21, zIndex: 1, justifyContent: 'center', alignItems: 'center' },
  clear: { position: 'absolute', top: 0, height: '100%', width: 22, zIndex: 1, justifyContent: 'center', alignItems: 'center' },
});
