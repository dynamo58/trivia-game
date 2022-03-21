import { Application } from 'https://deno.land/x/abc@v1.3.3/mod.ts';
import { getEmote, getHome, joinRoom, createRoom, game } from './controller.ts';

// import { walk } from 'https://deno.land/std@0.130.0/fs/mod.ts';
// let emotes: Array<string> = [];

// async function getEmotes() {
//   for await (const emote of walk('./public')) {
//     emotes.push(emote.name.split('.')[0]);
//   }
// }

// getEmotes().then(() => console.log('Emotes loaded!'));

const app = new Application();
app.static('/', './public');
console.log(`App listening on http://localhost:8080/`);

app
  .get('/', getHome)
  .get('/home', getHome)
  .get('emotes/:emoteName', getEmote)
  .start({ port: 8080 });