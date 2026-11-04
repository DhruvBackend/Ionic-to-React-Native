// Ported from: the `.grid-layout > .product-data.two-column` block that product-detail.html:42-57 and newarrivals.html:36-52 share
// (identical markup; Newarrivals only swaps `url` for `imageUrl`, both = dbService.product_image_url).
import React from 'react';
import { Image, Pressable, View } from 'react-native';
import { MaterialIcon } from '../../components/ionic/MaterialIcon';
import { LineClamp1 } from '../../components/ionic/LineClamp1';
import { Text } from '../../components/ionic/IonText';
import { textStyle } from '../../components/ionic/text';
import { colors } from '../../theme';
import { productListMd as P } from '../../theme/ionicMdProductList';
import { interp } from '../../ui/angularPipes';
import { styles } from './styles';

interface Props {
  list: any[];
  url: string;
  onPress: (id: any) => void;
  testPrefix: string;
}

export function ProductGrid({ list, url, onPress, testPrefix }: Props) {
  // `.grid-layout`: two equal columns, gap 16; the cells of one row are as tall as the tallest (grid items stretch).
  const rows: any[][] = [];
  for (let i = 0; i < list.length; i += 2) {
    rows.push(list.slice(i, i + 2).map((item, j) => ({ item, index: i + j })));
  }
  return (
    <View testID={`${testPrefix}-grid`}>
      {rows.map((row: any, r: number) => (
        <View key={r} style={[styles.gridRow, r === rows.length - 1 ? styles.gridRowLast : null]}>
          {row.map(({ item, index }: any, c: number) => {
            // NOTE (parity): a null row (only from a malformed later page, concat(null)) makes Ionic's template throw; RN shows an empty card.
            const l = item ?? {};
            return (
              <React.Fragment key={index}>
                {c === 1 ? <View style={styles.gridGap} /> : null}
                <Pressable testID={`${testPrefix}-item-${index}`} style={styles.gridCell} onPress={() => onPress(l.id)}>
                  <View style={styles.productData}>
                    {/* `*ngIf="list.actual_image_name"` img, else the perm_media icon */}
                    <View style={styles.imageThumbnail}>
                      {l.actual_image_name ? (
                        <Image testID={`${testPrefix}-image-${index}`} source={{ uri: url + l.actual_image_name }} resizeMode="contain" style={styles.image} />
                      ) : (
                        <MaterialIcon name="perm_media" size={50} color={P.placeholderIcon} />
                      )}
                    </View>
                    <View style={styles.content}>
                      {/* `.content h6 { -webkit-line-clamp: 1 }`: "…" after the last whole word, like Chrome (kit LineClamp1) */}
                      <LineClamp1 testID={`${testPrefix}-name-${index}`} style={[textStyle(13, 500, P.name, 20), styles.h6]}>
                        {String(interp(l.product_name))}
                      </LineClamp1>
                      <View style={styles.code}>
                        <Text testID={`${testPrefix}-code-${index}`} style={textStyle(12, 400, P.bodyText)}>
                          {interp(l.material_code)}
                        </Text>
                        <Text testID={`${testPrefix}-price-${index}`} style={textStyle(14, 700, colors.primary)}>
                          {`â‚¹ ${interp(l.price)}`}
                        </Text>
                      </View>
                    </View>
                  </View>
                </Pressable>
              </React.Fragment>
            );
          })}
          {row.length === 1 ? (
            <>
              <View style={styles.gridGap} />
              <View style={styles.gridCell} />
            </>
          ) : null}
        </View>
      ))}
    </View>
  );
}
