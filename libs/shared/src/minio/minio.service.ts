import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import * as Minio from "minio";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name);
  private readonly minioClient: Minio.Client;
  private isConnected = false;
  constructor(private readonly configService: ConfigService) {
    this.minioClient = new Minio.Client({
      endPoint: this.configService.get<string>("MINIO_ENDPOINT")!,
      port: Number(this.configService.get<number>("MINIO_PORT")),
      useSSL: !!Number(this.configService.get<boolean>("MINIO_USE_SSL")),
      accessKey: this.configService.get<string>("MINIO_ACCESS_KEY"),
      secretKey: this.configService.get<string>("MINIO_SECRET_KEY"),
    });
  }

  // 生命周期钩子函数，模块初始化后执行
  async onModuleInit() {
    try {
      // 读取bucket桶的别名
      const bucket = this.configService.get<string>("MINIO_BUCKET")!;
      // 判断桶是否存在
      const exists = await this.minioClient.bucketExists(bucket);
      // 如果桶不存在，则创建桶
      if (!exists) {
        await this.minioClient.makeBucket(bucket);
        await this.minioClient.setBucketPolicy(
          bucket,
          JSON.stringify({
            Version: "2012-10-17", // 策略语言版本
            Statement: [
              {
                Sid: "PublicReadObjects", // 给这个规则起个名字
                Action: ["s3:GetObject"], // 允许浏览器获取对象
                Resource: ["arn:aws:s3:::avatar/*"], // 允许读取 avatar桶内的所有资源
                Effect: "Allow", // 允许打开这个规则 Allow 允许 Deny 拒绝
                Principal: "*", // 所有人
              },
            ],
          }),
        );
      }
      this.isConnected = true;
      this.logger.log('MinIO 连接成功');
    } catch (error) {
      this.isConnected = false;
      this.logger.warn(`MinIO 连接失败，文件上传功能将不可用: ${error.message}`);
    }
  }

  getMinioClient() {
    return this.minioClient;
  }

  getBucket() {
    return this.configService.get<string>("MINIO_BUCKET")!;
  }
}
