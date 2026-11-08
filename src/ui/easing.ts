import { Easing } from 'react-native-reanimated';

import { motion } from './tokens';

/** Easing dựng từ token motion (design.md §3.5). Không có bounce hay overshoot. */
export const ease = Easing.bezier(...motion.ease);
export const easeIO = Easing.bezier(...motion.easeIO);
