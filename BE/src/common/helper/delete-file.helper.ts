import { unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { FOLDER_IMAGE } from '../constant/app.constant';
import { DOMAIN_SERVER } from '../constant/app.constant';

export function deleteFile(filePath: string) {
  // loại bỏ DOMAIN_SERVER khỏi filePath
  const relativePath = filePath.replace(`${DOMAIN_SERVER}/`, '');
  const fileDeletePath = join(process.cwd(), FOLDER_IMAGE, relativePath);
  if (existsSync(fileDeletePath)) {
    unlinkSync(fileDeletePath);
  } else {
    console.warn(`File ${fileDeletePath} không tồn tại, không thể xóa.`);
  }
}
