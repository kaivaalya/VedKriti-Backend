const cloudinary =require("cloudinary").v2;
const multer = require("multer");
const { promises } = require("nodemailer/lib/xoauth2");
const streamifier = require("streamifier");



cloudinary.config({
cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})


const storage = multer.memoryStorage();


const uploadMiddleware = (fieldName="file",maxSizeMB=10)=> multer({
    storage,
    limits:{fileSize:maxSizeMB*1024*1024},
    fileFilter:(req,file,cb)=>{
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        if(allowed.includes(file.mimetype)){
            cb(null,true)
        }
        else{
            cb(new Error("unsupported file type . Allowed: JPEG, PNG, WEBP, PDF"),false)
        }
    }
}).single(fieldName);


const uploadToCloudinary=(buffer,folder="reports",resorceTYpe="auto")=>
    new promise((resolve,reject)=>{
       const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);

})


const deleteFromCloudinary = (publicId, resourceType = 'image') =>
  cloudinary.uploader.destroy(publicId, { resource_type: resourceType });

module.exports = { uploadMiddleware, uploadToCloudinary, deleteFromCloudinary };