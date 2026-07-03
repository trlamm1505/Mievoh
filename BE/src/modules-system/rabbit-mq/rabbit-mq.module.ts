// module cấu hình rabbitmq cho microservice
import { Global, Inject, Module, OnModuleInit } from '@nestjs/common';
import { ClientProxy, ClientsModule, Transport } from '@nestjs/microservices';
import { RABBIT_MQ_URL } from '../../common/constant/app.constant';

// global để module này dùng được ở mọi nơi
@Global()
@Module({
  imports: [
    // đăng ký client rabbitmq
    ClientsModule.register([
      {
        name: 'RECOMMENDATION_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [RABBIT_MQ_URL!],
          queue: 'trigger_queue',
          queueOptions: {
            durable: false,
          },
          socketOptions: {
            connectionOptions: {
              clientProperties: {
                connection_name: 'recommendation-send',
              },
            },
          },
        },
      },
      {
        name: 'EMAIL_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [RABBIT_MQ_URL!],
          queue: 'email_queue',
          queueOptions: {
            durable: false,
          },
          socketOptions: {
            connectionOptions: {
              clientProperties: {
                connection_name: 'email-send',
              },
            },
          },
        },
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class RabbitMQModule implements OnModuleInit {
  // inject client rabbitmq
  constructor(
    @Inject('RECOMMENDATION_SERVICE') private recommendationClient: ClientProxy,
    @Inject('EMAIL_SERVICE') private emailClient: ClientProxy,
  ) {}

  // kết nối rabbitmq khi khởi tạo module
  async onModuleInit() {
    try {
      await this.recommendationClient.connect();
      await this.emailClient.connect();
      console.log('[RABBITMQ] Connected to RabbitMQ');
    } catch (error) {
      console.error('[RABBITMQ] Failed to connect to RabbitMQ:', error);
    }
  }
}
