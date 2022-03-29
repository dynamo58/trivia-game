// /**
//  * Shortcut for getElementById
//  * @param  {String} r      The id of the node.
//  * @return {object | null} The node.
//  */
const $  = (r)  => document.getElementById(r);
const $$ = (r)  => document.querySelector(r);
const $$$ = (r) => document.querySelectorAll(r);

const clamp = (num, min, max) => Math.min(Math.max(num, min), max);
