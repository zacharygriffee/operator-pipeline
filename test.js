import test from 'brittle';
import { createOperatorPipeline } from './index.js';

/**
 * Helper function to create a simple operator.
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
