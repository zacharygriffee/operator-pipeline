import {test, solo} from 'brittle';
import { createOperatorPipeline } from './index.js';
import {
    AsyncSubject,
    concatMap,
    delay, interval,
    lastValueFrom,
    map,
    of,
    pipe,
    Subject,
    switchMap,
    takeUntil,
    tap,
    toArray
} from 'rxjs';
import {keyFrame} from "./lib/operators/keyframe.js";
import {tween} from "./lib/operators/tween.js";
import {createNode} from "dagify";
import {bindDagify} from "./lib/operators/bindDagify.js";
/**
 * Helper function to create a simple async operator.
 */
const mockOperator = (modifier) => async (data) => ({ ...data, value: data.value + modifier });

test('should add an operator and process updates', async (t) => {
    const pipeline = createOperatorPipeline();

    pipeline.addOperator(mockOperator(10));

    const result = await pipeline.processUpdates({ value: 5 });
    t.is(result.value, 15, 'Operator should modify value correctly');
});

test('should toggle operator and affect processing', async (t) => {
    const pipeline = createOperatorPipeline();

    const { toggle } = pipeline.addOperator(mockOperator(10));

    toggle(false); // Disable the operator
    const result = await pipeline.processUpdates({ value: 5 });

    t.is(result.value, 5, 'Disabled operator should not modify value');
});

test('should remove an operator and not process it', async (t) => {
    const pipeline = createOperatorPipeline();

    const { remove } = pipeline.addOperator(mockOperator(10));
    remove(); // Remove the operator

    const result = await pipeline.processUpdates({ value: 5 });
    t.is(result.value, 5, 'Removed operator should not modify value');
});

test('should process multiple operators in sequence', async (t) => {
    const pipeline = createOperatorPipeline();

    pipeline.addOperator(mockOperator(10));
    pipeline.addOperator(mockOperator(5));

    const result = await pipeline.processUpdates({ value: 5 });
    t.is(result.value, 20, 'Operators should modify value in order');
});

test('should allow multiple toggles and apply changes correctly', async (t) => {
    const pipeline = createOperatorPipeline();

    const { toggle } = pipeline.addOperator(mockOperator(10));
    toggle(false); // Disable
    toggle(true);  // Enable again

    const result = await pipeline.processUpdates({ value: 5 });
    t.is(result.value, 15, 'Toggled operator should modify value after re-enabling');
});

/**
 * Tests RxJS operator processing.
 */
test('should apply RxJS operators correctly', async (t) => {
    const pipeline = createOperatorPipeline();

    pipeline.addOperator(map(data => ({ ...data, transformed: true })));

    const result = await pipeline.processUpdates({ value: 42 });
    t.is(result.transformed, true, 'RxJS operator should modify data');
});

/**
 * Tests both async functions and RxJS operators in sequence.
 */
test('should process both async functions and RxJS operators in order', async (t) => {
    const pipeline = createOperatorPipeline();

    pipeline.addOperator(async (data) => ({ ...data, step1: true }));
    pipeline.addOperator(map(data => ({ ...data, step2: true })));

    const result = await pipeline.processUpdates({ value: 1 });

    t.is(result.step1, true, 'Async function should modify data first');
    t.is(result.step2, true, 'RxJS operator should modify data second');
});

test('should only execute function once', async (t) => {
    const pipeline = createOperatorPipeline();
    let i = 0;

    pipeline.addOperator(async (data) => {
        i++;
        return ({...data, what: true});
    });

    const result = await pipeline.processUpdates({ value: 1 });
    t.is(result.what, true, 'Operator should modify data');
    t.is(i, 1, 'Operator should only be executed once');
});

test("key frames operator", async t => {
    const pipeline = createOperatorPipeline();
    pipeline.addOperator(
        keyFrame(100, val => console.log("Finished:", val))
    );

    const results = [];
    const durations = [];

    // Process each update sequentially so we can measure how long each takes.
    for (const i of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
        const start = Date.now();
        const result = await pipeline.processUpdates(i);
        const end = Date.now();
        results.push(result);
        durations.push(end - start);
    }

    // Verify the final results are as expected.
    t.alike(results, [1,2,3,4,5,6,7,8,9,10], "Key frame results are correct");

    // Log and test the elapsed time for each update.
    durations.forEach((dt, index) => {
        console.log(`Update ${index + 1} took ${dt}ms`);
        // Allow a little tolerance (e.g., at least 80ms for a 100ms delay)
        t.ok(dt >= 80, `Update ${index + 1} took at least ~100ms (measured: ${dt}ms)`);
    });
});


