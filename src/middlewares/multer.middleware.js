// 'multer' will upload the file into the server. Then, 'cloudinary' will upload it to 3rd party Cloudinary cloud storage from the server.

import multer from "multer"; // Install

const storage = multer.diskStorage({
  // storing the file in disk space
  destination: function (req, file, cb) {
    // Normally, functions don't have access to 'file', but 'multer' has. 'req' will have the json data and 'file' will have the uploaded file
    // 'cb' means callback
    cb(null, "./public/temp"); // path where files will be stored
  },
  filename: function (req, file, cb) { // changing file name
    cb(null, file.originalname); // for now, we are keeping the file with same name, but we can change it too. See multer documentation.
  },
});

export const upload = multer({ storage });
