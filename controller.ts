import { Context } from 'https://deno.land/x/abc@v1.3.3/mod.ts';
import { acceptWebSocket } from 'https://deno.land/x/abc@v1.0.3/vendor/https/deno.land/std/ws/mod.ts';
import { HandlerFunc } from 'https://deno.land/x/abc@v1.0.3/types.ts';
import { v4 } from "https://deno.land/std/uuid/mod.ts"

export const getEmote = async (c: Context) => {
	const { emoteName } = c.params;
	return c.file(`public/img/${emoteName}.webp`);
}

export const getHome = async (c: Context) => {
    return c.file("public/index.html");
}

export const joinRoom = async (c: Context) => {
	
}

export const createRoom = async (c: Context) => {
	
}

export const game = async (c: Context) => {
	
}

// WebSockets
// export const socket: HandlerFunc = async (c: Context) => {
// 	const { emoteName } = c.params;
// 	const { conn, headers, r: bufReader, w: bufWriter } = c.request;
//   	const ws = await acceptWebSocket({
// 		conn,
// 		headers,
// 		bufReader,
// 		bufWriter,
// 	});

// 	for await (const e of ws) {
// 		console.log(e);
// 		await ws.send("Hello, Client!");
// 	}
// }