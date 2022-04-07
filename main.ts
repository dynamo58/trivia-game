import { Application } from "https://deno.land/x/abc@v1.3.3/mod.ts";
import { Context } from "https://deno.land/x/abc@v1.3.3/mod.ts";
import { Room, println } from "./lib.ts";
import { parse } from "https://deno.land/std/flags/mod.ts";

const PORT: number = parse(Deno.args).port || parse(Deno.args)["p"] || 8000;

const app = new Application();
app.static("/", "./public");

let rooms: Room[] = [
	new Room("test_room1", null),
	new Room("test_room2", null),
];

import {
	createRoom,
	getRooms,
	getHome,
	getRoom,
	socket,
} from "./controller.ts";

app
	// frontend
	.get("/", getHome)
	.get("/home", getHome)
	.get("/room/:roomId", getRoom)
	// api (called from frontend JS)
	.get("/api/rooms",       (c: Context) => getRooms(c, rooms))
	.post("/api/createRoom", (c: Context) => createRoom(c, rooms))
	// ws
	.get("/ws/:roomId", (c: Context) => socket(c, rooms))
	.start({ port: PORT });

await println(`App listening on http://localhost:${PORT}/\n`);
