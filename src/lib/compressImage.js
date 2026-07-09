// src/lib/compressImage.js

export async function compressImage(file, options = {}) {
    const {
      maxWidth = 900,
      maxHeight = 1200,
      quality = 0.78,
      outputType = "image/webp",
    } = options;
  
    if (!file || !file.type?.startsWith("image/")) {
      throw new Error("Please select a valid image file.");
    }
  
    const imageBitmap = await createImageBitmap(file);
  
    const scale = Math.min(
      maxWidth / imageBitmap.width,
      maxHeight / imageBitmap.height,
      1
    );
  
    const width = Math.round(imageBitmap.width * scale);
    const height = Math.round(imageBitmap.height * scale);
  
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
  
    const context = canvas.getContext("2d");
  
    if (!context) {
      throw new Error("Image compression is not supported in this browser.");
    }
  
    context.drawImage(imageBitmap, 0, 0, width, height);
  
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (compressedBlob) => {
          if (!compressedBlob) {
            reject(new Error("Failed to compress image."));
            return;
          }
  
          resolve(compressedBlob);
        },
        outputType,
        quality
      );
    });
  
    const originalName = file.name.replace(/\.[^/.]+$/, "");
    const compressedName = `${originalName}.webp`;
  
    return new File([blob], compressedName, {
      type: outputType,
      lastModified: Date.now(),
    });
  }
  