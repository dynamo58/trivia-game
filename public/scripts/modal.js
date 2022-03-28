const modal        = $("modal");
const modalContent = $("modalContent");

const CREATE_ROOM_MODAL_CONTENT = `
	<p>Create your brand new room!</p>
	<form autocomplete="off" id="createRoomForm">
		<input
			type="text"
			autocomplete="false"
			name="roomName"
			id="createRoomName"
			placeholder="Room name"
		>
		<br><br>
		<input
			type="password"
			autocomplete="false"
			name="roomPassword"
			id="createRoomPassword"
			placeholder="Room password (optional)"
		>
		<br><br><br>
		<input
			type="submit"
			value="Create room"
			class="btn"
			id="createRoomSubmitBtn"
		>
	</form>
`;

const BROWSE_ROOMS_MODAL_CONTENT = `
	<div id="rooms" class="rooms"></div>
`;

const CONNECT_TO_ROOM_MODAL_CONTENT = `
	<input
		type="text"
		autocomplete="false"
		name="connectRoomNickname"
		id="connectRoomNickname"
		placeholder="Desired nick"
	>
	<br><br>
	<input
		type="password"
		autocomplete="false"
		name="connectRoomPassword"
		id="connectRoomPassword"
		placeholder="Room password"
	><br><br>
	<select name="joinRoomAs" id="joinRoomAs">
		<option value="player">Player</option>
		<option value="spectator">Spectator</option>
  	</select><br>
	<br><br><br>
	<button
		value="Join room"
		class="btn"
		id="joinRoomBtn"
	>Submit</button>
`;

async function refresh_rooms() {
	let el = $("rooms");
	el.innerHTML = "";

	let rooms = await fetch("/api/rooms")
		.then(res => res.json())
		.then(data => data.rooms)

	for (let room of rooms)
		el.innerHTML += `
			<a href="/room/${room.name}">
				<div class="roomBadge">${room.name}</div>
			</a>
		`;
}

function showModal(html) {
	modalContent.innerHTML = html;
	modal.style.display = "block";
}

function hideModal() {
	modal.style.display = "none";
}

window.onclick = async function(event) {
	if (event.target == $("createRoom")) {
		showModal(CREATE_ROOM_MODAL_CONTENT)

		$("createRoomForm").addEventListener("submit", async (e) => {
			e.preventDefault();

			const roomName   = $("createRoomName").value.toString();
			let roomPassword = $("createRoomPassword").value.toString();

			if (roomName == "") {
				alert("Room must have a name.");
				return;
			} else if (roomName.includes(" ")) {
				alert("Room name shall not contain any spaces.");
				return;
			}

			roomPassword = (roomPassword == "") ? null : roomPassword;

			await fetch("/api/createRoom", {
				method: "POST",
				mode: "same-origin",
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					roomName: roomName,
					roomPassword: roomPassword,
				})
			})
				.then(res => res.json())
				.then(data => {
					console.log(data);
					switch (data.status) {
						case 200:
							window.location = `${data.roomLocation}`;
							break;
						default:
							alert("Room creation failed for an unknown reason.")
					}
				});
		});

	} else if (event.target == $("browseRooms")) {
		showModal(BROWSE_ROOMS_MODAL_CONTENT);
		await refresh_rooms();

	} else if (
		event.target == modal &&
		modal.style.display == "block"
	) hideModal(); 
}
