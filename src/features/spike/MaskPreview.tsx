import {
  Canvas,
  Group,
  Image,
  Rect,
  Skia,
  type SkImage,
  useImage,
} from '@shopify/react-native-skia';
import { useMemo } from 'react';

import { color } from '@/ui/tokens';

export type PreviewMode = 'cut' | 'mask' | 'source';

type Props = {
  photoUri: string;
  maskBase64: string;
  width: number;
  height: number;
  mode: PreviewMode;
};

/**
 * Ghép ảnh + mask bằng Skia, đúng cách Phase 1 sẽ vẽ lớp "Người": vẽ mask, rồi vẽ ảnh với
 * blendMode srcIn trong một layer riêng, nên ảnh chỉ hiện ở chỗ mask có alpha.
 */
export function MaskPreview({ photoUri, maskBase64, width, height, mode }: Props) {
  const photo = useImage(photoUri);
  const mask = useMemo<SkImage | null>(
    () => Skia.Image.MakeImageFromEncoded(Skia.Data.fromBase64(maskBase64)),
    [maskBase64],
  );
  const box = { x: 0, y: 0, width, height };

  return (
    <Canvas style={{ width, height }}>
      <Rect {...box} color={mode === 'mask' ? '#000000' : color.surface} />
      {mode === 'source' && photo && <Image image={photo} {...box} fit="contain" />}
      {mode === 'mask' && mask && <Image image={mask} {...box} fit="contain" />}
      {mode === 'cut' && photo && mask && (
        <Group layer>
          <Image image={mask} {...box} fit="contain" />
          <Image image={photo} {...box} fit="contain" blendMode="srcIn" />
        </Group>
      )}
    </Canvas>
  );
}
