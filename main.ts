import { Application } from 'https://deno.land/x/abc@v1.3.3/mod.ts';
import { getEmote, getHome, joinRoom, createRoom, game } from './controller.ts';
import { WebSocketClient, WebSocketServer } from "https://deno.land/x/websocket@v0.1.3/mod.ts";

const app = new Application();

app.static('/', './public');


const wss = new WebSocketServer(3001);
wss.on("connection", function (ws: WebSocketClient) {
    ws.on("message", function (message: string) {
        console.log(message);
        ws.send(message);
    });
});

app
  .get('/', getHome)
  .get('/home', getHome)
  // .get('/room/:roomId', socket)
  .get('emotes/:emoteName', getEmote)
  .start({ port: 3000 });
console.log(`App listening on http://localhost:3001/`);
