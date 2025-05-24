// 'multer' will upload the file into the server. Then, 'cloudinary' will upload it to 3rd party Cloudinary cloud storage from the server.
import { v2 as cloudinary } from "cloudinary";
import fs from "fs"; // Used for managing file systems. Comes by default with node.

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET, // Click 'View API Keys' above to copy your API secret
});


const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    // Upload file on Cloudinary
    const response = await cloudinary.uploader.upload
    (
      localFilePath, 
      { 
        resource_type:'auto' // it will upload any type of file. we can also give other uploading options.
      }
    )
    console.log('File has been uploaded on Cloudinary. ',response.url);
    return response
  } catch (error) {
    fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
    return null
  }
}


export {uploadOnCloudinary}