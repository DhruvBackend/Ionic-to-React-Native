// Ported from: src/pages/category/category.html:20-33 (the `.product-data` row); sub-category.html:21-34 repeats it.
import React from 'react';
import { Image, Pressable, View } from 'react-native';
import { db } from '../../api/client';
import { Text } from '../../components/ionic/IonText';
import { MaterialIcon } from '../../components/ionic/MaterialIcon';
import { textStyle } from '../../components/ionic/text';
import { colors } from '../../theme';
import { catalogueMd as C } from '../../theme/ionicMdCatalogue';
import { interp } from '../../ui/angularPipes';
import { styles } from './styles';

interface Props {
  row: any;
  index: number;
  testIDPrefix: string;
  onPress: () => void;
  centerTitle?: boolean; // sub-category.scss `page-sub-category .content { text-align: center }`
}

export function CatalogueRow({ row, index, testIDPrefix, onPress, centerTitle }: Props) {
  // NOTE (parity): a null/undefined row (concat of a missing `category`) makes Ionic's template throw; RN draws an empty row.
  const list = row ?? {};
  return (
    <Pressable testID={`${testIDPrefix}-row-${index}`} style={styles.productData} onPress={onPress}>
      <View style={styles.thumbnail}>
        {!list.actual_image_name ? <MaterialIcon name="perm_media" color={C.ink} /> : null}
        {list.actual_image_name ? (
          <Image
            testID={`${testIDPrefix}-image-${index}`}
            source={{ uri: db.category_url + list.actual_image_name }}
            resizeMode="contain"
            style={styles.thumbnailImg}
          />
        ) : null}
      </View>
      <View style={styles.content}>
        {/* [T] 4741-4745 `h6 { font-size: 13px; line-height: 22px; color }`, weight 500 (global h1..h6), margin 0 */}
        <Text
          testID={`${testIDPrefix}-title-${index}`}
          style={[textStyle(13, 500, C.title, 22), styles.title, centerTitle ? styles.titleCenter : null]}
        >
          {interp(list.main_category)}
        </Text>
        {/* NOTE (parity): `<i class="material-icons">chevron_right </i>` has a trailing space (collapsed by HTML); `font-weight: 600` does not change a single-weight icon font. */}
        <MaterialIcon name="chevron_right" color={colors.primary} style={styles.chevron} />
      </View>
    </Pressable>
  );
}
