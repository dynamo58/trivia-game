const player1name  = $("player1Name");
const player1score = $("player1Score");
const player2name  = $("player2Name");
const player2score = $("player2Score");

const spectators = $("spectators");


const bar = $("loader");
const currentEvent = $("currentEvent");

function room_id() {
	return window
		.location
		.toString()
		.split("/")[window.location.toString().split("/").length-1];
}

function uri() {
	const loc = window.location;

	let uri = "ws:";
	if (loc.protocol === "https:") 
		uri = "wss:"; 

	uri += "//" + loc.host;
	uri += "/ws/" + room_id();

	return uri;
}

const ws = new WebSocket(uri());

let clientData = {
	userName: null
};

ws.onopen = () => {
	console.log("Established a WebSocket connection");
	
	let nick = prompt("Connected! Please enter your desired nick", "");
	
	clientData.userName = nick;
	joinRoom(nick);
}

ws.onmessage = (evt) => {
	try {
		const data = JSON.parse(evt.data);
		console.log(data);
		switch (data.action) {
			case "joinAnswer":
				if (data.success) {
					refreshRoomData(data.roomState);
				} else
					console.log(`Failed to join room, ${data.message}`);
				break;
				
			case "gameStarting":
				const announce_sound = new Audio("/sounds/game_starting.mp3");
				const start_sound    = new Audio("/sounds/game_started.mp3");

				currentEvent.innerText = "Game is shortly starting, get ready!";
			
				announce_sound.play();
				
				runTimedProgressBar("10s", function () {
					start_sound.play();
				});
				break;
			
			case "gameStarted":

				break;
			
			case "gameEnded":

				break;

			case "someoneJoined":
				switch (data.type) {
					case "player1":
						player1name.innerText  = data.nickname;
						player1score.innerText = 0;
						break;
					case "player2":
						player1name.innerText  = data.nickname;
						player1score.innerText = 0;
						break;

					case "spectator":
						spectators.innerText += data.nickname
						break
				}
				break;

			// ideally this wouldn't be used
			// attracts laziness and bloat creation
			case "RoomStateUpdated":
				refreshRoomData(data.roomState);
				break;
		}
	} catch {}
	
}

function joinRoom(s) {
	ws.send(JSON.stringify({
		action: "join",
		nickname: s,
		roomId: room_id()
	}));
}

function refreshRoomData(roomState) {
	player1name.innerText  = roomState.player1.nickname;
	player1score.innerText = roomState.player1.score;
	player2name.innerText  = roomState.player2.nickname;
	player2score.innerText = roomState.player2.score;
}

function runTimedProgressBar(duration, cb) {
	bar.addEventListener('animationend', cb);
	bar.style.animationDuration = duration;
	bar.style.animationPlayState = 'running';
}

// setInterval(function () { ws.send("Hello, Server!"); }, 1000);