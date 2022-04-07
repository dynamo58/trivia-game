import { WebSocket } from "https://deno.land/x/abc@v1.3.3/vendor/https/deno.land/std/ws/mod.ts";
import { sleep } from "https://deno.land/x/sleep/mod.ts";

// this is rather [...]
export const println = async (...data: any[]) => 
    await Deno.stdout.write(new TextEncoder().encode(`${data}\n`));

// represents a player in a lobby
export class Player {
    public nickname: string;
    public uuid:     string;
    public score:    number;
    public isReady:  boolean;

    constructor(n: string, uuid: string) {
        this.nickname = n;
        this.uuid     = uuid;
        this.score    = 0;
        this.isReady  = false;
    }
}

export type uuid = string;

// these are the categories of questions
// that can be served

// the number is the exact number
// assigned to the different  categories
// by opendtb (which the game is getting
// questings from) 
enum QuestionCategory {
    Mathematics = 19,
    Computers = 18,
    ScienceAndNature = 17,
};

// represents a room/lobby
export class Room {
    public sockets:       Map<uuid, WebSocket>;
    public recdAnswers:   Map<uuid, number>;
	public player1:       Player | null;
	public player2:       Player | null;
	public name:          string;
    public spectators:    string[];
	public questionQueue: Question[] | null;
    public isGame:        boolean;
    password:             string | null;
    
    constructor(
        name: string,
        pw:   string | null,
    ) {
        this.player1       = null;
        this.player2       = null;
        this.name          = name;
        this.password      = pw;
        this.sockets       = new Map();
        this.spectators    = [];
        this.questionQueue = null;
        this.recdAnswers   = new Map();
        this.isGame        = false;
    }

    // send question to all clients
    async sendQuestion() {
        let q = this.questionQueue![0];

        for (let [_, ws] of this.sockets.entries()) {
            ws.send(JSON.stringify({
                action: "question",
                questionNumber: 21 - this.questionQueue!.length,
                question: {
                    question: q?.question,
                    all_answers: q?.all_answers,
                },
            }));
        }
    }

    // handle an on-going game
    async handleGame() {
        await println(`Room \`${this.name}\` has started playing`);
        // notify users of game starting
        for (const [_, socket] of this.sockets.entries())
            socket.send(JSON.stringify({
                action: "gameStarting",
            }));

        // load up a queue of 20 questions (number hard-coded on client side)
        this.questionQueue = await fetchQuestion(7, QuestionCategory.Computers);
        this.questionQueue =
            this.questionQueue.concat(await fetchQuestion(7, QuestionCategory.Mathematics));
        this.questionQueue =
            this.questionQueue.concat(await fetchQuestion(6, QuestionCategory.ScienceAndNature));
        this.questionQueue = shuffle(this.questionQueue);

        await sleep(5);
        
        // notify users that the game has started
        for (const [_, socket] of this.sockets.entries()) {
            socket.send(JSON.stringify({
                action: "gameStarted",
            }));
        }

        // game loop
        while (this.isGame) {
            await this.sendQuestion();
            // give slightly more time than 10 secs
            // in order to compensate for some delay
            // that may occur;
            // (the frontend should still treat
            //  this as 10 secs, though)
            await sleep(10.1);
            this.evaluateAnswers();
            this.questionQueue.shift();
            // if there is no more questions in the queue
            // break out of the loop and end the game
            if (this.questionQueue.length === 0)
                break;
            else 
                await sleep(10);
        }

        // send information to the users about game ending
        for (const [_, socket] of this.sockets.entries())
            socket.send(JSON.stringify({
                action: "gameEnded",
                roomState: {
                    name:       this.name,
                    player1:    this.player1,
                    player2:    this.player2,
                    spectators: this.spectators
                }
            }));
        
        this.isGame = false;
    }

    // calculate the scores
    evaluateAnswers() {
        let results: Map<uuid, boolean> = new Map();

        // check if the answers are correct
        for (let [uuid, answer_idx] of this.recdAnswers.entries()) {
            if (this.player1?.uuid === uuid) {
                if (this.questionQueue![0].correct_answer_idx == answer_idx) {
                    results.set(uuid, true);
                    this.player1.score += 10;
                } else
                    results.set(uuid, false);
            }

            if (this.player2?.uuid === uuid) {
                if (this.questionQueue![0].correct_answer_idx == answer_idx) {
                    results.set(uuid, true);
                    this.player2.score += 10;
                } else
                    results.set(uuid, false);
            }
        }

        // notify the users of the results
        for (const [uuid, ws] of this.sockets.entries()) {
            ws.send(JSON.stringify({
                action: "answerEvaluation",
                evaluation: results.get(uuid),
                correctAnswer: this.questionQueue![0].all_answers[this.questionQueue![0].correct_answer_idx],
                roomState: {
                    name:       this.name,
                    player1:    this.player1,
                    player2:    this.player2,
                    spectators: this.spectators
                }
            }));
        }

        this.recdAnswers.clear();
    }
}

// represents a question
// as percieved by the server
export interface Question {
    question: string,
    all_answers: string[],
    correct_answer_idx: number,
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
    for (let room of rooms)
        if (room.name === roomName)
            return room;

    return false;
}

// clamp a value between two numbers
export function clamp(
    num: number,
    min: number,
    max: number
): number {
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
export async function fetchQuestion(amount: number, cat: QuestionCategory): Promise<Question[]> {
    let num = Math.floor(clamp(amount, 1, 50));

    return await fetch(`https://opentdb.com/api.php?amount=${num}&category=${cat}&type=multiple`, {
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

                let out: Question = {
                    question: q.question,
                    all_answers: all_answers,
                    correct_answer_idx: all_answers.indexOf(q.correct_answer)
                };

                return out;
            });

            return qs;
        });
}
