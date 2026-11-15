import {
  ChevronDown,
  Grid3x3,
  type LucideIcon,
  Ruler,
  Settings,
  Timer,
  Zap,
  ZapOff,
} from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/ui/components';
import { t } from '@/ui/strings';
import { color, radius, size, space, type } from '@/ui/tokens';

import { type FlashMode, type GridMode, type TimerSec, useCameraStore } from './cameraStore';

type Props = {
  top: number;
  open: boolean;
  onToggleOpen: () => void;
  onSettings: () => void;
};

/** Chiều cao thanh trên (không tính vùng an toàn). */
export const TOP_BAR_H = size.iconButton + 8;

/**
 * Thanh trên của Camera (design.md §6.1): cụm kính Thước cân bằng · Tỉ lệ · Mở thêm bên trái, Cài
 * đặt bên phải. Mở thêm: bảng Đèn flash, Hẹn giờ, Lưới (góp ý Phase 4). Flash hoặc hẹn giờ đang
 * bật thì nút Mở thêm có chấm báo, để biết mà không phải mở bảng.
 */
export function CameraTopBar({ top, open, onToggleOpen, onSettings }: Props) {
  const flash = useCameraStore((s) => s.flash);
  const timer = useCameraStore((s) => s.timer);
  const level = useCameraStore((s) => s.level);
  const aspect = useCameraStore((s) => s.aspect);
  const store = useCameraStore.getState;

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
            icon={Ruler}
            label={level ? t.camera.levelOn : t.camera.levelOff}
            onPress={store().toggleLevel}
            active={level}
          />
          <BarButton label={t.camera.aspect(aspect)} onPress={store().cycleAspect} wide>
            <Text style={[type.label, styles.ink]}>{aspect}</Text>
          </BarButton>
          <BarButton
            icon={ChevronDown}
            label={open ? t.camera.lessTools : t.camera.moreTools}
            onPress={onToggleOpen}
            active={open}
            flip={open}
            soft
            dot={!open && (flash !== 'off' || timer > 0)}
          />
        </View>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={t.camera.openSpikes}
          hitSlop={4}
          onPress={onSettings}
          style={[styles.glass, styles.settings]}
        >
          <Settings size={size.icon} strokeWidth={2} color={color.camInk} />
        </PressableScale>
      </View>

      {open && <ToolsPanel top={top + TOP_BAR_H + space[1]} />}
    </>
  );
}

const FLASH_OPTIONS: { key: FlashMode; label: string }[] = [
  { key: 'off', label: t.camera.offShort },
  { key: 'auto', label: t.camera.autoShort },
  { key: 'on', label: t.camera.onShort },
];

const TIMER_OPTIONS: { key: TimerSec; label: string }[] = [
  { key: 0, label: t.camera.offShort },
  { key: 3, label: '3 s' },
  { key: 10, label: '10 s' },
];

const GRID_OPTIONS: { key: GridMode; label: string }[] = [
  { key: 'off', label: t.camera.offShort },
  { key: '3', label: '3×3' },
  { key: '4', label: '4×4' },
];

function ToolsPanel({ top }: { top: number }) {
  const flash = useCameraStore((s) => s.flash);
  const timer = useCameraStore((s) => s.timer);
  const grid = useCameraStore((s) => s.grid);
  const store = useCameraStore.getState;
  return (
    <View style={[styles.panel, { top }]}>
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
        icon={Grid3x3}
        label={t.camera.grid}
        options={GRID_OPTIONS}
        value={grid}
        onChange={store().setGrid}
      />
    </View>
  );
}

/** Một hàng của bảng mở thêm: icon + tên bên trái, thanh chọn tối bên phải. */
function PanelRow<K extends string | number>({
  icon: Icon,
  label,
  options,
  value,
  onChange,
}: {
  icon: LucideIcon;
  label: string;
  options: { key: K; label: string }[];
  value: K;
  onChange: (k: K) => void;
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
              style={[styles.segCell, on && styles.segOn]}
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
  flip,
  soft,
  dot,
  children,
}: {
  icon?: LucideIcon;
  label: string;
  onPress: () => void;
  active?: boolean;
  badge?: string;
  wide?: boolean;
  /** Mũi tên xoay ngược khi bảng đang mở. */
  flip?: boolean;
  /** Nền mờ nhẹ cho nút Mở thêm. */
  soft?: boolean;
  /** Chấm báo: có cài đặt đang bật nằm trong bảng mở thêm. */
  dot?: boolean;
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
      {Icon && (
        <View style={flip && styles.flip}>
          <Icon size={size.icon} strokeWidth={2} color={color.camInk} />
        </View>
      )}
      {children}
      {badge && <Text style={styles.badge}>{badge}</Text>}
      {dot && <View style={styles.dot} />}
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
  flip: { transform: [{ rotate: '180deg' }] },
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
  dot: {
    position: 'absolute',
    right: 6,
    top: 6,
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: color.camWarn,
  },
  ink: { color: color.camInk },
  muted: { color: color.camMuted },
  panel: {
    position: 'absolute',
    left: size.edge,
    right: size.edge,
    maxWidth: 360,
    paddingVertical: space[2],
    paddingHorizontal: space[4],
    borderRadius: radius.xl,
    backgroundColor: color.camPanel,
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
  segOn: { backgroundColor: color.accent },
});
