const $ = (r) => document.getElementById(r);

const player1name  = $("playerStatus__player1__name");
const player1score = $("playerStatus__player1__score");
const player2name  = $("playerStatus__player2__name");
const player2score = $("playerStatus__player2__score");

player1name.innerText = "No one has joined yet";
player2name.innerText = "No one has joined yet";
player1score.innerText = 0;
player2score.innerText = 0;

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
	console.log(roomState);
	player1name.innerText  = roomState.player1.name;
	player1score.innerText = roomState.player1.score;
	player2name.innerText  = roomState.player2.name;
	player2score.innerText = roomState.player2.score;
}

// setInterval(function () { ws.send("Hello, Server!"); }, 1000);