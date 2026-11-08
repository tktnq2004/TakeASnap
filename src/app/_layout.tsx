// Import theo từng weight để chỉ đóng gói 3 file font thay vì cả họ (design.md §3.3).
import { DMMono_500Medium } from '@expo-google-fonts/dm-mono/500Medium';
import { Urbanist_400Regular } from '@expo-google-fonts/urbanist/400Regular';
import { Urbanist_500Medium } from '@expo-google-fonts/urbanist/500Medium';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { migrate } from '@/db/migrations';
import { SegmenterProvider } from '@/engine/segmentation/SegmenterProvider';
import { color, radius } from '@/ui/tokens';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Urbanist_400Regular, Urbanist_500Medium, DMMono_500Medium });

  if (!fontsLoaded) return <View style={styles.root} />;

  return (
    <GestureHandlerRootView style={styles.root}>
      <SQLiteProvider databaseName="takeasnap.db" onInit={migrate}>
        {/* WebView tách người chế độ local (roadmap §3.7): gắn một lần, nạp model khi cần. */}
        <SegmenterProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: color.bg },
              animation: 'fade',
            }}
          >
            {/* Thư viện pose: sheet cao 88% trên Camera (design.md §6.3). */}
            <Stack.Screen
              name="library"
              options={{
                presentation: 'formSheet',
                sheetAllowedDetents: [0.88],
                sheetGrabberVisible: true,
                sheetCornerRadius: radius.lg,
                contentStyle: { backgroundColor: color.bg },
              }}
            />
            {/* Chỉnh pose mở từ sheet nên phải là modal để hiện được trên sheet. */}
            <Stack.Screen name="editor/[poseId]" options={{ presentation: 'fullScreenModal' }} />
            <Stack.Screen
              name="spike/sheet"
              options={{
                presentation: 'formSheet',
                sheetAllowedDetents: [0.88],
                sheetGrabberVisible: true,
                sheetCornerRadius: radius.lg,
                contentStyle: { backgroundColor: color.surface },
              }}
            />
          </Stack>
        </SegmenterProvider>
      </SQLiteProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
});
