import {isObservable, of} from "rxjs";

/**
 * Checks if a given function is an RxJS operator.
 * @param {Function} fn - The function to check.
 * @returns {boolean} - True if it's an RxJS operator, false otherwise.
 */
export const isRxJSOperator = (fn) => {
    if (typeof fn !== "function") return false;

    try {
        const test$ = of(1); // Create a simple test Observable
        const result$ = fn(test$); // Apply the function

        return isObservable(result$); // If it returns an Observable, it's an operator
    } catch {
        return false;
    }
};