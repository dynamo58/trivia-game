import { Context } from 'https://deno.land/x/abc@v1.3.3/mod.ts';
import { v4 } from "https://deno.land/std/uuid/mod.ts"
import { Room, is_room } from "./lib.ts";

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
	Player1,
	Player2,
	Spectator,
}

export const socket = async (
	c:     Context,
	rooms: Room[],
) => {
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

	let user_type = Participant.Spectator;

	for await (const e of ws) {
		const data = JSON.parse(e.toString());

		switch (data.action) {
			case "join":
				let room = is_room(rooms, data.roomId);
				if (room) {
					// if (room.password)
					ws.send(JSON.stringify({
						action: "joinAnswer",
						success: true,
						roomState: {
							player1:      room.player1,
							player2:      room.player2,
							player1Score: room.player1Score,
							player2Score: room.player2Score,
							name:         room.name
						}
					}));
				}
				break;
		}

		await ws.send("Hello, Client!");
	}
}