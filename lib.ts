import { WebSocket } from "https://deno.land/x/abc@v1.3.3/vendor/https/deno.land/std/ws/mod.ts";

export const println = async (s: string) => 
    await Deno.stdout.write(new TextEncoder().encode(`${s}\n`));

// represents a player in a lobby
export class Player {
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
	public name:         string;
    public sockets:      Map<string, WebSocket>;
    public spectators:   string[];
	password:            string | null;


    constructor(
        name: string,
        pw:   string | null,
    ) {
        this.player1  = null;
        this.player2  = null;
        this.name     = name;
        this.password = pw;
        this.sockets  = new Map();
        this.spectators = [];
    }
}

// all the variants as which one can
// join a room
export enum Participant {
	Player1 = "player1",
	Player2 = "player2",
	Spectator = "spectator",
}

// checks `Room` array for a room with a specific name
// if no such `Room` is found, returns `false`
// if such `Room` is found, returns it
//      (which can be autoconverted to `true`)
export function is_room(
    rooms: Room[],
    roomName: string
): Room | false {
    for (let room of rooms) {
        if (room.name === roomName)
            return room;
    }

    return false;
}

export function clamp(num: number, min: number, max: number) {
    return Math.min(Math.max(num, min), max);
}

// shamelessly yoinked from
// https://stackoverflow.com/a/46545530
export function shuffle(arr: any[]) {
    return arr
        .map(value => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ value }) => value);
}

// retrieve questions from an API
export async function fetch_questions(amount: number) {
    let num = Math.floor(clamp(amount, 1, 50));

    await fetch(`https://opentdb.com/api.php?amount=${num}&category=18`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        },
    })
        .then(res => res.json())
        .then(data => {
            let qs = Array.from(data.results).map((q: any) => {
                let all_answers = q.incorrect_answers;
                all_answers.push(q.correct_answer);
                all_answers = shuffle(all_answers);

                return {
                    question: q.question,
                    all_answers: all_answers,
                    correct_answer_idx: all_answers.indexOf(q.correct_answer)
                }
            });

            console.log(qs);
        });
}
