import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { color, size, space, type } from '@/ui/tokens';

type Props = {
  title?: string;
  children: ReactNode;
  scroll?: boolean;
};

/** Khung cho màn nội dung: nền bg, lề 24, tôn trọng safe area. Camera không dùng khung này. */
export function Screen({ title, children, scroll = true }: Props) {
  const insets = useSafeAreaInsets();
  const body = (
    <>
      {title ? (
        <Text accessibilityRole="header" style={[type.title, styles.title]}>
          {title}
        </Text>
      ) : null}
      {children}
    </>
  );
  const padding = {
    paddingTop: insets.top + space[4],
    paddingBottom: insets.bottom + space[5],
    paddingHorizontal: size.gutter,
  };
  return scroll ? (
    <ScrollView style={styles.root} contentContainerStyle={[padding, styles.gap]}>
      {body}
    </ScrollView>
  ) : (
    <View style={[styles.root, padding, styles.gap]}>{body}</View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
  gap: { gap: space[5] },
  title: { color: color.ink },
});
