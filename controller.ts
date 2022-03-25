import { Context } from 'https://deno.land/x/abc@v1.3.3/mod.ts';
import { v4 } from "https://deno.land/std/uuid/mod.ts"

export const getEmote = async (c: Context) => {
	const { emoteName } = c.params;
	return c.file(`public/img/${emoteName}.webp`);
}

export const getHome = async (c: Context) => {
    return c.file("public/index.html");
}

export const getRoom = async (c: Context) => {
    return c.file("public/room.html");
}

export const joinRoom = async (c: Context) => {
	
}

export const createRoom = async (c: Context) => {
	
}

export const game = async (c: Context) => {
	
}

// WebSockets
export const socket = async (c: Context) => {
	const { emoteName } = c.params;


}