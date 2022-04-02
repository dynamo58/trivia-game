const $  = (r)  => document.getElementById(r);
const $$ = (r)  => document.querySelectorAll(r);

const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

const sleep = (t) => new Promise((resolve) => setTimeout(resolve, t));