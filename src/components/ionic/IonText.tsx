// Kit Text (Phase 2 kit pass, 2026-11-03). Browsers break lines greedily (fill each line, then wrap); Android's
// Text defaults to textBreakStrategy "highQuality", which balances a paragraph's lines and so wraps words earlier
// than Chrome did (seen first on AboutusModal). Every screen and kit component renders text through this wrapper,
// so "simple" (= greedy) is the default everywhere; an explicit textBreakStrategy still wins. iOS ignores the prop.
// .eslintrc.js bans importing Text from react-native in src/screens and src/components.
import React from 'react';
import { Text as RNText, type TextProps } from 'react-native';

export const Text = React.forwardRef<React.ComponentRef<typeof RNText>, TextProps>(function KitText(
  { textBreakStrategy = 'simple', ...rest },
  ref,
) {
  return <RNText ref={ref} textBreakStrategy={textBreakStrategy} {...rest} />;
});
