import { Context } from 'https://deno.land/x/abc@v1.3.3/mod.ts';

export const getEmote = async (c: Context) => {
	const { emoteName } = c.params;
	return c.file(`public/${emoteName}.webp`);
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