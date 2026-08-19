import * as faceapi from '@vladmandic/face-api';

let modelsLoaded = false;
let loadPromise: Promise<void> | null = null;

const MODEL_URL = '/models';

export async function loadFaceModels(): Promise<void> {
  if (modelsLoaded) return;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    await faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL);
    await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
    modelsLoaded = true;
  })();

  return loadPromise;
}

const detectorOptions = () =>
  new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.45 });

/**
 * Detect all faces in a canvas snapshot.
 * Returns array of detections with landmarks + 128-float descriptors.
 */
export async function detectFacesFromCanvas(canvas: HTMLCanvasElement) {
  await loadFaceModels();
  return faceapi
    .detectAllFaces(canvas, detectorOptions())
    .withFaceLandmarks(true)
    .withFaceDescriptors();
}

/**
 * Detect all faces in a live video element.
 * Returns array of detections with landmarks + 128-float descriptors.
 */
export async function detectFaces(video: HTMLVideoElement): Promise<any[]> {
  await loadFaceModels();

  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return [];
  }

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  return faceapi
    .detectAllFaces(canvas, detectorOptions())
    .withFaceLandmarks(true)
    .withFaceDescriptors();
}

/**
 * For student registration — returns descriptor only if exactly 1 face found.
 */
export async function getSingleFaceDescriptor(
  video: HTMLVideoElement
): Promise<Float32Array | null> {
  await loadFaceModels();

  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  // draw a single stable snapshot of the video frame
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const results = await faceapi
    .detectAllFaces(canvas, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
    .withFaceLandmarks(true)
    .withFaceDescriptors();

  if (results.length !== 1) return null;
  return results[0].descriptor;
}

/**
 * Draw bounding boxes with confidence scores on a canvas overlay.
 * Canvas must be positioned absolutely over the video element.
 */
export function drawDetections(
  canvas: HTMLCanvasElement,
  detections: any[],
  displaySize: { width: number; height: number }
) {
  faceapi.matchDimensions(canvas, displaySize);
  const resized = faceapi.resizeResults(detections, displaySize);

  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  resized.forEach((d: any) => {
    const { x, y, width, height } = d.detection.box;
    const score = Math.round(d.detection.score * 100);

    // Draw box
    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);

    // Draw label
    const label = `${score}%`;
    ctx.font = 'bold 11px sans-serif';
    const tw = ctx.measureText(label).width;
    ctx.fillStyle = '#4f46e5';
    ctx.fillRect(x, y - 18, tw + 8, 18);
    ctx.fillStyle = '#fff';
    ctx.fillText(label, x + 4, y - 5);
  });
}
