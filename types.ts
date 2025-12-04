
export interface WatermarkSettings {
  opacity: number;
  scale: number;
  position: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'tiled';
  margin: number;
  outputFormat: 'image/jpeg' | 'image/png' | 'image/webp';
  shadow: boolean;
  brightness: number;
  contrast: number;
  saturation: number;
}

export interface ProcessedImage {
  id: string;
  originalFile: File;
  previewUrl: string; // The URL of the processed image (blob)
  status: 'pending' | 'processing' | 'done' | 'error';
  errorMessage?: string;
}

export interface AppState {
  images: ProcessedImage[];
  logo: File | null;
  logoPreviewUrl: string | null;
  settings: WatermarkSettings;
  isProcessing: boolean;
}