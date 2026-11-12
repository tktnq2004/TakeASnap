import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';

/**
 * Rời màn hiện tại một lần. Chạm nhanh hai lần (nhất là trên Android emulator chậm) gọi
 * `router.back()` hai lần: lần hai không còn màn để quay lại, expo-router báo "GO_BACK was not
 * handled". Khi màn được mở thẳng, không có lịch sử, thì thay bằng Camera.
 * Mở khóa lại khi màn được focus lần nữa (ví dụ quay về từ Chỉnh pose).
 */
export function useGoBack() {
  const leaving = useRef(false);

  useFocusEffect(
    useCallback(() => {
      leaving.current = false;
    }, []),
  );

  return useCallback(() => {
    if (leaving.current) return;
    leaving.current = true;
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, []);
}
