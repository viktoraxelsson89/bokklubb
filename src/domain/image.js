export async function compressImage(file, { maxWidth = 1200, quality = 0.85 } = {}) {
  const dataUrl = await readAsDataURL(file);
  const img = await loadImage(dataUrl);

  const scale = Math.min(1, maxWidth / img.width);
  const targetW = Math.round(img.width * scale);
  const targetH = Math.round(img.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, targetW, targetH);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => (blob ? resolve(blob) : reject(new Error('Kunde inte komprimera bild'))),
      'image/jpeg',
      quality,
    );
  });
}

function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
