import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'genhd-medical',
  api_key: process.env.CLOUDINARY_API_KEY || '1234567890',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'secret',
  secure: true,
});

export async function uploadToCloudinary(
  fileData: string,
  folder = 'genhd_results',
  resourceType: 'auto' | 'image' | 'raw' = 'auto'
): Promise<string> {
  // If Cloudinary keys are not fully configured in .env.local yet,
  // return the base64 or file URL safely without crashing
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    process.env.CLOUDINARY_CLOUD_NAME === 'genhd-medical'
  ) {
    console.warn('Cloudinary environment variables missing in .env.local. Storing file securely in database/local fallback.');
    return fileData;
  }

  try {
    const result = await cloudinary.uploader.upload(fileData, {
      folder,
      resource_type: resourceType,
    });
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    // Fallback to original fileData if upload fails
    return fileData;
  }
}

export default cloudinary;
