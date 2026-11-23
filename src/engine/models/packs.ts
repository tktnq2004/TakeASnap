/**
 * Gói model tải một lần khi dùng chức năng lần đầu, lưu vĩnh viễn trong máy (phương án C,
 * roadmap §3.3, BR-13). URL cố định phiên bản; kích thước dùng để báo tiến độ và kiểm tra file đủ.
 * Đổi phiên bản thì đổi `version` để máy cũ tải lại.
 */
import {
  MEDIAPIPE_VERSION,
  MODEL_FILES,
  SKY_FILES,
  SKY_URLS,
  TFJS_VERSION,
} from 'composition-critic/page';

export type PackFile = { name: string; url: string; bytes: number; mime: string };
export type ModelPack = { id: string; version: string; files: PackFile[] };

const MP = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}`;
const GCS = 'https://storage.googleapis.com/mediapipe-models';

/** Gói pose (~43.5 MB): tách người Multiclass + nét mặt + khớp cơ thể (dò lại mặt nhỏ). */
export const POSE_PACK: ModelPack = {
  id: 'pose',
  version: `mp-${MEDIAPIPE_VERSION}-1`,
  files: [
    {
      name: 'vision_bundle.mjs',
      url: `${MP}/vision_bundle.mjs`,
      bytes: 156_139,
      mime: 'text/javascript',
    },
    {
      name: 'vision_wasm_internal.js',
      url: `${MP}/wasm/vision_wasm_internal.js`,
      bytes: 334_128,
      mime: 'text/javascript',
    },
    {
      name: 'vision_wasm_internal.wasm',
      url: `${MP}/wasm/vision_wasm_internal.wasm`,
      bytes: 13_519_922,
      mime: 'application/wasm',
    },
    {
      name: MODEL_FILES.multiclass,
      url: `${GCS}/image_segmenter/selfie_multiclass_256x256/float32/1/${MODEL_FILES.multiclass}`,
      bytes: 16_371_837,
      mime: 'application/octet-stream',
    },
    {
      name: MODEL_FILES.face,
      url: `${GCS}/face_landmarker/face_landmarker/float16/1/${MODEL_FILES.face}`,
      bytes: 3_758_596,
      mime: 'application/octet-stream',
    },
    {
      name: MODEL_FILES.body,
      url: `${GCS}/pose_landmarker/pose_landmarker_full/float16/1/${MODEL_FILES.body}`,
      bytes: 9_398_198,
      mime: 'application/octet-stream',
    },
  ],
};

/**
 * Gói trời (~3,9 MB, Phase 5a): TF.js + DeepLab v3 ADE20K lượng tử 1 byte, tìm vùng trời để dò
 * chân trời. Chỉ tải khi dùng kỹ thuật Đường chân trời lần đầu. Model tải qua tfhub.dev (chuyển
 * tiếp sang kho của Kaggle), đường dẫn có số phiên bản.
 */
export const SKY_PACK: ModelPack = {
  id: 'sky',
  version: `tfjs-${TFJS_VERSION}-ade20k-q1-1`,
  files: [
    { name: SKY_FILES.tfjs, url: SKY_URLS.tfjs, bytes: 1_469_843, mime: 'text/javascript' },
    { name: SKY_FILES.model, url: SKY_URLS.model, bytes: 143_776, mime: 'application/json' },
    {
      name: SKY_FILES.weights,
      url: SKY_URLS.weights,
      bytes: 2_294_595,
      mime: 'application/octet-stream',
    },
  ],
};

export const packBytes = (p: ModelPack) => p.files.reduce((s, f) => s + f.bytes, 0);
