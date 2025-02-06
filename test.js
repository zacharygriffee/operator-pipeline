import {test, solo} from 'brittle';
import { createOperatorPipeline } from './index.js';
import { map } from 'rxjs';
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

