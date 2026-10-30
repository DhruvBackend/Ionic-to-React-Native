// ionic-select-searchable@2.10.0 `<select-searchable item-content>`: the predecessor of ionic-selectable that
// the Topbath SFA order pages still use (add-order.html:69,75,81, dealer-addorder.html:28,36,44,52,
// sales-app/add-distribution.html:177,197). Same markup, same CSS values and the same logic as
// ionic-selectable 3.5.0 for every option Topbath passes (items, itemValueField, itemTextField, canSearch,
// hasVirtualScroll, (onChange), (onSearch)), so it renders through the same components; only the
// OK button prop is named `okButtonText` there. These pages exist only behind features.sfa.
import React, { forwardRef } from 'react';
import { IonicSelectable, type IonicSelectableProps, type SelectableHandle } from './IonicSelectable';

export interface SelectSearchableProps<T = any> extends Omit<IonicSelectableProps<T>, 'confirmButtonText' | 'library'> {
  okButtonText?: string;
}

function SelectSearchableInner<T = any>({ okButtonText, ...rest }: SelectSearchableProps<T>, ref: React.Ref<SelectableHandle>) {
  return <IonicSelectable<T> ref={ref} {...rest} confirmButtonText={okButtonText} library="select-searchable" testID={rest.testID ?? 'select-searchable'} />;
}

// `#category` template refs are used with .open() (add-order.ts), so the handle is forwarded
export const SelectSearchable = forwardRef(SelectSearchableInner) as <T = any>(
  props: SelectSearchableProps<T> & { ref?: React.Ref<SelectableHandle> },
) => React.ReactElement | null;
