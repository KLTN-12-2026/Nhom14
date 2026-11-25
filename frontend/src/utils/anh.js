// Tiện ích xử lý ảnh phía client: đọc file -> nén -> data URL.
//
// Vì sao nén: BE từng lưu base64 thô (1 ảnh ~2MB) làm tràn cache
// localStorage của FE. Canvas thu nhỏ về tối đa 1280px + JPEG 0.8
// -> ~100–300KB, vẫn đủ nét để AI đánh giá.

export const ANH_TOI_DA_BYTES = 5 * 1024 * 1024;

// Trả Promise<dataURL> — ảnh đã thu nhỏ + nén JPEG.
export function nenAnh(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('doc anh loi'));

    reader.onload = () => {
      try {
        const img = new Image();

        img.onerror = () => reject(new Error('tai anh loi'));
        img.onload = () => {
          try {
            const TOI_DA = 1280;
            const tiLe = Math.min(1, TOI_DA / Math.max(img.width, img.height));
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(img.width * tiLe);
            canvas.height = Math.round(img.height * tiLe);
            canvas
              .getContext('2d')
              .drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
          } catch {
            resolve(String(reader.result));
          }
        };

        img.src = String(reader.result);
      } catch {
        reject(new Error('nen anh loi'));
      }
    };

    reader.readAsDataURL(file);
  });
}
