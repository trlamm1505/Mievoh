
import { SetMetadata } from '@nestjs/common';

// decorator: gắn thêm dữ liệu metadata (dữ liệu đi kèm nho nhỏ, hoặc là 1 cái cờ)
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
