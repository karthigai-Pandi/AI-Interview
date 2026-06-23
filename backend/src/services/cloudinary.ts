import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config';

let configured = false;

function ensureConfigured(): void {
  if (!configured && config.cloudinary.cloudName) {
    cloudinary.config({
      cloud_name: config.cloudinary.cloudName,
      api_key: config.cloudinary.apiKey,
      api_secret: config.cloudinary.apiSecret,
    });
    configured = true;
  }
}

export async function uploadToCloudinary(
  buffer: Buffer,
  filename: string,
  folder = 'resumes'
): Promise<{ url: string; publicId: string }> {
  ensureConfigured();

  if (!config.cloudinary.cloudName) {
    const base64 = buffer.toString('base64');
    const mimeType = filename.endsWith('.pdf')
      ? 'application/pdf'
      : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    return {
      url: `data:${mimeType};base64,${base64}`,
      publicId: `local/${filename}`,
    };
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'raw', public_id: filename.replace(/\.[^/.]+$/, '') },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error('Upload failed'));
          return;
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  ensureConfigured();
  if (config.cloudinary.cloudName) {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
  }
}
