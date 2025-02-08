import { of, Subject } from "rxjs";
import { delay, takeUntil, tap, mergeMap, concatMap, finalize } from "rxjs/operators";
import { pipe } from "rxjs";

/**
 * Creates a keyframe operator.
 * @param {number|number[]} ms - A single delay in milliseconds or an array of delays.
 * @param {Function} act - The side-effect action to perform on the value.
 * @param {boolean} [concurrent=false] - If true, processes values concurrently; if false, sequentially.
 * @returns {Function} - An RxJS operator that delays and applies the side-effect.
 */
const keyFrame = (ms, act, concurrent = false) => {
    // The innerObservable creates its own cancellation subject per value.
    const innerObservable = (value) => {
        const cancellation$ = new Subject();
        let obs = of(value);

        // If ms is an array, chain each delay & side effect sequentially.
        if (Array.isArray(ms)) {
            ms.forEach(delayMs => {
                obs = obs.pipe(
                    delay(delayMs),
                    tap(act)
                );
            });
        } else {
            // If ms is a single number, just use that delay.
            obs = obs.pipe(
                delay(ms),
                tap(act)
            );
        }

        // Attach cancellation and finalization.
        return obs.pipe(
            takeUntil(cancellation$),
            finalize(() => {
                cancellation$.next();
                cancellation$.complete();
            })
        );
    };

    // Use mergeMap for concurrent processing, or concatMap for sequential.
    const mappingOperator = concurrent ? mergeMap : concatMap;

    return pipe(
        mappingOperator(innerObservable)
    );
};

export { keyFrame };
