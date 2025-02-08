import { tap } from "rxjs";

const bindDagify = (subject) => tap(val => subject?.set(val));
const bindSvelteStore = bindDagify;

export { bindDagify, bindSvelteStore };
