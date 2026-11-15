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

import { PressableScale, Toggle } from '@/ui/components';
import { t } from '@/ui/strings';
import { color, radius, size, space, type } from '@/ui/tokens';

import { type GridMode, useCameraStore } from './cameraStore';

type Props = {
  top: number;
  open: boolean;
  onToggleOpen: () => void;
  onSettings: () => void;
};

/** Chiều cao thanh trên (không tính vùng an toàn). */
export const TOP_BAR_H = size.iconButton + 8;

/**
 * Thanh trên của Camera (design.md §6.1): cụm kính Flash · Hẹn giờ · Tỉ lệ · Mở thêm bên trái,
 * Cài đặt bên phải. Mở thêm: bảng Lưới [Tắt | 3×3 | 4×4] và Thước cân bằng.
 */
export function CameraTopBar({ top, open, onToggleOpen, onSettings }: Props) {
  const flash = useCameraStore((s) => s.flash);
  const timer = useCameraStore((s) => s.timer);
  const aspect = useCameraStore((s) => s.aspect);
  const store = useCameraStore.getState;

  const flashLabel =
    flash === 'off' ? t.camera.flashOff : flash === 'on' ? t.camera.flashOn : t.camera.flashAuto;

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

const GRID_OPTIONS: { key: GridMode; label: string }[] = [
  { key: 'off', label: t.camera.gridOffShort },
  { key: '3', label: '3×3' },
  { key: '4', label: '4×4' },
];

function ToolsPanel({ top }: { top: number }) {
  const grid = useCameraStore((s) => s.grid);
  const level = useCameraStore((s) => s.level);
  const store = useCameraStore.getState;
  return (
    <View style={[styles.panel, { top }]}>
      <View style={styles.row}>
        <View style={styles.rowLabel}>
          <Grid3x3 size={size.iconSmall} strokeWidth={2} color={color.camAccent} />
          <Text style={[type.label, styles.ink]}>{t.camera.grid}</Text>
        </View>
        <View style={styles.seg} accessibilityRole="radiogroup" accessibilityLabel={t.camera.grid}>
          {GRID_OPTIONS.map((o) => {
            const on = grid === o.key;
            return (
              <Pressable
                key={o.key}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                accessibilityLabel={`${t.camera.grid} ${o.label}`}
                onPress={() => store().setGrid(o.key)}
                style={[styles.segCell, on && styles.segOn]}
              >
                <Text style={[type.caption, on ? styles.ink : styles.muted]}>{o.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.rowLabel}>
          <Ruler size={size.iconSmall} strokeWidth={2} color={color.camAccent} />
          <Text style={[type.label, styles.ink]}>{t.camera.level}</Text>
        </View>
        <Toggle value={level} onChange={() => store().toggleLevel()} label={t.camera.level} />
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
  ink: { color: color.camInk },
  muted: { color: color.camMuted },
  panel: {
    position: 'absolute',
    left: size.edge,
    width: 300,
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
