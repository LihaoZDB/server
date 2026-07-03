import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";

@WebSocketGateway({
  cors: {
    origin: "*",
  },
})
export class SocketGateway {
  @WebSocketServer()
  server: Server;

  // 连接成功之后会自动进入这个钩子函数传入当前连接的client
  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    console.log("[Socket] 新连接, userId:", userId, "socketId:", client.id);
    if (userId) {
      client.join(`user_${userId}`); // 加入用户房间
      console.log("[Socket] 已加入房间 user_" + userId);
    } else {
      console.warn("[Socket] 连接无userId, 未加入房间");
    }
  }

  // 向客户端发送支付成功后通知前端关闭弹窗的事件
  emitPaymentSuccess(UserId: string) {
    console.log("[Socket] emitPaymentSuccess userId:", UserId);
    console.log("[Socket] server存在:", !!this.server);
    if (this.server) {
      const room = `user_${UserId}`;
      // 查看房间内的socket数量
      const sockets = this.server.sockets.adapter.rooms.get(room);
      console.log("[Socket] 房间 " + room + " 内socket数:", sockets?.size ?? 0);
      this.server.to(room).emit("paymentSuccess", UserId);
      console.log("[Socket] emit完成");
    }
  }
}
