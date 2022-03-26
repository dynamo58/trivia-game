const $ = (r) => document.getElementById(r);

const modal = $("modal");
const modalContent = $("modalContent");

const CREATE_ROOM_MODAL_CONTENT = `
	<p>Create your brand new room!</p>
	<form autocomplete="off">
		<input
			type="text"
			autocomplete="false"
			name="roomName"
		>
		<label for="roomName">Room name</label>
		<br><br>
		<input
			type="password"
			autocomplete="false"
			name="roomPassword"
		>
		<label for="roomPassword">Room password (optional)</label>
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

async function refresh_rooms() {
	let el = $("rooms");
	el.innerHTML = "";

	let rooms = await fetch("/api/rooms");

	for (let room of rooms) {
		el.innerHTML += `<div>${room.name}</div>`;
	}
}

window.onclick = async function(event) {
	if (event.target == $("createRoom")) {
		modalContent.innerHTML = CREATE_ROOM_MODAL_CONTENT;
		modal.style.display = "block";

	} else if (event.target == $("browseRooms")) {
		modalContent.innerHTML = BROWSE_ROOMS_MODAL_CONTENT;
		modal.style.display = "block";
		await refresh_rooms();

	} else if (event.target == modal && modal.style.display == "block") {
		modal.style.display = "none";
	}
}
