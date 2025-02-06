export const tryExecute = (fn, ifNot) => {
    try {
        return fn();
    } catch (e) {
        return ifNot();
    }
};