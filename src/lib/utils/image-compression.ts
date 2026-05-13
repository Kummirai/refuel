const MAX_DIMENSION = 1920;
const QUALITY = 0.7;
const MAX_COMPRESSED_SIZE = 2 * 1024 * 1024;

export async function compressImage(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) return file;

  const img = await createImageBitmap(file);

  let { width, height } = img;
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, width, height);
  img.close();

  const mimeType = file.type === "image/png" ? "image/jpeg" : file.type;

  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else resolve(file);
      },
      mimeType,
      QUALITY,
    );
  });

  if (blob.size > MAX_COMPRESSED_SIZE) {
    const compressed = await compressToMaxSize(canvas, mimeType);
    return compressed;
  }

  return blob;
}

async function compressToMaxSize(
  canvas: HTMLCanvasElement,
  mimeType: string,
): Promise<Blob> {
  let quality = 0.5;
  const step = 0.1;

  for (let i = 0; i < 5; i++) {
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else resolve(new Blob([]));
        },
        mimeType,
        quality,
      );
    });

    if (blob.size <= MAX_COMPRESSED_SIZE || quality <= 0.1) {
      if (blob.size > 0) return blob;
      break;
    }

    quality -= step;
  }

  const fallback = await new Promise<Blob>((resolve) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else resolve(new Blob([]));
      },
      mimeType,
      0.1,
    );
  });

  return fallback;
}