test("concurrent key frames operator", async t => {
    const pipeline = createOperatorPipeline();

    // Set the independent flag to true so that updates are processed concurrently.
    pipeline.addOperator(
        keyFrame(100, val => console.log("Finished:", val), true)
    );

    const start = Date.now();

    const results = await Promise.all(
        [1,2,3,4,5,6,7,8,9,10].map(i => pipeline.processUpdates(i))
    );

    const totalTime = Date.now() - start;

    console.log({ results, totalTime });

    // Verify the results are as expected.
    t.alike(results, [1,2,3,4,5,6,7,8,9,10], "Concurrent key frame results are correct");

    // For concurrent processing with a 100ms delay, we expect the total time to be close to ~100ms plus overhead.
    // Here we assert that the total processing time is less than, say, 250ms.
    t.ok(totalTime < 250, `Total processing time ${totalTime}ms is less than 250ms for concurrent processing`);
});

test("multiple keyframes with timing (using Date.now)", async t => {
    const pipeline = createOperatorPipeline();
    const effects = [];

    // Define the side effect function that records the current time (using Date.now()).
    const act = (val) => {
        effects.push({ val, time: Date.now() });
        console.log("Act:", val, "at", Date.now());
    };

    // Add a keyframe operator with multiple delays (100ms, then 200ms, then 300ms).
    pipeline.addOperator(
        keyFrame([100, 200, 300], act)
    );

    // Record the start time.
    const start = Date.now();

    // Process a single update through the pipeline.
    const result = await pipeline.processUpdates("hello world");

    // Record the end time.
    const end = Date.now();
    const totalTime = end - start;

    // Verify the final result is unchanged.
    t.is(result, "hello world", "The final result should be unchanged");

    // Verify that exactly three keyframe effects were triggered.
    t.is(effects.length, 3, "There should be three keyframe side effects");

    // Calculate the delay of each keyframe relative to the start.
    const firstDelay = effects[0].time - start;
    const secondDelay = effects[1].time - start;
    const thirdDelay = effects[2].time - start;

    console.log({ firstDelay, secondDelay, thirdDelay, totalTime });

    // Allow some tolerance for delays.
    t.ok(firstDelay >= 80 && firstDelay <= 150, `First delay ${firstDelay}ms is within expected range (~100ms)`);
    t.ok(secondDelay >= 250 && secondDelay <= 350, `Second delay ${secondDelay}ms is within expected range (~300ms total)`);
    t.ok(thirdDelay >= 550 && thirdDelay <= 650, `Third delay ${thirdDelay}ms is within expected range (~600ms total)`);

    // Check that the total processing time is roughly the sum of the delays (100 + 200 + 300 = 600ms) plus some overhead.
    t.ok(totalTime >= 600, `Total processing time ${totalTime}ms is at least 600ms`);
    t.ok(totalTime < 800, `Total processing time ${totalTime}ms is less than 800ms`);
});

test("tween operator test", async t => {
    const duration = 500;        // Total tween duration in milliseconds.
    const startValue = 0;
    const endValue = 100;
    const steps = 10;            // The tween operator is designed to emit 10 steps.
    const stepDuration = duration / steps; // Expected delay per step (50ms).

    // Record the start time.
    const startTime = Date.now();

    // Create a source observable that emits a single value and pipe it through the tween operator.
    // Then collect all the interpolated values into an array.
    const source$ = of(null).pipe(
        tween(duration, startValue, endValue),  // Apply the tween operator.
        toArray()                                // Collect all emitted values.
    );

    // Wait for the tween operator to process the value.
    const values = await lastValueFrom(source$);

    // Record the end time.
    const endTime = Date.now();
    const elapsed = endTime - startTime;

    // Verify that we received the expected number of steps.
    t.is(values.length, steps, "Should emit 10 tween values");

    // Verify the first value is roughly at the first interpolation step.
    const expectedFirst = startValue + (1 / steps) * (endValue - startValue);
    t.ok(Math.abs(values[0] - expectedFirst) < 1e-6, "First tween value is correct");

    // Verify the last value equals the endValue.
    t.ok(Math.abs(values[values.length - 1] - endValue) < 1e-6, "Last tween value equals the end value");

    // Log the tweened values for debugging.
    console.log("Tween values:", values);

    // Verify that the total elapsed time is roughly the total duration.
    // Allowing some overhead tolerance (e.g., 150ms).
    t.ok(elapsed >= duration, `Elapsed time (${elapsed}ms) is at least ${duration}ms`);
    t.ok(elapsed < duration + 150, `Elapsed time (${elapsed}ms) is less than ${duration + 150}ms`);

    console.log({ elapsed, duration });
});

test("bindDagify operator", async t => {
    const x = createNode({n: 20});
    const y = createNode(([x]) => x.n, [x]);
    const z = createNode(([x, y]) => x.o = y + 20, [x, y]);
    const pipeline = createOperatorPipeline([bindDagify(x)]);
    t.is(x.value.n, 20);
    await pipeline.processUpdates({n: 30});
    t.is(x.value.n, 30);
    t.is(y.value, 30);
    t.is(z.value, 50);
    await pipeline.processUpdates({n: 40});
    t.is(y.value, 40);
    t.is(z.value, 60);
});
