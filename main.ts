import { Application } from "https://deno.land/x/abc@v1.3.3/mod.ts";
import { Context } from "https://deno.land/x/abc@v1.3.3/mod.ts";
import { Room, User } from "models.ts";

const PORT: number = 3000;

const app = new Application();
app.static("/", "./public");

let rooms: Room[] = [{
	player1: "test_player1",
	player2: "test_player2",
	name: "test_room",
	password: null,
}];

import {
	createRoom,
	getRooms,
	getEmote,
	getHome,
	getRoom,
	socket,
} from "./controller.ts";

// WebSockets
import { acceptWebSocket } from "https://deno.land/x/abc@v1.3.3/vendor/https/deno.land/std/ws/mod.ts";
import { HandlerFunc } from "https://deno.land/x/abc@v1.3.3/types.ts";
const ws: HandlerFunc = async (c) => {
	const { gameId } = c.params;

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
	.get("/api/rooms", getRooms)
	.get("/room/:roomId", getRoom)
	.get("emotes/:emoteName", getEmote)
	// TODO: resolve passing `rooms` object into an imported function
	// <-->  not to clutter this file
	.get("/ws/:roomId", ws)
	.start({ port: PORT });

await Deno.stdout.write(new TextEncoder().encode(`App listening on http://localhost:${3000}/`));
