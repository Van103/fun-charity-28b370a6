// Shared media upload limits and helpers

export const MAX_IMAGE_BYTES = 20 * 1024 * 1024; // 20MB
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100MB

export function formatBytesToMB(bytes: number): string {
  const mb = bytes / 1024 / 1024;
  return `${Math.round(mb)}MB`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function getUploadLimitForFile(file: File): number {
  return file.type?.startsWith("video/") ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  speed: number; // bytes per second
  remainingTime: number; // seconds
}

// Upload file with progress tracking using XMLHttpRequest
// Returns an object with the promise and an abort function
export interface UploadController {
  promise: Promise<void>;
  abort: () => void;
}

export function uploadFileWithProgress(
  url: string,
  file: File,
  headers: Record<string, string>,
  onProgress: (progress: UploadProgress) => void
): UploadController {
  const xhr = new XMLHttpRequest();
  let startTime = Date.now();
  let lastLoaded = 0;
  let lastTime = startTime;

  const promise = new Promise<void>((resolve, reject) => {
    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        const now = Date.now();
        const timeDiff = (now - lastTime) / 1000; // seconds
        const loadedDiff = event.loaded - lastLoaded;
        
        // Calculate speed (bytes per second) with smoothing
        const instantSpeed = timeDiff > 0 ? loadedDiff / timeDiff : 0;
        const avgSpeed = event.loaded / ((now - startTime) / 1000);
        const speed = avgSpeed * 0.7 + instantSpeed * 0.3; // weighted average
        
        // Calculate remaining time
        const remaining = event.total - event.loaded;
        const remainingTime = speed > 0 ? remaining / speed : 0;

        onProgress({
          loaded: event.loaded,
          total: event.total,
          percentage: Math.round((event.loaded / event.total) * 100),
          speed,
          remainingTime,
        });

        lastLoaded = event.loaded;
        lastTime = now;
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.responseText}`));
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Upload failed due to network error"));
    });

    xhr.addEventListener("abort", () => {
      reject(new Error("Upload cancelled"));
    });

    xhr.open("POST", url, true);
    
    for (const [key, value] of Object.entries(headers)) {
      xhr.setRequestHeader(key, value);
    }

    xhr.send(file);
  });

  return {
    promise,
    abort: () => xhr.abort(),
  };
}

// Video compression using Canvas and MediaRecorder
export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  videoBitrate?: number; // in bits per second
  audioBitrate?: number;
  onProgress?: (progress: number) => void;
}

export async function compressVideo(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const {
    maxWidth = 1280,
    maxHeight = 720,
    videoBitrate = 2_000_000, // 2 Mbps
    onProgress,
  } = options;

  // Create video element to load the file
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;

  const objectUrl = URL.createObjectURL(file);

  try {
    // Load video metadata
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("Failed to load video"));
      video.src = objectUrl;
    });

    // Calculate new dimensions
    let { videoWidth: width, videoHeight: height } = video;
    const aspectRatio = width / height;

    if (width > maxWidth) {
      width = maxWidth;
      height = Math.round(width / aspectRatio);
    }
    if (height > maxHeight) {
      height = maxHeight;
      width = Math.round(height * aspectRatio);
    }

    // Ensure dimensions are even (required for some codecs)
    width = Math.floor(width / 2) * 2;
    height = Math.floor(height / 2) * 2;

    // Create canvas for rendering
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;

    // Get canvas stream
    const stream = canvas.captureStream(30); // 30 fps

    // Try to add audio track if video has audio
    try {
      const audioContext = new AudioContext();
      const source = audioContext.createMediaElementSource(video);
      const destination = audioContext.createMediaStreamDestination();
      source.connect(destination);
      source.connect(audioContext.destination);
      
      destination.stream.getAudioTracks().forEach((track) => {
        stream.addTrack(track);
      });
    } catch {
      // Video might not have audio, ignore
    }

    // Create MediaRecorder
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : MediaRecorder.isTypeSupported("video/webm;codecs=vp8")
      ? "video/webm;codecs=vp8"
      : "video/webm";

    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: videoBitrate,
    });

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    // Start recording
    recorder.start(100); // Collect data every 100ms

    // Play video and render to canvas
    video.currentTime = 0;
    await video.play();

    const duration = video.duration;

    // Render loop
    await new Promise<void>((resolve) => {
      const render = () => {
        if (video.ended || video.paused) {
          recorder.stop();
          resolve();
          return;
        }

        ctx.drawImage(video, 0, 0, width, height);
        
        if (onProgress) {
          onProgress(Math.min(99, Math.round((video.currentTime / duration) * 100)));
        }

        requestAnimationFrame(render);
      };

      video.onended = () => {
        recorder.stop();
        resolve();
      };

      render();
    });

    // Wait for recorder to finish
    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
    });

    if (onProgress) {
      onProgress(100);
    }

    // Create new file from chunks
    const blob = new Blob(chunks, { type: mimeType });
    const compressedFile = new File(
      [blob],
      file.name.replace(/\.[^.]+$/, ".webm"),
      { type: mimeType }
    );

    return compressedFile;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

// Check if video needs compression
export function shouldCompressVideo(file: File, targetSize: number = 50 * 1024 * 1024): boolean {
  return file.type.startsWith("video/") && file.size > targetSize;
}
