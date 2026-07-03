import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { PORT, RABBIT_MQ_URL } from './common/constant/app.constant';
import { ValidationPipe } from '@nestjs/common';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ResponseSuccessInterceptor } from './common/interceptors/responese-success.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // serve thư mục public/images để có thể truy cập ảnh qua link
  app.useStaticAssets(join(process.cwd(), 'public/images'));
  // đặt api global prefix cho toàn bộ route trong ứng dụng
  app.enableCors({
    origin: true,
    credentials: false,
  });
  // đặt api global prefix cho toàn bộ route trong ứng dụng
  app.setGlobalPrefix('api');
  // bật global pipe để tự động validate dữ liệu đầu vào cho toàn bộ ứng dụng
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  // đăng ký global interceptor để log thông tin request toàn bộ ứng dụng
  app.useGlobalInterceptors(new LoggingInterceptor());
  // đăng ký global interceptor để chuẩn hóa response success toàn bộ ứng dụng
  app.useGlobalInterceptors(new ResponseSuccessInterceptor());
  // Cấu hình Swagger
  const config = new DocumentBuilder()
    .setTitle('Mievoh Booking API')
    .setDescription('Tài liệu API cho hệ thống đặt vé xem phim')
    .setVersion('1.0')
    .addServer('https://api.mievoh.io.vn', 'Production Server')
    .addServer('http://localhost:3069', 'Local Environment')
    .addTag('Authentication', 'Xác thực và đăng ký')
    .addTag('Users', 'Quản lý người dùng (Profile & Admin)')
    .addTag('Cinema Systems', 'Quản lý hệ thống rạp')
    .addTag('Cinema Complexes', 'Quản lý cụm rạp')
    .addTag('Cinemas', 'Quản lý rạp')
    .addTag('Seats', 'Quản lý ghế ngồi')
    .addTag('Movies', 'Quản lý phim')
    .addTag('Showtimes', 'Quản lý lịch chiếu')
    .addTag('Foods', 'Quản lý đồ ăn')
    .addTag('Vouchers', 'Quản lý mã giảm giá')
    .addTag('Bookings', 'Quản lý đặt vé')
    .addTag('Reviews', 'Quản lý đánh giá phim')
    .addTag('Banners', 'Quản lý banner')
    .addTag('Notifications', 'Quản lý thông báo')
    .addTag(
      'Recommendations',
      'Quản lý hệ thống Recommend System & Email Maketing',
    )
    .addTag('Statistics', 'Thống kê và Báo cáo')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = PORT || 3069;

  // Cấu hình lắng nghe RabbitMQ song song với HTTP (Hybrid Application)
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [RABBIT_MQ_URL!],
      queue: 'main_queue', // Lắng nghe chung hàng đợi của mình hoặc queue riêng để nhận progress
      queueOptions: {
        durable: false,
      },
      socketOptions: {
        connectionOptions: {
          clientProperties: {
            connection_name: 'main-listener',
          },
        },
      },
    },
  });

  await app.startAllMicroservices();
  await app.listen(port, () => {
    console.log(`[SERVER] Server online at: ${port}`);
    console.log(`[SERVER] Swagger API docs: http://localhost:${port}/api-docs`);
  });
}
bootstrap();
