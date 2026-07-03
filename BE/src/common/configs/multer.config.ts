import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { FOLDER_IMAGE } from '../constant/app.constant';
import { existsSync, mkdirSync } from 'fs';
import { BadRequestException } from '@nestjs/common';

// Factory function để tạo multer config với subfolder khác nhau
export const createMulterConfig = (subfolder: string) => ({
  storage: diskStorage({
    destination: (req: any, file, cb) => {
      const uploadPath = join(process.cwd(), FOLDER_IMAGE, subfolder);
      // tự động tạo thư mục nếu chưa có
      if (!existsSync(uploadPath)) {
        mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      // Tạo tên file unique: timestamp-originalname
      const timestamp = Date.now();
      const ext = extname(file.originalname);
      const nameWithoutExt = file.originalname.replace(ext, '');
      const uniqueFilename = `${timestamp}-${nameWithoutExt}${ext}`;
      cb(null, uniqueFilename);
    },
  }),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB - Validate TRƯỚC KHI lưu file
  },
  fileFilter: (req, file, cb) => {
    // chặn file không đúng format ngay từ cấu hình Multer
    if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
      return cb(new BadRequestException('Chỉ chấp nhận file ảnh!'), false);
    }
    cb(null, true);
  },
});

// Config cho từng loại upload
export const multerMoviesConfig = createMulterConfig('movies');
export const multerBannersConfig = createMulterConfig('banners');
export const multerHeThongRapConfig = createMulterConfig('cinema-system');
export const multerFoodsConfig = createMulterConfig('foods');
export const multerUsersConfig = createMulterConfig('users');
