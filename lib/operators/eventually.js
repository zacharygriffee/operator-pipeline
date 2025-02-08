import { takeWhile, last, defaultIfEmpty } from "rxjs/operators";
import { pipe } from "rxjs";

/**
 * Creates an operator that waits until the predicate returns true,
 * then emits the last value.
 * @param {Function} predicate - A function that returns true when the desired condition is met.
 * @returns {Function} - The eventually operator.
 */
export const eventually = (predicate) => pipe(
    takeWhile(val => !predicate(val), true),
    last(null, null),
    defaultIfEmpty(null)
);
