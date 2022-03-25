import { Application } from "https://deno.land/x/abc@v1.3.3/mod.ts";
import { Context } from "https://deno.land/x/abc@v1.3.3/mod.ts";
import {
  createRoom,
  getEmote,
  getHome,
  joinRoom,
  getRoom,
  socket,
} from "./controller.ts";

import { HandlerFunc } from "https://deno.land/x/abc@v1.3.3/types.ts";
import { acceptWebSocket } from "https://deno.land/x/abc@v1.3.3/vendor/https/deno.land/std/ws/mod.ts";

const app = new Application();
app.static("/", "./public");

const hello: HandlerFunc = async (c) => {
  const { conn, headers, r: bufReader, w: bufWriter } = c.request;
  const ws = await acceptWebSocket({ conn, headers, bufReader, bufWriter });
  for await (const e of ws) {
    console.log(e);
    await ws.send("Hello, Client!");
  }
};

app
  .get("/", getHome)
  .get("/home", getHome)
  .get("/room/:roomId", getRoom)
  .get("emotes/:emoteName", getEmote)
  .get("/ws/:roomId", hello)
  .start({ port: 3000 });
console.log(`App listening on http://localhost:3000/`);
