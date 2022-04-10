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
		roomPassword,
	} = await c.body as {
		roomName: string,
		roomPassword: string | null,
	};

	// check again if the requirements are met
	if (roomName !== "" && !roomName.includes(" ") && !roomName.includes("%20")) {
		rooms.push(new Room(roomName, roomPassword));
		await println(`New room \`${roomName}\` created`);
 
		return JSON.stringify({
			status: 200,
			message: "Room created successfully",
			roomLocation: `/room/${roomName}`,
		});
	} else
		// the sender tried to do a little
		// trolling and that's fine
		return JSON.stringify({
			status: 400,
			message: "You cheeky ...",
		});
}

// socket handler
export const socket = async (
	c:     Context,
	rooms: Room[],
) => {
	// get the password user has given
	const { roomPassword } = await c.body as { roomPassword: string };

	// accept client's websocket connection
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

	// store references to important stuff
	const _uuid                    = v4.generate();
	let   _nickname: string | null = null;
	let   _room:       Room | null = null;
	let   userType:    Participant = Participant.Spectator;

	// receive incoming websocket messages
	for await (const e of ws) {
		// fails if the JSON can not be parsed
		// (then it does nothing)
		try {
			const data = JSON.parse(e.toString());
			switch (data.action) {
				// user is attempting to join a room
				case "join":
					let joined_as_player = false;
					let errors: string[] = [];

					// verify if room is existing
					let room = is_room(rooms, data.roomId);
					// [...] if so, check thee credentials given
					if (
						room &&
						(room.password === null || roomPassword === room.password) &&
						(!!data.nickname)
					) {
						_room = room;
						_nickname = data.nickname;

						await println(`User \`${_nickname}\` joined room \`${_room.name}\``);

						// assign a role to the user
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

						// inform other users that a new client
						// has joined the room 
						for (const [uuid, socket] of room.sockets.entries())
							if (!(_uuid === uuid))
								socket.send(JSON.stringify({
									action: "someoneJoined",
									type: userType,
									nickname: data.nickname,
								}));
					}

					// collect errors that might have happened
					if (!room)
						errors.push("Room of specified name  was not found.");
					if (!data.nickname)
						errors.push("No nickname supplied.");

					// send the response to user sending the `join` request
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

					// if user joined as the second player,
					// initiate starting game in the room
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
			
				// allows user to fetch information about
				// the room they are attempting to join 
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

				// here go all the answers coming from the clients
				case "questionAnswer":
					if (_room?.isGame)
						_room.recdAnswers.set(_uuid, data.answerIndex);
					break;

				// endpoint allows users to ready up to restart a game
				// after it has ended
				case "readyUp":
					if (!(_room && _room.player1 && _room.player2)) break;

					// if user is player1, set him as ready
					// and notify player2
					if (userType == Participant.Player1) {
						_room.player1.isReady = true;

						_room
							.sockets
							.get(_room.player2.uuid)!
							.send(JSON.stringify({
								action: "otherPlayerIsReady"
						}));
					}
					// if user is player2, set him as ready
					// and notify player1
					else if (userType == Participant.Player2) {
						_room.player2.isReady = true;
						_room
							.sockets
							.get(_room.player1.uuid)!
							.send(JSON.stringify({
								action: "otherPlayerIsReady"
						}));
					}

					// if both players are ready, restart the game
					if (_room.player1.isReady && _room.player2.isReady) {
						// clean up
						await println(`Room \`${_room.name}\` is restarting`);
						_room.player1.score   = 0;
						_room.player2.score   = 0;
						_room.player1.isReady = false;
						_room.player2.isReady = false;

						// notify of the restarting
						for (const socket of _room.sockets.values())
							socket.send(JSON.stringify({
								action: "gameIsRestarting",
								roomState: {
									player1: _room.player1,
									player2: _room.player2,
									name:    _room.name,
									spectators: _room.spectators
								},
							}));

						// start the game, again
						_room.isGame          = true;
						_room.handleGame();
					}
					
					break;
			}
		} catch { }
	}

	// this code is accessed whenever to socket loses connection
	if (_room && _nickname) {
		await println(`User \`${_nickname}\` has disconnected from \`${_room.name}\``);
		// stop the game
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
