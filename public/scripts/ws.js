const $ = (r) => document.getElementById(r);

const player1name  = $("playerStatus__player1__name");
const player1score = $("playerStatus__player1__score");
const player1name = $("playerStatus__player2__name");
const player2score  = $("playerStatus__player2__score");

player1name.innerText = "No one has joined yet";
player1score.innerText = 0;
player2name.innerText = "No one has joined yet";
player2score.innerText = 0;

const loc = window.location;
const room_id = loc.toString().split("/")[loc.toString().split("/").length-1];
let uri = "ws:";
if (loc.protocol === "https:") {
	uri = "wss:"; 
}

uri += "//" + loc.host;
uri += "/ws/" + room_id;
console.log(uri);
const ws = new WebSocket(uri);
ws.onopen = function () {
	console.log("Connected");
}

ws.onmessage = function (evt) {
	let out = document.getElementById("output");
	out.innerHTML += evt.data + "<br>";
}

setInterval(function () { ws.send("Hello, Server!"); }, 1000);