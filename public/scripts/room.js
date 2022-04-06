// some frontent objects (other ones may be implicitly imported from `modal.js`)
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

// some of the retained info clumped together
let client = {
	userName: null,
	password: null,
	curr_chosen_index: null,
};

// change colors approprietly when clicking on the answers
for (let i = 0; i < 4; i++)
	questions[i].addEventListener("click", () => {
		if (client.curr_chosen_index === i) {
			client.curr_chosen_index = null;
			questions[i].style.backgroundColor = null;
		} else {
			client.curr_chosen_index = i;
			questions[i].style.backgroundColor = "var(--accent)";
			sendAnswer();

			let other_idxs = [0,1,2,3].filter(idx => idx !== i);
			for (let idx of other_idxs)
				questions[idx].style.backgroundColor = null;
		}
	});

// handle when a socket connection has been made
ws.onopen = (_) => {
	console.log("Established a WebSocket connection");
	getRoomInfo();
}

// handle incoming socket messages
ws.onmessage = async (evt) => {
	try {
		const data = JSON.parse(evt.data);
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
				handleQuestion(data.question, data.questionNumber);
				break;
			
			case "answerNow":
				sendAnswer();
				break;

			case "answerEvaluation":
				await handleAnswerEvaluation(data);
				break;
			
			case "gameEnded":
				handleGameEnded(data);
				break;

			case "someoneDisconnected":
				handleSomeoneDisconnected(data);
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

// get websocket uri based on the current url
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

// handle the "connect to the room" modal
function handle_connect_modal() {
	$("joinRoomBtn").addEventListener("click", async (e) => {
		e.preventDefault();

		const nickname = $("connectRoomNickname").value;
		const password = $("connectRoomPassword").value;
		const particip = $("joinRoomAs").options[$("joinRoomAs").selectedIndex].value;

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

// run the countdown progress bar below game
function runTimedProgressBar(duration, color) {
	bar.style.width                   = "100%";
	bar.style.animation               = "loader-animation";
	bar.style.animationIterationCount = "1";
	bar.style.fillMode                = "forwards";
	bar.style.animationTimingFunction = "linear";
	bar.style.animationDuration       = duration;
	bar.style.animationPlayState      = 'running';
	bar.style.backgroundColor         = color || "var(--accent)";
	setTimeout(() => {
		bar.style.width = "0";
		bar.style.animation = null;
	}, parseInt(duration.split("s")[0]) * 1000);
}

// play a sound by specifying the server path
function playSound(path){
	let audio = document.createElement('audio');
	audio.style.display = "none";
	audio.src = path;
	audio.autoplay = true;
	audio.onended = function(){
	  	audio.remove()
	};
	document.body.appendChild(audio);
}

// ---------
// data handlers
// ---------

// fill the dynamic parts with new data / clean up
function refreshRoomData(roomState) {
	// if roomState includes any of players, update their fields 
	if (roomState.player1) {
		player1name.innerText  = roomState.player1.nickname;
		player1score.innerText = roomState.player1.score;
		$("player1image").classList.remove("grayscale");
	}

	if (roomState.player2) {
		player2name.innerText  = roomState.player2.nickname;
		player2score.innerText = roomState.player2.score;
		$("player2image").classList.remove("grayscale");
	}
	
	// update the spectator list
	spectators.innerText = roomState.spectators.join(", ");
	
	// de-highlight the selected element (if there is any)
	if (client.curr_chosen_index) {
		questions[client.curr_chosen_index].style.backgroundColor = null;
		client.curr_chosen_index = null;
	}
}

// ----------
// ws senders
// ----------

// get info about the Room that client is in
function getRoomInfo() {
	ws.send(JSON.stringify({
		action: "requestRoomInfo",
		roomId: roomId()
	}));
}

// request to join a room
function joinRoom(nickname, password, participatorType) {
	ws.send(JSON.stringify({
		action: "join",
		nickname: nickname,
		password: password,
		participatorType: participatorType,
		roomId: roomId()
	}));
}

// send the answer to a question
function sendAnswer() {
	ws.send(JSON.stringify({
		action: "questionAnswer",
		answerIndex: client.curr_chosen_index
	}));
}

// -----------
// ws handlers
// -----------

// handle response to `getRoomInfo()`
function handleGetRoomInfoAnswer(data) {
	if (data.success) {
		showModal(CONNECT_TO_ROOM_MODAL_CONTENT);
		handle_connect_modal();

		if (!data.paswordRequired) {
			$("connectRoomPassword").style.display = "none";
			for (let br of document.querySelectorAll(".passwordBR")) {
				br.remove();
			}
		}
		else {
			$("connectRoomPassword").style.display = "block";
		}
	} else
		alert(`Couldn't find room\n\n\n, ${data.errors.join("\n")}`);
}

// handle response after `joinRoom()`
function handleJoinAnwer(data) {
	if (data.success) {
		refreshRoomData(data.roomState);
		hideModal();
	} else
		alert(`Couldn't join room\n\n\n, ${data.errors.join("\n")}`);
}

// handle the starting of a room
async function handleGameStarting() {
	currentEvent.innerText = "Game is starting shortly, get ready!";
	playSound("/sounds/game_starting.mp3");
	runTimedProgressBar("5s", "#f70");
}

// handle when the room actually starts
function handleGameStarted() {
	playSound("/sounds/game_started.mp3");
	currentEvent.innerText = "The game has started. Watch out for incoming questions!";
}

// handle a question being sent
async function handleQuestion(q, qNum) {
	currentEvent.style.color = "#fff";
	runTimedProgressBar("10s", "#f00");
	currentEvent.innerText = "A question has landed, answer it (10 seconds)!";
	$("questionNumber").innerText = `${qNum}/20`;

	// those have to be `innerHtml` instead,
	// because it might include html entities
	question.innerHTML = q.question;

	for (let i = 0; i < 4; i++)
		questions[i].innerHTML = q.all_answers[i];
}

// handle the incoming report about question
async function handleAnswerEvaluation(data) {
	currentEvent.innerText = "The question has been evaluated, take a breather (10 seconds).";
	runTimedProgressBar("10s", "#0f0");

	for (let q of questions)
		q.style.backgroundColor = null;

	client.curr_chosen_index = null;

	if (data.evaluation) {
		playSound("/sounds/answer_correct.wav");
		$("answerModal").style.backgroundColor = "#00FF0077";
		currentEvent.innerText = "Correct!";
		currentEvent.style.color = "#0f0";
	} else {
		playSound("/sounds/answer_incorrect.wav");
		currentEvent.innerHTML = `Wrong. Correct answer was \"${data.correctAnswer}\"`;
		$("answerModal").style.backgroundColor = "#FF000077";
		currentEvent.style.color = "#f00";
	}
	$("answerModal").style.display = "block";
	
	refreshRoomData(data.roomState);

	setTimeout(() => {
		$("answerModal").style.backgroundColor = null;
		$("answerModal").style.display = "none";
	}, 3000);
}

// what to do when someone has disconnected
function handleSomeoneDisconnected(data) {
	switch (data.type) {
		case "spectator":
			spectators.innerText = data.spectators.join(", ");
			break;
		case "player1":
			alert(`Player ${data.nickname} has disconnected, the game was aborted`);
			$("player1image").classList.add("grayscale");
			break;
		case "player2":
			alert(`Player ${data.nickname} has disconnected, the game was aborted`);
			$("player2image").classList.add("grayscale");
	}
}

// what to do when someone has connected
function handleSomeoneJoined(data) {
	switch (data.type) {
		case "player1":
			player1name.innerText  = data.nickname;
			player1score.innerText = 0;
			$("player1image").classList.remove("grayscale");
			break;
		case "player2":
			player2name.innerText  = data.nickname;
			player2score.innerText = 0;
			$("player2image").classList.remove("grayscale");
			break;

		case "spectator":
			spectators.innerText += ", " + data.nickname;
			break;
	}
}

// show scoreboard and stuff
// when the game has ended
function handleGameEnded(data) {
	$("p1name").innerText = data.roomState.player1.nickname;
	$("p1score").innerText = data.roomState.player1.score;
	$("p2name").innerText = data.roomState.player2.nickname;
	$("p2score").innerText = data.roomState.player2.score;
	$("scoreboardWrapper").style.display = "flex";
}
