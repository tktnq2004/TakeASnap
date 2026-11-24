import {
  ChevronDown,
  Grid3x3,
  Layers,
  type LucideIcon,
  Ruler,
  Settings,
  Timer,
  Zap,
  ZapOff,
} from 'lucide-react-native';
import { type ReactNode, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolate,
  type SharedValue,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import type { SceneTechnique } from '@/features/composition/guidance';
import { TechniqueIcon } from '@/features/composition/TechniqueIcon';
import type { TechniqueId } from '@/features/composition/techniques';
import { PressableScale } from '@/ui/components';
import { easeIO } from '@/ui/easing';
import { t } from '@/ui/strings';
import { color, motion, radius, size, space, type } from '@/ui/tokens';

import { type FlashMode, type TimerSec, useCameraStore } from './cameraStore';

type Props = {
  top: number;
  open: boolean;
  onToggleOpen: () => void;
  onSettings: () => void;
  /** Mở bảng Bố cục (design.md §6.15). */
  onComposition: () => void;
  /** Chọn bố cục phụ ở bảng Mở thêm (null: tắt). */
  onScene: (scene: SceneTechnique | null) => void;
};

/** Chiều cao thanh trên (không tính vùng an toàn). */
export const TOP_BAR_H = size.iconButton + 8;

/**
 * Thanh trên của Camera (design.md §6.1, §6.15): cụm kính Đèn flash · Hẹn giờ · Bố cục ·
 * Thước cân bằng · Tỉ lệ · Mở thêm bên trái, Cài đặt bên phải. Chạm nút trên thanh để đổi nhanh;
 * Bố cục mở bảng kéo lên; Mở thêm thả xuống bảng chọn thẳng giá trị cho Đèn flash, Hẹn giờ, Bố
 * cục phụ (phiếu Phase 5b lần 2, mục 10.1: chip bố cục phụ trên khung ngắm che một góc ảnh).
 */
export function CameraTopBar({
  top,
  open,
  onToggleOpen,
  onSettings,
  onComposition,
  onScene,
}: Props) {
  const flash = useCameraStore((s) => s.flash);
  const timer = useCameraStore((s) => s.timer);
  const main = useCameraStore((s) => s.technique);
  const scene = useCameraStore((s) => s.scene);
  // Chỉ bật bố cục phụ (Phase 5b): nút vẽ bố cục phụ; có bố cục chính thì nút vẽ bố cục chính.
  const technique: TechniqueId = main === 'off' && scene ? scene : main;
  const level = useCameraStore((s) => s.level);
  const aspect = useCameraStore((s) => s.aspect);
  const store = useCameraStore.getState;

  // 0 = bảng thu, 1 = bảng thả xuống hết. Mũi tên Mở thêm xoay theo.
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(open ? 1 : 0);
  useEffect(() => {
    const to = open ? 1 : 0;
    progress.set(reduceMotion ? to : withTiming(to, { duration: motion.panel, easing: easeIO }));
  }, [open, progress, reduceMotion]);

  const flashLabel =
    flash === 'off' ? t.camera.flashOff : flash === 'on' ? t.camera.flashOn : t.camera.flashAuto;
  const compositionLabel =
    technique === 'off'
      ? t.composition.buttonOff
      : t.composition.turnOff(t.composition.names[technique]);

  return (
    <>
      {/* Bảng đang mở: chạm ra ngoài (trừ thanh trên) để thu gọn. */}
      {open && (
        <Pressable
          accessibilityLabel={t.camera.lessTools}
          style={StyleSheet.absoluteFill}
          onPress={onToggleOpen}
        />
      )}
      <View style={[styles.bar, { top }]} pointerEvents="box-none">
        <View style={styles.glass}>
          <BarButton
            icon={flash === 'off' ? ZapOff : Zap}
            label={flashLabel}
            onPress={store().cycleFlash}
            active={flash !== 'off'}
            badge={flash === 'auto' ? 'A' : undefined}
          />
          <BarButton
            icon={Timer}
            label={timer === 0 ? t.camera.timerOff : t.camera.timerSec(timer)}
            onPress={store().cycleTimer}
            active={timer > 0}
            badge={timer > 0 ? String(timer) : undefined}
          />
          <BarButton
            icon={isGrid(technique) ? Grid3x3 : undefined}
            label={compositionLabel}
            onPress={onComposition}
            active={technique !== 'off'}
            badge={
              main !== 'off' && scene
                ? '+'
                : technique === 'grid'
                  ? '3'
                  : technique === 'grid4'
                    ? '4'
                    : undefined
            }
          >
            {!isGrid(technique) && (
              <TechniqueIcon
                kind={technique}
                width={18}
                height={22}
                ink={color.camInk}
                accent={color.camInk}
              />
            )}
          </BarButton>
          <BarButton
            icon={Ruler}
            label={level ? t.camera.levelOn : t.camera.levelOff}
            onPress={store().toggleLevel}
            active={level}
          />
          <BarButton label={t.camera.aspect(aspect)} onPress={store().cycleAspect} wide>
            <Text style={[type.label, styles.ink]}>{aspect}</Text>
          </BarButton>
          <BarButton
            label={open ? t.camera.lessTools : t.camera.moreTools}
            onPress={onToggleOpen}
            active={open}
            soft
          >
            <Chevron progress={progress} />
          </BarButton>
        </View>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={t.settings.title}
          hitSlop={4}
          onPress={onSettings}
          style={[styles.glass, styles.settings]}
        >
          <Settings size={size.icon} strokeWidth={2} color={color.camInk} />
        </PressableScale>
      </View>

      <ToolsPanel
        top={top + TOP_BAR_H + space[1]}
        open={open}
        progress={progress}
        onScene={onScene}
      />
    </>
  );
}

/** Tắt và hai kiểu lưới dùng icon lưới (lưới có huy hiệu 3 / 4 như nút Lưới cũ). */
const isGrid = (t: TechniqueId) => t === 'off' || t === 'grid' || t === 'grid4';

function Chevron({ progress }: { progress: SharedValue<number> }) {
  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(progress.get(), [0, 1], [0, 180])}deg` }],
  }));
  return (
    <Animated.View style={style}>
      <ChevronDown size={size.icon} strokeWidth={2} color={color.camInk} />
    </Animated.View>
  );
}

const FLASH_OPTIONS: { key: FlashMode; label: string }[] = [
  { key: 'off', label: t.camera.offShort },
  { key: 'auto', label: t.camera.autoShort },
  { key: 'on', label: t.camera.onShort },
];

type SceneKey = SceneTechnique | 'off';
const SCENE_OPTIONS: { key: SceneKey; label: string }[] = [
  { key: 'off', label: t.camera.offShort },
  { key: 'horizon', label: t.composition.guide.short.horizon },
  { key: 'lead', label: t.composition.guide.short.lead },
];

const TIMER_OPTIONS: { key: TimerSec; label: string }[] = [
  { key: 0, label: t.camera.offShort },
  { key: 3, label: '3 s' },
  { key: 10, label: '10 s' },
];

/**
 * Bảng mở thêm: thả xuống từ dưới thanh trên (cao dần từ 0, các hàng trượt xuống và hiện dần),
 * thu lên khi đóng. Luôn gắn sẵn để chạy được hiệu ứng đóng; lúc thu thì không nhận chạm.
 */
function ToolsPanel({
  top,
  open,
  progress,
  onScene,
}: {
  top: number;
  open: boolean;
  progress: SharedValue<number>;
  onScene: (scene: SceneTechnique | null) => void;
}) {
  const flash = useCameraStore((s) => s.flash);
  const timer = useCameraStore((s) => s.timer);
  const scene = useCameraStore((s) => s.scene);
  const store = useCameraStore.getState;
  const [contentH, setContentH] = useState(0);

  const shellStyle = useAnimatedStyle(() => ({
    height: progress.get() * contentH,
    opacity: interpolate(progress.get(), [0, 0.25, 1], [0, 1, 1]),
  }));
  const rowsStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.get(), [0, 0.5, 1], [0, 0, 1]),
    transform: [{ translateY: interpolate(progress.get(), [0, 1], [-12, 0]) }],
  }));

  return (
    <Animated.View
      pointerEvents={open ? 'auto' : 'none'}
      accessibilityElementsHidden={!open}
      importantForAccessibility={open ? 'auto' : 'no-hide-descendants'}
      style={[styles.panel, { top }, shellStyle]}
    >
      <Animated.View
        style={[styles.panelInner, rowsStyle]}
        onLayout={(e) => setContentH(e.nativeEvent.layout.height)}
      >
        <PanelRow
          icon={flash === 'off' ? ZapOff : Zap}
          label={t.camera.flash}
          options={FLASH_OPTIONS}
          value={flash}
          onChange={store().setFlash}
        />
        <PanelRow
          icon={Timer}
          label={t.camera.timer}
          options={TIMER_OPTIONS}
          value={timer}
          onChange={store().setTimer}
        />
        <PanelRow
          icon={Layers}
          label={t.composition.guide.sceneRow}
          options={SCENE_OPTIONS}
          value={scene ?? 'off'}
          onChange={(k) => onScene(k === 'off' ? null : k)}
          compact
        />
      </Animated.View>
    </Animated.View>
  );
}

/** Một hàng của bảng mở thêm: icon + tên bên trái, thanh chọn tối bên phải. */
function PanelRow<K extends string | number>({
  icon: Icon,
  label,
  options,
  value,
  onChange,
  compact,
}: {
  icon: LucideIcon;
  label: string;
  options: { key: K; label: string }[];
  value: K;
  onChange: (k: K) => void;
  /** Ô chọn hẹp hơn (nhãn dài, máy hẹp). */
  compact?: boolean;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLabel}>
        <Icon size={size.iconSmall} strokeWidth={2} color={color.camAccent} />
        <Text style={[type.label, styles.ink]}>{label}</Text>
      </View>
      <View style={styles.seg} accessibilityRole="radiogroup" accessibilityLabel={label}>
        {options.map((o) => {
          const on = value === o.key;
          return (
            <Pressable
              key={String(o.key)}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`${label} ${o.label}`}
              onPress={() => onChange(o.key)}
              style={[styles.segCell, compact && styles.segCellCompact, on && styles.segOn]}
            >
              <Text style={[type.caption, on ? styles.ink : styles.muted]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function BarButton({
  icon: Icon,
  label,
  onPress,
  active,
  badge,
  wide,
  soft,
  children,
}: {
  icon?: LucideIcon;
  label: string;
  onPress: () => void;
  active?: boolean;
  badge?: string;
  wide?: boolean;
  /** Nền mờ nhẹ cho nút Mở thêm. */
  soft?: boolean;
  children?: ReactNode;
}) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!active }}
      hitSlop={2}
      onPress={onPress}
      style={[
        styles.button,
        wide && styles.buttonWide,
        soft && styles.buttonSoft,
        active && styles.buttonOn,
      ]}
    >
      {Icon && <Icon size={size.icon} strokeWidth={2} color={color.camInk} />}
      {children}
      {badge && <Text style={styles.badge}>{badge}</Text>}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: size.edge,
    right: size.edge,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  glass: {
    flexDirection: 'row',
    gap: 2,
    padding: 4,
    borderRadius: radius.full,
    backgroundColor: color.camGlass,
  },
  settings: {
    width: TOP_BAR_H,
    height: TOP_BAR_H,
    padding: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: size.iconButton,
    height: size.iconButton,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonWide: { width: size.iconButton + 8 },
  buttonSoft: { backgroundColor: 'rgba(255,255,255,0.18)' },
  buttonOn: { backgroundColor: color.accent },
  badge: {
    position: 'absolute',
    right: 0,
    top: 0,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 3,
    borderRadius: radius.full,
    overflow: 'hidden',
    backgroundColor: color.camInk,
    color: color.accent,
    textAlign: 'center',
    ...type.badge,
  },
  ink: { color: color.camInk },
  muted: { color: color.camMuted },
  panel: {
    position: 'absolute',
    left: size.edge,
    right: size.edge,
    maxWidth: 360,
    overflow: 'hidden',
    borderRadius: radius.xl,
    backgroundColor: color.camPanel,
  },
  // Không bị khung co lại: đo được chiều cao thật để thả xuống đúng tới đó.
  panelInner: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    paddingVertical: space[2],
    paddingHorizontal: space[4],
  },
  row: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLabel: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  seg: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  segCell: {
    paddingHorizontal: 12,
    height: 32,
    borderRadius: radius.full,
    justifyContent: 'center',
  },
  segCellCompact: { paddingHorizontal: 8 },
  segOn: { backgroundColor: color.accent },
});
