import { Context } from 'https://deno.land/x/abc@v1.3.3/mod.ts';
import { v4 } from "https://deno.land/std@0.132.0/uuid/mod.ts";
import { Player, Participant, Room, is_room, println } from "./lib.ts";
import { acceptWebSocket } from "https://deno.land/x/abc@v1.3.3/vendor/https/deno.land/std/ws/mod.ts";

// serve home/root page
export const getHome = async (c: Context) => {
    return c.file("public/index.html");
}

// return all of the open rooms
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

// serve the room page
export const getRoom = async (c: Context) => {
    return c.file("public/room.html");
}

// create a new room (called from frontend JS)
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

import { HandlerFunc } from "https://deno.land/x/abc@v1.3.3/types.ts";

// socket handler
export const socket = async (
	c:     Context,
	rooms: Room[],
) => {
	const test: HandlerFunc = async (c) => {
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

	const _uuid                    = v4.generate();
	let   _nickname: string | null = null;
	let   _room:       Room | null = null;
	let   userType:    Participant = Participant.Spectator;

	for await (const e of ws) {
		try {
			const data = JSON.parse(e.toString());
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
						_room = room;
						_nickname = data.nickname;

						console.log(`User ${_nickname} joined room ${_room.name}`);

						if (room.player1 == null &&
							data.participatorType === "player"
						) {
							userType = Participant.Player1;
							room.player1 = new Player(data.nickname, _uuid);
							joined_as_player = true;
						}
						else if (
							room.player2 == null &&
							data.participatorType === "player"
						) {
							userType = Participant.Player2;
							room.player2 = new Player(data.nickname, _uuid);
							joined_as_player = true;
						}
						else {
							userType = Participant.Spectator;
							room.spectators.push(data.nickname);
						}
						
						room.sockets.set(_uuid, ws);

						for (const [uuid, socket] of room.sockets.entries())
							if (!(_uuid === uuid))
								socket.send(JSON.stringify({
									action: "someoneJoined",
									type: userType,
									nickname: data.nickname,
								}));
					}

					if (!room)
						errors.push("Room of specified name  was not found.");
					if (!data.nickname)
						errors.push("No nickname supplied.");

					ws.send(JSON.stringify({
						action: "joinAnswer",
						success: room && !!data.nickname,
						error: (!!data.nickname) ? null : "",
						role: userType,
						roomState: (room) ? {
							player1: room.player1,
							player2: room.player2,
							name:    room.name,
							spectators: room.spectators
						} : null,
					}));

					if (
						joined_as_player &&
						room &&
						!room.isGame &&
						room.player1 &&
						room.player2
					) {
						room.isGame = true;
						room.handleGame();
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

				case "questionAnswer":
					console.log(`${userType} => ${data.answerIndex}`)
					if (_room?.isGame) {
						_room.recdAnswers.set(_uuid, data.answerIndex);
					}
					break;
			}
		} catch {
			console.log("bruh", e);
		}
	}

	// this code is accessed whenever to socket loses connection
	if (_room && _nickname) {
		console.log(`User ${_nickname} has disconnected from ${_room.name}`);
		// stop game
		if (
			_room.player1?.uuid === _uuid ||
			_room.player2?.uuid === _uuid
		)
			_room.isGame = false;

		// release the socket
		_room.sockets.delete(_uuid);

		// clean up the Room object
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

		// if the user was a player, instantly stop the game
		// notify all of the users in the room
		for (const [_, socket] of _room.sockets.entries())
			socket.send(JSON.stringify({
				action: "someoneDisconnected",
				nickname: _nickname,
				type: userType,
				roomState: {
					player1: _room.player1,
					player2: _room.player2,
					name:    _room.name,
					spectators: _room.spectators
				},
			}));
	}
	}
	await test(c);
}
