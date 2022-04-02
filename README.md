![](https://img.shields.io/badge/Version-1.0.0-blue?style=flat-square&logo=deno)

<center>

![APU - Logo](./public/img/apu.webp)

</center>

# About

Play simple trivia games against your friends; a simple web-based game written in Deno with web sockets. Purpose of this project is portfolio and learning Deno.

<br><br>

# Run yourself

Requirements:
* [Deno](https://deno.land/) being locally available

```
git clone https://github.com/dynamo58/trivia-game
cd trivia-game
deno run --allow-net --allow-read main.ts
```

### Obligatory CLI arguments/flags:

<center>

| flag         | description                                                   |
| ---          | ---                                                           |
| --allow-net  | allows Deno to access the network (for port binding)          |
| --allow-read | allows Deno to read local files (to be able to serve content) |

</center>

### Optional CLI arguments/flags:

<center>

| flag | value type | description           | default |
| ---  | ---        | ---                   | ---     |
| -p   | integer    | the port app binds to | 3000    |

</center>

<br><br>

# Deploy yourself

There are multiple options:
* [Deno's official deploy service](https://deno.com/deploy) (free as of writing this)
* Compile via `deno compile --allow-net --allow-read main.ts` and deploy somewhere as a binary
* ... or host yourself 🤷

<center><h1>Enjoy!</h1></center>
