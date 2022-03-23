import { Application } from 'https://deno.land/x/abc@v1.3.3/mod.ts';
import { HandlerFunc } from 'https://deno.land/x/abc@v1.0.3/types.ts';
import { acceptWebSocket } from 'https://deno.land/x/abc@v1.0.3/vendor/https/deno.land/std/ws/mod.ts';

import { getEmote, getHome, joinRoom, createRoom, game } from './controller.ts';

const app = new Application();

const hello: HandlerFunc = async (c) => {
  const { conn, headers, r: bufReader, w: bufWriter } = c.request;
  const ws = await acceptWebSocket({
    conn,
    headers,
    bufReader,
    bufWriter,
  });

  for await (const e of ws) {
    console.log(e);
    await ws.send("Hello, Client!");
  }
};

app.get("/ws", hello).file("/", "./index.html").start({ port: 8080 });

app.static('/', './public');
console.log(`App listening on http://localhost:8080/`);

app
  .get('/', getHome)
  .get('/home', getHome)
  .get('/room/:roomId')
  .get('emotes/:emoteName', getEmote)
  .start({ port: 8080 });