/** Resize a picked image in the browser so it can be stored on the vendor profile. */
export function readImageFileAsJpeg(
  file: File,
  maxEdge = 720,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Choose an image file.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('That file is not a valid image.'));
      img.onload = () => {
        const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not process the image.'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
