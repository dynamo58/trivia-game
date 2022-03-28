import { Context } from 'https://deno.land/x/abc@v1.3.3/mod.ts';
import { v4 } from "https://deno.land/std@0.132.0/uuid/mod.ts";
import { Player, Participant, Room, is_room, println } from "./lib.ts";
import { acceptWebSocket } from "https://deno.land/x/abc@v1.3.3/vendor/https/deno.land/std/ws/mod.ts";
import { sleep } from "https://deno.land/x/sleep/mod.ts";

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

	const _uuid = v4.generate();
	let _logged: boolean = false;
	let _nickname: string | null = null;
	let _room: Room | null = null;
	let userType: Participant = Participant.Spectator;

	for await (const e of ws) {
		try {
			const data = JSON.parse(e.toString());
			console.log(data);

			switch (data.action) {
				case "join":
					let joined_as_player = false;
					let errors: string[] = [];

					let room = is_room(rooms, data.roomId);
					if (
						room &&
						(room.password === null || roomPassword === room.password) &&
						(!!data.nickname)
					) {
						_logged = true;
						_room = room;
						_nickname = data.nickname;

						if (room.player1 == null) {
							userType = Participant.Player1;
							room.player1 = new Player(data.nickname);
							joined_as_player = true;
						}
						else if (room.player2 == null) {
							userType = Participant.Player2;
							room.player2 = new Player(data.nickname);
							joined_as_player = true;
						}
						else
							userType = Participant.Spectator;
						
						room.sockets.set(_uuid, ws);

						for (const [_, socket] of room.sockets.entries()) {
							socket.send(JSON.stringify({
								action: "someoneJoined",
								type: userType,
								nickname: data.nickname,
							}));
						}
					}

					if (!room)
						errors.push("The room was not found");
					if (!data.nickname)
						errors.push("");

					ws.send(JSON.stringify({
						action: "joinAnswer",
						success: room && !!data.nickname,
						error: (!!data.nickname) ? null : "",
						role: userType,
						roomState: (room) ? {
							player1: room.player1,
							player2: room.player2,
							name:    room.name
						} : null,
					}));

					if (joined_as_player) {
						if (room) {
							if (room.player1 && room.player2) {
								await ongoingGameHandler(room);
							}
						}
					}
					break;
			
				case "requestRoomInfo":
					let room_ = is_room(rooms, data.roomId);
					ws.send(JSON.stringify({
						action: "getRoomInfoAnswer",
						paswordRequired: (room_) ? !!room_.password : null, 
						success: !!room_,
						roomState: (room_) ? {
							player1: room_.player1,
							player2: room_.player2,
							name:    room_.name,
							spectators: room_.spectators,
						} : null,
					}));
					break;
			}
		} catch {}
	}
	
	if (_room && _nickname) {
		_room.sockets.delete(_uuid);

		switch (userType) {
			case Participant.Player1:
				_room.player1 = null;
				break;
			case Participant.Player2:
				_room.player2 = null;
				break;
			case Participant.Spectator:
				const index = _room.spectators.indexOf(_nickname);
				if (index !== -1)
					_room.spectators.splice(index, 1);
				break;
		}
		// console.log("he disconnected");
		console.log(_room);
	}
}

async function ongoingGameHandler(room: Room) {
	for (const [_, socket] of room.sockets.entries()) {
		socket.send(JSON.stringify({
			action: "gameStarting",
		}));
	}

	await sleep(5);
}