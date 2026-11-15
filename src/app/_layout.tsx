// Import theo từng weight để chỉ đóng gói 3 file font thay vì cả họ (design.md §3.3).
import { Nunito_600SemiBold } from '@expo-google-fonts/nunito/600SemiBold';
import { Nunito_700Bold } from '@expo-google-fonts/nunito/700Bold';
import { Nunito_800ExtraBold } from '@expo-google-fonts/nunito/800ExtraBold';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { migrate } from '@/db/migrations';
import { SegmenterProvider } from '@/engine/segmentation/SegmenterProvider';
import { color } from '@/ui/tokens';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold });

  if (!fontsLoaded) return <View style={styles.root} />;

  return (
    <GestureHandlerRootView style={styles.root}>
      {/* Giữ tên file cũ (từ hồi app tên TakeASnap) để không mất pose đã lưu. */}
      <SQLiteProvider databaseName="takeasnap.db" onInit={migrate}>
        {/* WebView tách người chế độ local (roadmap §3.7): gắn một lần, nạp model khi cần. */}
        <SegmenterProvider>
          {/* Camera nền tối: chữ sáng. Màn nền trắng tự đặt lại thành chữ tối. */}
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: color.bg },
              animation: 'fade',
            }}
          >
            {/* Thư viện pose: modal trên Camera (iOS: thẻ trượt lên; Android: toàn màn hình).
                formSheet có detent làm vỡ bố cục: ảnh đè lên tiêu đề và tab (góp ý Phase 2). */}
            <Stack.Screen name="library" options={{ presentation: 'modal' }} />
            {/* Xem ảnh vừa chụp: mở đè lên Camera như Thư viện (design.md §6.12). */}
            <Stack.Screen name="review" options={{ presentation: 'modal' }} />
            {/* Chỉnh pose mở từ sheet nên phải là modal để hiện được trên sheet. */}
            <Stack.Screen name="editor/[poseId]" options={{ presentation: 'fullScreenModal' }} />
          </Stack>
        </SegmenterProvider>
      </SQLiteProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
});
