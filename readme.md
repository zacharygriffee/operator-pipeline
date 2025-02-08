# Operator Pipeline

## Overview
The `operator-pipeline` package provides a simple and dynamic function pipeline for sequentially processing updates. It allows operators (functions) to be added, removed, and toggled dynamically, making it ideal for reactive programming, data transformation pipelines, and middleware processing.

In addition to the core pipeline functionality, the package includes a collection of built-in RxJS-based operators for common transformations. These operators are available via the subpath `operator-pipeline/operators`.

## Installation
```sh
npm install operator-pipeline
```

## Usage

### Importing the Pipeline
```js
import { createOperatorPipeline } from 'operator-pipeline';
```

### Creating a Pipeline
```js
const pipeline = createOperatorPipeline();
```

### Adding an Operator
```js
const { toggle, remove } = pipeline.addOperator(async (data) => {
    return { ...data, transformed: true };
});
```

### Processing Updates
```js
pipeline.processUpdates({ id: 123 }).then(result => console.log(result));
```

### Toggling an Operator
```js
toggle(false); // Disables the operator
toggle(true);  // Enables it again
```

### Removing an Operator
```js
remove();
```

### Removing an Operator by Function Reference
```js
const myOperator = async (data) => { return { ...data, logged: true }; };
const { remove } = pipeline.addOperator(myOperator);

pipeline.removeOperator(myOperator);
```

## Built-in Operators

The package provides a set of built-in operators that leverage RxJS to perform advanced data transformations. You can import these operators from the subpath `operator-pipeline/operators` as shown below:

```js
import { conditional, eventually, keyFrame, tween } from 'operator-pipeline/operators';
```

### Available Operators

#### `conditional(predicate, transform)`
Creates an operator that filters values based on a predicate, then applies a transformation.
- **Parameters:**
    - `predicate`: A function that returns `true` for values to allow.
    - `transform`: A transformation function to apply to the value.
- **Example:**
  ```js
  // Only double values greater than 10.
  const conditionalOperator = conditional(
    value => value > 10,
    value => value * 2
  );
  ```

#### `eventually(predicate)`
Creates an operator that waits until the predicate returns `true`, then emits the last value.
- **Parameters:**
    - `predicate`: A function that returns `true` when the desired condition is met.
- **Example:**
  ```js
  // Emit the last value when the string equals "complete".
  const eventuallyOperator = eventually(
    value => value === 'complete'
  );
  ```

#### `keyFrame(ms, act, concurrent = false)`
Creates a keyframe operator that delays the emission and applies a side-effect action. The `ms` parameter can be a single number or an array of delays.
- **Parameters:**
    - `ms`: A delay in milliseconds (or an array of delays for sequential processing).
    - `act`: A side-effect function to perform on the value.
    - `concurrent` (optional): If `true`, values are processed concurrently; if `false`, sequentially (default is `false`).
- **Example:**
  ```js
  // Delay 500ms before logging the value.
  const keyFrameOperator = keyFrame(
    500,
    value => console.log('Action on:', value),
    false
  );
  ```

#### `tween(duration, startValue, endValue, easing = t => t)`
Creates a tween operator that interpolates between `startValue` and `endValue` over a specified `duration` (in milliseconds) using an optional easing function.
- **Parameters:**
    - `duration`: Total duration of the tween in milliseconds.
    - `startValue`: The starting value.
    - `endValue`: The ending value.
    - `easing` (optional): A function mapping `[0, 1]` to `[0, 1]` (default is linear).
- **Example:**
  ```js
  // Tween from 0 to 100 over 1000ms using a linear easing function.
  const tweenOperator = tween(
    1000,
    0,
    100,
    t => t
  );
  ```

## API Reference

### `createOperatorPipeline(initialOperators = [])`
Creates a new operator pipeline.
- **`initialOperators`** (optional): An array of functions to initialize the pipeline.
- **Returns**: An object with `addOperator`, `removeOperator`, and `processUpdates`.

### `addOperator(operatorFn, enabled = true)`
Adds an operator function.
- **`operatorFn`**: A function that processes data.
- **`enabled`** (default: `true`): Initial enabled state.
- **Returns**: An object `{ toggle, remove }`.

### `removeOperator(operatorFn)`
Removes an operator by function reference.

### `processUpdates(updates)`
Processes updates through enabled operators.
- **Returns**: `Promise<any>` resolving to the final transformed data.

## License
MIT