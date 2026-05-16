import { createUploadthing } from 'uploadthing/next';
import jwt from 'jsonwebtoken';

const f = createUploadthing();

async function getUser(req) {
  const auth = req.headers.get('x-ut-token') || req.headers.get('authorization');
  
  if (!auth) {
    console.error("Auth header missing");
    return null;
  }

  try {
    const token = auth.startsWith('Bearer ') ? auth.split(' ')[1] : auth;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (err) {
    console.error("JWT Verification Error:", err.message);
    return null;
  }
}

export const ourFileRouter = {
  propertyImages: f({ image: { maxFileSize: '8MB', maxFileCount: 10 } })
    .middleware(async ({ req }) => {
      try {
        const auth = req.headers.get('x-ut-token') || req.headers.get('authorization');
        if (!auth) throw new Error("No token provided");

        const token = auth.startsWith('Bearer ') ? auth.split(' ')[1] : auth;
        const secret = process.env.JWT_SECRET || 'secret_jwt_key'; 
        const decoded = jwt.verify(token, secret);

        return { userId: decoded.id };
      } catch (err) {
        console.error("SERVER-SIDE ERROR:", err.message);
        throw new Error("Unauthorized"); 
      }
    })
    
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      return { url: file.url };
    }),
};