import { filter, map } from "rxjs/operators";
import { pipe } from "rxjs";

/**
 * Creates an operator that filters values based on a predicate,
 * then applies a transformation.
 * @param {Function} predicate - A function that returns true for values to allow.
 * @param {Function} transform - A transformation function to apply to the value.
 * @returns {Function} - The conditional operator.
 */
export const conditional = (predicate, transform) => pipe(
    filter(predicate),
    map(transform)
);
