import { Application } from 'https://deno.land/x/abc@v1.3.3/mod.ts';
import { getEmote, getHome, joinRoom, createRoom, game } from './controller.ts';

import {
  acceptable,
  acceptWebSocket,
  isWebSocketCloseEvent,
  isWebSocketPingEvent,
  WebSocket,
} from "https://deno.land/std@0.116.0/ws/mod.ts";

const app = new Application();
app.static('/', './public');


app
  .get('/', getHome)
  .get('/home', getHome)
  .get('/room/:roomId', socket)
  .get('emotes/:emoteName', getEmote)
  .start({ port: 3000 });
console.log(`App listening on http://localhost:3001/`);
