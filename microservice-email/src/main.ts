import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { RABBIT_MQ_URL } from './common/constant/app.constant';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [RABBIT_MQ_URL],
        queue: 'email_queue',
        noAck: false, // Tắt tự động xác nhận tin nhắn (để code tự ack/nack)
        queueOptions: {
          durable: false,
        },
        socketOptions: {
          connectionOptions: {
            clientProperties: {
              connection_name: 'email-on',
            },
          },
        },
      },
    },
  );

  await app.listen();
  console.log(
    '[EMAIL MICROSERVICE] Đang lắng nghe RabbitMQ trên hàng đợi (email_queue)...',
  );
}
bootstrap();
