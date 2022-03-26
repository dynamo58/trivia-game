import { Context } from 'https://deno.land/x/abc@v1.3.3/mod.ts';
import { v4 } from "https://deno.land/std/uuid/mod.ts"
import { Player, Participant, Room, is_room, println } from "./lib.ts";
import { acceptWebSocket } from "https://deno.land/x/abc@v1.3.3/vendor/https/deno.land/std/ws/mod.ts";

export const getEmote = async (c: Context) => {
	const { emoteName } = c.params;
	return c.file(`public/img/${emoteName}.webp`);
}

export const getHome = async (c: Context) => {
    return c.file("public/index.html");
}

export const getRooms = async (c: Context, rooms: Room[]) => {
	return JSON.stringify({
		status: 200,
		rooms: rooms.map(room => ({
			player1: room.player1,
			player2: room.player2,
			name: room.name,
		})),
	});
}

export const getRoom = async (c: Context) => {
    return c.file("public/room.html");
}

export const createRoom = async (c: Context, rooms: Room[]) => {
	const {
		roomName,
		roomPassword
	} = await c.body as {
		roomName: string,
		roomPassword: string | null
	};

	// check again if the requirements are met
	if (roomName && !roomName.includes(" ")) {
		rooms.push(new Room(roomName, roomPassword));
		await println(`New room \`${roomName}\` created`);

		return JSON.stringify({
			status: 200,
			message: "Room created successfully",
			roomLocation: `/room/${roomName}`,
		});
	} else {
		return JSON.stringify({
			status: 400,
			message: "Bad request",
		})
	}
}

export const socket = async (
	c:     Context,
	rooms: Room[],
) => {
	const { roomPassword } = await c.body as { roomPassword: string };

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
				if (room && room.password === roomPassword) {
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

				ws.send(JSON.stringify({
					action: "joinAnswer",
					success: !!room,
					role: userType,
					roomState: (room) ? {
						player1: room.player1,
						player2: room.player2,
						name:    room.name
					} : null
				}));
				break;
		}

		await ws.send("Hello, Client!");
	}
}
