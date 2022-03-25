class Player {
    public nickname: string;
    public score:    number;

    constructor(n: string) {
        this.nickname = n;
        this.score    = 0;
    }
}

// represents a room/lobby of an instance
// of an ongoing game
export class Room {
	public player1:      Player | null;
	public player2:      Player | null;
	public player1Score: number;
	public player2Score: number;
	public name:         string;
	password:            string | null;

    constructor(
        p1:   string,
        p2:   string,
        name: string,
        pw:   string | null,
    ) {
        this.player1      = new Player(p1);
        this.player2      = new Player(p2);
        this.player1Score = 0;
        this.player2Score = 0;
        this.name         = name;
        this.password     = pw;
    }
}

// checks `Room` array for a room with a specific name
// if no such `Room` is found, returns `false`
// if such `Room` is found, returns it
//      (which can be autoconverted to `true`)
export function is_room(
    rooms: Room[],
    room_name: string
): Room | false {
    for (let room of rooms) {
        if (room.name === room_name)
            return room;
    }

    return false;
}
