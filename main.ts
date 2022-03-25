import { Application } from "https://deno.land/x/abc@v1.3.3/mod.ts";
import { Context } from "https://deno.land/x/abc@v1.3.3/mod.ts";
import { Room, is_room } from "./lib.ts";


const PORT: number = 3000;

const app = new Application();
app.static("/", "./public");

let rooms: Room[] = [
	new Room("test_player1", "test_player2", "test_room1", null),
	new Room("test_player3", "test_player4", "test_room2", null),
];

import {
	// createRoom,
	getRooms,
	getEmote,
	getHome,
	getRoom,
	socket,
} from "./controller.ts";

app
	.get("/", getHome)
	.get("/home", getHome)
	.get("/api/rooms", getRooms)
	.get("/room/:roomId", getRoom)
	.get("emotes/:emoteName", getEmote)
	.get("/ws/:roomId", (c: Context) => socket(c, rooms))
	.start({ port: PORT });

// await Deno.stdout.write(new TextEncoder().encode(`App listening on http://localhost:${PORT}/\n`));
