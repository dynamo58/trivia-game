const player1name  = $("player1Name");
const player1score = $("player1Score");
const player2name  = $("player2Name");
const player2score = $("player2Score");

const spectators = $("spectators");


const bar = $("loader");
const currentEvent = $("currentEvent");

function roomId() {
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
	uri += "/ws/" + roomId();

	return uri;
}

const ws = new WebSocket(uri());

let client = {
	userName: null,
	password: null
};

ws.onopen = (e) => {
	console.log("Established a WebSocket connection");
	
	showModal(CONNECT_TO_ROOM_MODAL_CONTENT);

	$("connectToRoomForm").addEventListener("submit", async (e) => {
		e.preventDefault();

		const nickname = $("connectRoomNickname").value;
		const password = $("connectRoomPassword").value;

		if (roomName == "") {
			alert("Room must have a name.");
			return;
		} else if (roomName.includes(" ")) {
			alert("Room name shall not contain any spaces.");
			return;
		}
	});

	let nick = prompt("Connected! Please enter your desired nick", "");
	
	clientData.userName = nick;
	joinRoom(nick);
}

ws.onmessage = async (evt) => {
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
				currentEvent.innerText = "Game is starting shortly, get ready!";
			
				playSound("/sounds/game_starting.mp3");
				
				runTimedProgressBar("10s", async function () {
					playSound("/sounds/game_started.mp3");
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

function getRoomInfo() {
	let id = roomId()
	ws.send(JSON.stringify({
		action: "requestRoomInfo",
		roomId: roomId()
	}));
}

function joinRoom(s) {
	ws.send(JSON.stringify({
		action: "join",
		nickname: s,
		roomId: roomId()
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

function playSound(url){
	let audio = document.createElement('audio');
	audio.style.display = "none";
	audio.src = url;
	audio.autoplay = true;
	audio.onended = function(){
	  	audio.remove() //Remove when played.
	};
	document.body.appendChild(audio);
}

// setInterval(function () { ws.send("Hello, Server!"); }, 1000);