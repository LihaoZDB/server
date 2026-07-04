import { IoAdapter } from "@nestjs/platform-socket.io";
import type { INestApplicationContext } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";
import type { ServerOptions } from "socket.io";

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter> | null = null;

  constructor(
    app: INestApplicationContext,
    private readonly configService: ConfigService,
  ) {
    super(app);
  }

  async connectToRedis() {
    const enabled = this.configService.get<string>("SOCKET_REDIS_ENABLED");
    if (enabled !== "true") {
      console.log("[Socket] Redis adapter disabled");
      return;
    }

    const host = this.configService.get<string>("REDIS_HOST") ?? "localhost";
    const port = Number(this.configService.get<string>("REDIS_PORT") ?? 6379);
    const password = this.configService.get<string>("REDIS_PASSWORD");
    const redisOptions = {
      host,
      port,
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      ...(password ? { password } : {}),
    };
    const pubClient = new Redis(redisOptions);
    const subClient = pubClient.duplicate();

    pubClient.on("error", (error) => {
      console.error("[Socket] Redis pub client error", error);
    });
    subClient.on("error", (error) => {
      console.error("[Socket] Redis sub client error", error);
    });

    try {
      await Promise.all([pubClient.connect(), subClient.connect()]);
      this.adapterConstructor = createAdapter(pubClient, subClient);
      console.log(`[Socket] Redis adapter enabled: ${host}:${port}`);
    } catch (error) {
      pubClient.disconnect();
      subClient.disconnect();
      console.warn(
        `[Socket] Redis adapter unavailable, fallback to single-process socket rooms: ${host}:${port}`,
        error,
      );
    }
  }

  createIOServer(port: number, options?: ServerOptions) {
    const server = super.createIOServer(port, options);
    if (this.adapterConstructor) {
      server.adapter(this.adapterConstructor);
    }
    return server;
  }
}
