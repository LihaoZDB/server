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
    if (userId) {
      client.join(`user_${userId}`); // 加入用户房间
    }
  }

  // 向客户端发送支付成功后通知前端关闭弹窗的事件
  emitPaymentSuccess(UserId: string) {
    this.server.to(`user_${UserId}`).emit("paymentSuccess", UserId);
  }
}
