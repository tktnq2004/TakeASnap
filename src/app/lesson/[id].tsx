import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Camera, Check, X } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCameraStore } from '@/features/camera/cameraStore';
import { LessonDiagram } from '@/features/composition/LessonDiagram';
import { lessonById } from '@/features/composition/lessons';
import { useEdgeSwipeBack } from '@/gestures/useEdgeSwipeBack';
import { useGoBack } from '@/lib/useGoBack';
import { Button, EmptyState, FlowHeader } from '@/ui/components';
import { t } from '@/ui/strings';
import { color, radius, size, space, type } from '@/ui/tokens';

/**
 * Một thẻ học (design.md §6.15): hai hình sai / đúng cạnh nhau, ba đoạn ngắn, nguồn, nút Chụp thử
 * về Camera với kỹ thuật đó bật sẵn (business-flow §6.6). Vuốt từ mép trái để quay lại.
 */
export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const lesson = lessonById(id ?? '');
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const goBack = useGoBack();
  const swipe = useEdgeSwipeBack(goBack, width);

  if (!lesson) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <FlowHeader title={t.lessons.tab} onBack={goBack} />
        <EmptyState message={t.lessons.notFound} />
      </View>
    );
  }

  const item = t.lessons.items[lesson.id];
  const imgW = (width - size.edge * 2 - GAP) / 2;

  const tryIt = () => {
    useCameraStore.getState().setTechnique(lesson.tryTechnique);
    // Về thẳng Camera: đóng thẻ học và Thư viện.
    router.dismissAll();
  };

  const para = (title: string, body: string) => (
    <View style={styles.para}>
      <Text style={[type.caption, styles.muted]}>{title}</Text>
      <Text style={[type.body, styles.ink]}>{body}</Text>
    </View>
  );

  return (
    <GestureDetector gesture={swipe.gesture}>
      <Animated.View style={[styles.root, { paddingTop: insets.top }, swipe.style]}>
        <StatusBar style="light" />
        <FlowHeader title={t.lessons.tab} onBack={goBack} />
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 96 }]}
        >
          <Text accessibilityRole="header" style={[type.title, styles.ink, styles.title]}>
            {item.name}
          </Text>
          <View style={styles.pair}>
            {(['wrong', 'right'] as const).map((k) => {
              const ok = k === 'right';
              const Icon = ok ? Check : X;
              return (
                <View key={k} style={{ width: imgW }} accessible accessibilityLabel={item[k]}>
                  <View style={styles.image}>
                    <LessonDiagram scene={lesson[k]} ok={ok} width={imgW} />
                  </View>
                  <View style={styles.verdict}>
                    <Icon
                      size={size.iconSmall}
                      strokeWidth={3}
                      color={ok ? color.accent : color.danger}
                    />
                    <Text style={[type.label, ok ? styles.accent : styles.danger, styles.flex]}>
                      {item[k]}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
          <View style={styles.card}>
            {para(t.lessons.what, item.what)}
            {para(t.lessons.when, item.when)}
            {para(t.lessons.breakRule, item.breakRule)}
          </View>
          <View style={styles.sources}>
            <Text style={[type.caption, styles.muted]}>{t.lessons.sources}</Text>
            {lesson.sources.map((src) => (
              <View key={src.title} style={styles.source}>
                <Text style={[type.hint, styles.ink]}>{src.title}</Text>
                <Text style={[type.caption, styles.muted]}>{src.by}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
        <View style={[styles.bottom, { bottom: insets.bottom + space[4] }]}>
          <Button label={t.lessons.tryIt} icon={Camera} onPress={tryIt} fullWidth />
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const GAP = 12;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
  content: { paddingHorizontal: size.edge, gap: space[4] },
  title: { marginTop: space[2] },
  pair: { flexDirection: 'row', gap: GAP },
  image: { borderRadius: radius.lg, overflow: 'hidden' },
  verdict: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: space[2] },
  flex: { flex: 1 },
  card: { padding: 18, borderRadius: radius.xl, backgroundColor: color.surface, gap: space[4] },
  para: { gap: 6 },
  sources: { paddingHorizontal: space[1], gap: space[2] },
  source: { gap: 2 },
  bottom: { position: 'absolute', left: size.edge, right: size.edge },
  ink: { color: color.ink },
  muted: { color: color.muted },
  accent: { color: color.accent },
  danger: { color: color.danger },
});
