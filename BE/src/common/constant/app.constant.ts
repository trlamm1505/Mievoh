import 'dotenv/config';

export const PORT = process.env.PORT;
export const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
export const DATABASE_URL = process.env.DATABASE_URL;
export const FRONTEND_URL = process.env.FRONTEND_URL;
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
export const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL;
export const FOLDER_IMAGE = 'public/images';
export const DOMAIN_SERVER = process.env.DOMAIN_SERVER;
export const DATABASE_REDIS = process.env.DATABASE_REDIS;
export const RABBIT_MQ_URL = process.env.RABBIT_MQ_URL;
export const VNP_TMNCODE = process.env.VNP_TMNCODE;
export const VNP_HASHSECRET = process.env.VNP_HASHSECRET;
export const VNP_URL = process.env.VNP_URL;
export const VNP_RETURN_URL = process.env.VNP_RETURN_URL;

console.log(
  '\n',
  {
    PORT,
    ACCESS_TOKEN_SECRET,
    DATABASE_URL,
    FRONTEND_URL,
    VNP_TMNCODE,
    VNP_HASHSECRET,
    VNP_URL,
    VNP_RETURN_URL,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_CALLBACK_URL,
    DATABASE_REDIS,
    RABBIT_MQ_URL,
    DOMAIN_SERVER,
  },
  '\n',
);
