import { Context } from 'https://deno.land/x/abc@v1.3.3/mod.ts';
import { v4 } from "https://deno.land/std/uuid/mod.ts"
import { Player, Room, is_room } from "./lib.ts";

export const getEmote = async (c: Context) => {
	const { emoteName } = c.params;
	return c.file(`public/img/${emoteName}.webp`);
}

export const getHome = async (c: Context) => {
    return c.file("public/index.html");
}

export const getRooms = async (c: Context) => {
	return JSON.stringify({
		
	});
}

export const getRoom = async (c: Context) => {
    return c.file("public/room.html");
}

export const joinRoom = async (c: Context) => {
	
}

export const createRoom = async (c: Context) => {
	
}

export const game = async (c: Context) => {
	
}

import { acceptWebSocket } from "https://deno.land/x/abc@v1.3.3/vendor/https/deno.land/std/ws/mod.ts";

// all the variants as which one can
// join a room
enum Participant {
	Player1 = "player1",
	Player2 = "player2",
	Spectator = "spectator",
}

export const socket = async (
	c:     Context,
	rooms: Room[],
) => {
	const a = c.response.body;
	console.log({a});
	const body = (await c.body);
	console.log({body});

	// const body = await c.body;
    // if (!Object.keys(body).length) {
    //   return c.string("Request can't be empty", 400);
    // }
    // const { password } = body;

	const {
		conn,
		headers,
		r: bufReader,
		w: bufWriter
	} = c.request;
  	const ws = await acceptWebSocket({
		conn,
		headers,
		bufReader,
		bufWriter,
	});

	let userType: Participant = Participant.Spectator;

	for await (const e of ws) {
		const data = JSON.parse(e.toString());

		switch (data.action) {
			case "join":
				let room = is_room(rooms, data.roomId);
				if (room) {
					if (room.player1 == null) {
						userType = Participant.Player1;
						if (data.nickname && typeof data.nikname)
							room.player1 = new Player(data.nickname);
					}
					else if (room.player2 == null) {
						userType = Participant.Player2;
						if (data.nickname && typeof data.nikname)
							room.player2 = new Player(data.nickname);
					}
					else
						userType = Participant.Spectator;
				}
					// if (room.password)
				ws.send(JSON.stringify({
					action: "joinAnswer",
					success: !!room,
					role: userType,
					roomState: (room) ? {
						player1:      room.player1,
						player2:      room.player2,
						name:         room.name
					} : null
				}));
				break;
		}

		await ws.send("Hello, Client!");
	}
}