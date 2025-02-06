import {BehaviorSubject, lastValueFrom, of} from "rxjs";
import {isRxJSOperator} from "./lib/isRxJSOperator.js";

/**
 * Creates a dynamic operator pipeline.
 * @param {Function[]} [initialOperators] - Optional array of initial operator functions.
 * @returns {object} - The pipeline with methods to add, remove operators, and process updates.
 */
const createOperatorPipeline = (initialOperators = []) => {
    const operatorsSubject = new BehaviorSubject([]);
    let operatorIdCounter = 0;

    /**
     * Adds a new operator to the pipeline.
     * @param {Function} operatorFn - A function that processes updates.
     * @param {boolean} [enabled=true] - Initial state of the operator (enabled/disabled).
     * @returns {Object} - An object containing toggle and remove functions.
     */
    const addOperator = (operatorFn, enabled = true) => {
        const operator = { operatorFn, id: operatorIdCounter++, enabled };
        operatorsSubject.next([...operatorsSubject.getValue(), operator]);

        /**
         * Toggles the enabled state of the operator.
         * @param {boolean|null} [newState=null] - If `true`, enables the operator; if `false`, disables it; if `null`, toggles state.
         */
        const toggle = (newState = null) => {
            const updatedOperators = operatorsSubject.getValue().map(op =>
                op.id === operator.id
                    ? { ...op, enabled: newState !== null ? newState : !op.enabled }
                    : op
            );
            operatorsSubject.next(updatedOperators);
        };

        /**
         * Removes the operator from the pipeline.
         */
        const remove = () => {
            const updatedOperators = operatorsSubject.getValue().filter(op => op.id !== operator.id);
            operatorsSubject.next(updatedOperators);
        };

        return { toggle, remove };
    };

    /**
     * Removes an operator from the pipeline by its function reference.
     * @param {Function} operatorFn - The operator function to remove.
     */
    const removeOperator = (operatorFn) => {
        const updatedOperators = operatorsSubject.getValue().filter(op => op.operatorFn !== operatorFn);
        operatorsSubject.next(updatedOperators);
    };

    /**
     * Processes a series of updates using the current enabled operators in order.
     * @param {any} updates - The updates to process.
     * @returns {Promise<any>} - A Promise that resolves when all processing is complete.
     */
    const processUpdates = async (updates) => {
        const operators = operatorsSubject.getValue().filter(op => op.enabled);

        let currentUpdate = updates;
        for (const { operatorFn } of operators) {
            if (isRxJSOperator(operatorFn)) {
                // RxJS Operator: Apply it inside `.pipe()`
                currentUpdate = await lastValueFrom(of(currentUpdate).pipe(operatorFn));
            } else {
                // Regular function: Treat as async and wrap with `Promise.resolve()`
                currentUpdate = await Promise.resolve(operatorFn(currentUpdate));
            }
        }

        return currentUpdate;
    };

    // Initialize with provided operators
    initialOperators.forEach(fn => addOperator(fn, true));

    return { addOperator, removeOperator, processUpdates };
};

export { createOperatorPipeline };
