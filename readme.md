# Operator Pipeline

## Overview
The `operator-pipeline` package provides a simple and dynamic function pipeline for sequentially processing updates. It allows operators (functions) to be added, removed, and toggled dynamically, making it ideal for reactive programming, data transformation pipelines, and middleware processing.

## Installation
```sh
npm install operator-pipeline
```

## Usage
### Importing
```javascript
import { createOperatorPipeline } from 'operator-pipeline';
```

### Creating a Pipeline
```javascript
const pipeline = createOperatorPipeline();
```

### Adding an Operator
```javascript
const { toggle, remove } = pipeline.addOperator(async (data) => {
    return { ...data, transformed: true };
});
```

### Processing Updates
```javascript
pipeline.processUpdates({ id: 123 }).then(result => console.log(result));
```

### Toggling an Operator
```javascript
toggle(false); // Disables the operator
toggle(true);  // Enables it again
```

### Removing an Operator
```javascript
remove();
```

### Removing an Operator by Function Reference
```javascript
const myOperator = async (data) => { return { ...data, logged: true }; };
const { remove } = pipeline.addOperator(myOperator);

pipeline.removeOperator(myOperator);
```

## API Reference
### `createOperatorPipeline(initialOperators = [])`
Creates a new operator pipeline.
- **`initialOperators`** (optional): An array of functions to initialize the pipeline.
- **Returns**: An object with `addOperator`, `removeOperator`, and `processUpdates`.

### `addOperator(operatorFn, enabled = true)`
Adds an operator function.
- **`operatorFn`**: Function that processes data.
- **`enabled`** (default: `true`): Initial enabled state.
- **Returns**: An object `{ toggle, remove }`.

### `removeOperator(operatorFn)`
Removes an operator by function reference.

### `processUpdates(updates)`
Processes updates through enabled operators.
- **Returns**: `Promise<any>` resolving to the final transformed data.

## License
MIT

