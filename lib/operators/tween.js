import { of } from "rxjs";
import { delay, map, concatMap, finalize } from "rxjs/operators";
import { pipe } from "rxjs";

/**
 * Creates a tween operator that interpolates between startValue and endValue.
 * @param {number} duration - The total duration of the tween in milliseconds.
 * @param {number} startValue - The starting value.
 * @param {number} endValue - The ending value.
 * @param {Function} [easing=t => t] - An easing function that maps [0,1] to [0,1].
 * @returns {Function} - An RxJS operator that emits interpolated values.
 */
export const tween = (duration, startValue, endValue, easing = t => t) => {
    const steps = 10;
    const stepDuration = duration / steps;
    const deltas = Array.from({ length: steps }, (_, i) => easing((i + 1) / steps));

    return pipe(
        concatMap(() =>
            of(...deltas).pipe(
                concatMap(delta => of(startValue + delta * (endValue - startValue)).pipe(delay(stepDuration))),
                finalize(() => console.log("Tween complete"))
            )
        )
    );
};
