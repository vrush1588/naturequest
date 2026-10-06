const MAX_IMAGE_DIMENSION = 800;

export async function resizeImageToDataUrl(file) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Choose an image file to attach.");
  }

  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
    const scale = Math.min(
      1,
      MAX_IMAGE_DIMENSION / Math.max(bitmap.width, bitmap.height),
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("This browser cannot resize the selected image.");
    }

    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.82);
  } catch (error) {
    throw new Error(`Unable to prepare this photo: ${error.message}`);
  } finally {
    bitmap?.close();
  }
}
