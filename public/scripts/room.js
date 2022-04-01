// frontent objects (some may be implicitly imported from `modal.js`)
const player1name  = $("player1Name");
const player1score = $("player1Score");
const player2name  = $("player2Name");
const player2score = $("player2Score");

const spectators   = $("spectators");

const question     = $("questionQuestion");

const questions    = [
	$("questionField1"),
	$("questionField2"),
	$("questionField3"),
	$("questionField4")
];

const bar          = $("loader");
const currentEvent = $("currentEvent");

const ws = new WebSocket(uri());

let client = {
	userName: null,
	password: null,
	curr_chosen_index: null,
};

for (let i = 0; i < 4; i++)
	questions[i].addEventListener("click", () => {
		client.curr_chosen_index = i;
		questions[i].style.backgroundColor = "#ffbbec77";

		let other_idxs = [0,1,2,3].filter(idx => idx !== i);
		for (let idx of other_idxs)
			questions[idx].style.backgroundColor = null;
	});

// handle incoming socket messages
ws.onopen = (e) => {
	console.log("Established a WebSocket connection");
	getRoomInfo();
}

ws.onmessage = async (evt) => {
	try {
		const data = JSON.parse(evt.data);
		console.log(data);

		switch (data.action) {
			case "getRoomInfoAnswer":
				handleGetRoomInfoAnswer(data);
				break;

			case "joinAnswer":
				handleJoinAnwer(data);
				break;
				
			case "gameStarting":
				handleGameStarting();
				break;
			
			case "gameStarted":
				handleGameStarted();
				break;

			case "question":
				handleQuestion(data.question);
				break;

			case "answerEvaluation":
				await handleAnswerEvaluation(data);
				break;

			case "gameEnded":
				handleGameEnded(data);
				break;

			case "someoneJoined":
				handleSomeoneJoined(data)
				break;

			// ideally this wouldn't be used
			// attracts laziness and bloat creation
			case "RoomStateUpdated":
				refreshRoomData(data.roomState);
				break;
		}
	} catch {}
}

// scrape the roomId from URL
function roomId() {
	return window
		.location
		.toString()
		.split("/")[window.location.toString().split("/").length-1];
}

// get websocket uri
function uri() {
	const loc = window.location;

	let uri = "ws:";

	// the protocol should be https due to
	// passwords & stuff being sent
	if (loc.protocol === "https:") 
		uri = "wss:"; 

	uri += "//" + loc.host;
	uri += "/ws/" + roomId();

	return uri;
}

// 
function handle_connect_modal() {
	$("joinRoomBtn").addEventListener("click", async (e) => {
		e.preventDefault();

		const nickname = $("connectRoomNickname").value;
		const password = $("connectRoomPassword").value;
		const particip = $("joinRoomAs").options[$("joinRoomAs").selectedIndex].value;

		console.log({particip});


		if (nickname == "") {
			alert("You must choose a name");
			handle_connect_modal();
		}
		
		joinRoom(nickname, password, particip);
		hideModal();
	});
}

// --------
// frontend
// --------

function runTimedProgressBar(duration) {
	bar.style.width = "100%";
	bar.style.animation = "loader-animation";
	bar.style.animationIterationCount = "1";
	bar.style.fillMode = "forwards";
	bar.style.animationTimingFunction = "linear";
	bar.style.animationDuration = duration;
	bar.style.animationPlayState = 'running';
	setTimeout(() => {
		bar.style.width = "0";
		bar.style.animation = null;
	}, parseInt(duration.split("s")[0]) * 1000);
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

// ---------
// data handlers
// ---------

function refreshRoomData(roomState) {
	// console.log(roomState);
	if (roomState.player1) {
		player1name.innerText  = roomState.player1.nickname;
		player1score.innerText = roomState.player1.score;
	}

	if (roomState.player2) {
		player2name.innerText  = roomState.player2.nickname;
		player2score.innerText = roomState.player2.score;
	}
	
	document.getElementById("spectators").innerText =
		roomState.spectators.join(", ");
}

// ----------
// ws senders
// ----------

function getRoomInfo() {
	ws.send(JSON.stringify({
		action: "requestRoomInfo",
		roomId: roomId()
	}));
}

function joinRoom(nickname, password, participatorType) {
	ws.send(JSON.stringify({
		action: "join",
		nickname: nickname,
		password: password,
		participatorType: participatorType,
		roomId: roomId()
	}));
}

// -----------
// ws handlers
// -----------

function handleGetRoomInfoAnswer(data) {
	if (data.success) {
		showModal(CONNECT_TO_ROOM_MODAL_CONTENT);
		handle_connect_modal();

		if (!data.paswordRequired) {
			$("connectRoomPassword").setAttribute("disabled", "disabled");
		} else {
			$("connectRoomPassword").removeAttribute("disabled");
		}
	} else {
		alert(`Couldn't find room\n\n\n, ${data.errors.join("\n")}`);
	}
}

function handleJoinAnwer(data) {
	if (data.success) {
		refreshRoomData(data.roomState);
		hideModal();
	} else
		alert(`Couldn't join room\n\n\n, ${data.errors.join("\n")}`);
}

async function handleGameStarting() {
	currentEvent.innerText = "Game is starting shortly, get ready!";
	playSound("/sounds/game_starting.mp3");
	runTimedProgressBar("5s");
}

function handleGameStarted() {
	playSound("/sounds/game_started.mp3");
	currentEvent.innerText = "The game has started. Watch out for incoming questions!";
}

async function handleQuestion(q) {
	runTimedProgressBar("10s");
	currentEvent.innerText = "A question has landed, answer it (10 seconds)!";

	question.innerText = q.question;

	for (let i = 0; i < 4; i++)
		questions[i].innerText = q.all_answers[i];
}

async function handleAnswerEvaluation(data) {
	const modal = $("modal");
	currentEvent.innerText = "The question has been evaluated, take a breather (10 seconds).";
	runTimedProgressBar("5s");
	
	if (data.evaluation) {
		playSound("/sounds/answer_correct.wav");
		modal.style.backgroundColor = "#00FF0099";
		modal.style.display = "block";
		currentEvent = "Correct!";
	} else {
		playSound("/sounds/answer_incorrect.wav");
		currentEvent = `Wrong. Correct answer was \"${data.correctAnswer}\"`;
		modal.style.backgroundColor = "FF000099";
		modal.style.display = "block";
	}

	refreshRoomData(data.roomState);

	setTimeout(() => {
		modal.style.backgroundColor = null;
		modal.style.display = "none";
	}, 2000);
}

function handleGameEnded(data) {}

function handleSomeoneJoined(data) {
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
			spectators.innerText += ", " + data.nickname;
			break;
	}
}
