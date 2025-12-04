
import { WatermarkSettings } from '../types';

export const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error(`Failed to read file: "${file.name}". It may be locked or corrupted.`));
    reader.readAsDataURL(file);
  });
};

export const loadImage = (src: string, fileName?: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(fileName 
      ? `Failed to load image data for "${fileName}". The file format might be unsupported or the file is corrupted.` 
      : "Failed to load image data."));
    img.src = src;
  });
};

export const applyWatermarkToImage = async (
  imageFile: File,
  logoFile: File,
  settings: WatermarkSettings
): Promise<string> => {
  try {
    // Parallel file reading with specific error context
    const [imageSrc, logoSrc] = await Promise.all([
      readFileAsDataURL(imageFile).catch(e => { throw new Error(`Unable to read source image: ${e.message}`); }),
      readFileAsDataURL(logoFile).catch(e => { throw new Error(`Unable to read logo file: ${e.message}`); }),
    ]);

    // Parallel image loading with specific error context
    const [img, logo] = await Promise.all([
      loadImage(imageSrc, imageFile.name),
      loadImage(logoSrc, logoFile.name),
    ]);

    // Validate image dimensions to prevent browser crashes
    const MAX_DIMENSION = 16384; // Common safe limit for canvas
    if (img.width > MAX_DIMENSION || img.height > MAX_DIMENSION) {
        throw new Error(`Image "${imageFile.name}" is too large (${img.width}x${img.height}). Max allowed dimension is ${MAX_DIMENSION}px.`);
    }
    
    if (img.width === 0 || img.height === 0) {
        throw new Error(`Image "${imageFile.name}" has invalid dimensions.`);
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) throw new Error('System memory low. Could not create drawing context.');

    // Set canvas dimensions to match original image
    canvas.width = img.width;
    canvas.height = img.height;

    // Apply image enhancements (Brightness, Contrast, Saturation)
    if (settings.brightness !== 100 || settings.contrast !== 100 || settings.saturation !== 100) {
        ctx.filter = `brightness(${settings.brightness}%) contrast(${settings.contrast}%) saturate(${settings.saturation}%)`;
    }

    // Draw original image with filters
    ctx.drawImage(img, 0, 0);

    // Reset filter so the watermark itself is not affected by image enhancements
    ctx.filter = 'none';

    // Configure watermark
    const logoWidth = (img.width * settings.scale) / 100;
    const aspectRatio = logo.height / logo.width;
    const logoHeight = logoWidth * aspectRatio;

    ctx.globalAlpha = settings.opacity / 100;

    // Configure Shadow if enabled
    if (settings.shadow) {
        const shadowBase = Math.max(img.width, img.height);
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = shadowBase * 0.01; // 1% of size
        ctx.shadowOffsetX = shadowBase * 0.003; // 0.3% of size
        ctx.shadowOffsetY = shadowBase * 0.003;
    } else {
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    }

    const marginX = (img.width * settings.margin) / 100;
    const marginY = (img.height * settings.margin) / 100;

    if (settings.position === 'tiled') {
        const gap = logoWidth * 1.5; // spacing between tiles
        for (let x = 0; x < img.width; x += gap) {
            for (let y = 0; y < img.height; y += (gap * aspectRatio)) {
                ctx.drawImage(logo, x, y, logoWidth, logoHeight);
            }
        }
    } else {
        let x = 0;
        let y = 0;

        switch (settings.position) {
          case 'top-left':
            x = marginX;
            y = marginY;
            break;
          case 'top-right':
            x = canvas.width - logoWidth - marginX;
            y = marginY;
            break;
          case 'bottom-left':
            x = marginX;
            y = canvas.height - logoHeight - marginY;
            break;
          case 'bottom-right':
            x = canvas.width - logoWidth - marginX;
            y = canvas.height - logoHeight - marginY;
            break;
          case 'center':
            x = (canvas.width - logoWidth) / 2;
            y = (canvas.height - logoHeight) / 2;
            break;
        }
        ctx.drawImage(logo, x, y, logoWidth, logoHeight);
    }

    // Reset styles
    ctx.globalAlpha = 1.0;
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Return as Blob URL
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) {
                resolve(URL.createObjectURL(blob));
            } else {
                reject(new Error(`Failed to process "${imageFile.name}". The resulting image might be too large/complex.`));
            }
        }, settings.outputFormat, 0.95);
    });

  } catch (error) {
    console.error('Watermarking failed:', error);
    throw error;
  }
};
