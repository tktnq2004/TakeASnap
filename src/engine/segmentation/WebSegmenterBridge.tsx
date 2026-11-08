import { useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import type { Landmarks, SegmentModelId, SegmentTimings, WebSegmentResult } from './types';
import { segmenterHtml } from './web/segmenterHtml';

type ReadyInfo = {
  ua: string;
  ort: boolean;
  webgl2: boolean;
  wasm: boolean;
  crossOriginIsolated: boolean;
};

type OkMessage = { id: number; ok: true } & Record<string, unknown>;

type Pending = {
  resolve: (msg: OkMessage) => void;
  reject: (e: Error) => void;
  timer: ReturnType<typeof setTimeout>;
};

type Incoming =
  | { type: 'ready'; info: ReadyInfo }
  | { type: 'log'; message: string }
  | OkMessage
  | { id: number; ok: false; error: string };

/** Lần đầu dùng RMBG phải tải ~44 MB, nên cho phép lâu. */
const TIMEOUT_MS = 180_000;

/**
 * Cầu nối RN ↔ WebView ẩn chạy model tách người (roadmap §3.3).
 * Gắn `element` vào cây view một lần, rồi gọi `run(model, base64)`.
 */
/**
 * Type chung của react-native-webview khai báo WebView là FunctionComponent (không có ref), dù bản
 * iOS/Android thật là forwardRef. Chỉ cần postMessage nên khai báo kiểu tối thiểu.
 */
type WebViewHandle = { postMessage: (data: string) => void; reload: () => void };

export function useWebSegmenter() {
  const ref = useRef<WebViewHandle | null>(null);
  const pending = useRef(new Map<number, Pending>());
  const nextId = useRef(1);
  const [info, setInfo] = useState<ReadyInfo | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const onMessage = (e: WebViewMessageEvent) => {
    let msg: Incoming;
    try {
      msg = JSON.parse(e.nativeEvent.data) as Incoming;
    } catch {
      return;
    }
    // Trả lời cho một yêu cầu thì có id; thông báo của trang (ready, log) thì không.
    if (!('id' in msg)) {
      if (msg.type === 'ready') setInfo(msg.info);
      else setLogs((l) => [...l.slice(-19), msg.message]);
      return;
    }
    const p = pending.current.get(msg.id);
    if (!p) return;
    clearTimeout(p.timer);
    pending.current.delete(msg.id);
    if (msg.ok) p.resolve(msg);
    else p.reject(new Error(msg.error as string));
  };

  /**
   * iOS/Android đóng tiến trình WebView (thường do hết bộ nhớ): trang chết im lặng, không gửi
   * được lỗi. Báo lỗi cho mọi yêu cầu đang chờ rồi nạp lại trang (spike B, RMBG treo 180 s).
   */
  const onProcessGone = () => {
    const message = 'WebView bị hệ điều hành đóng, có thể do hết bộ nhớ';
    setInfo(null);
    setLogs((l) => [...l.slice(-19), message]);
    for (const [id, p] of pending.current) {
      clearTimeout(p.timer);
      p.reject(new Error(message));
      pending.current.delete(id);
    }
    ref.current?.reload();
  };

  /** Tách người: mask PNG cùng kích thước ảnh vào. */
  const run = async (model: SegmentModelId, base64: string): Promise<WebSegmentResult> =>
    (await request({ type: 'segment', model, base64 })) as unknown as WebSegmentResult;

  /** Nét mặt + khung xương (lớp Nét của pose). */
  const landmarks = async (base64: string) =>
    (await request({ type: 'landmarks', base64 })) as unknown as Landmarks & {
      timings: SegmentTimings;
    };

  const request = (payload: Record<string, unknown>) =>
    new Promise<OkMessage>((resolve, reject) => {
      const id = nextId.current++;
      const timer = setTimeout(() => {
        pending.current.delete(id);
        reject(new Error(`Quá ${TIMEOUT_MS / 1000} giây không có kết quả`));
      }, TIMEOUT_MS);
      pending.current.set(id, { resolve, reject, timer });
      ref.current?.postMessage(JSON.stringify({ id, ...payload }));
    });

  const element = useMemo(
    () => (
      <View style={styles.host} pointerEvents="none">
        <WebView
          {...({ ref } as object)}
          source={{ html: segmenterHtml, baseUrl: 'https://localhost/' }}
          originWhitelist={['*']}
          javaScriptEnabled
          webviewDebuggingEnabled
          onMessage={onMessage}
          onContentProcessDidTerminate={onProcessGone}
          onRenderProcessGone={onProcessGone}
          style={styles.web}
        />
      </View>
    ),
    // onMessage chỉ dùng ref và setState ổn định; WebView không được tạo lại khi re-render.
    [],
  );

  return { element, run, landmarks, ready: info !== null, info, logs };
}

const styles = StyleSheet.create({
  // WebView phải có kích thước > 0 thì iOS mới chạy JS bình thường; đặt 1 px, gần như trong suốt.
  host: { position: 'absolute', left: 0, top: 0, width: 1, height: 1, opacity: 0.01 },
  web: { width: 1, height: 1, backgroundColor: 'transparent' },
});
