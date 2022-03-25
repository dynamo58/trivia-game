import {
    Room
} from "models.ts";

export function Room(
    p1:   string,
    p2:   string,
    name: string,
    pw:   string | null,
): Room | string  {
    if (!is_room(name)) {
        return {
            player1:  p1,
            player2:  p2,
            name:     name,
            password: pw,
        }
    }

    return "Room already exists.";
}

export function is_room(
    rooms: Room[],
    room_name: string
): boolean {
    for (let room of rooms) {
        if (room.name === room_name) {
            return true;
        }
    }

    return false;
}




