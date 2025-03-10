import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream"; 

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});
const uploadOnCloudinary = async (fileBuffer) => {
    try {
      if (!fileBuffer) return null;
  
      // Return a promise that resolves with the upload result
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: "auto",
          },
          (error, result) => {
            if (error) {
              console.error("Upload to cloudinary failed:", error);
              reject(error);
              return;
            }
            resolve(result);
          }
        );
  
        // Convert buffer to stream and pipe to cloudinary
        const bufferStream = Readable.from(fileBuffer);
        bufferStream.pipe(uploadStream);
      });
    } catch (error) {
      console.error("Error in uploadOnCloudinary:", error);
      return null;
    }
  };
  export { uploadOnCloudinary };