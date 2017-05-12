const { isFSA } = require('flux-standard-action');

const L = require('./lens');
const merge = require('lodash/merge');
const isFunction = require('lodash/isFunction');
const deleteIn = require('lodash/unset');
const lodashGetIn = require('lodash/get');

/* helpers */

const __getIn = (rootData, path) => {
    const lens = L.lensPath(path);
    return L.view(lens, rootData);
};

// NOTE:
// - should return new object.
// - should NOT edit rootData in-place
const __setIn = (rootData, path, newValue) => {
    const lens = L.lensPath(path);
    return L.set(lens, newValue, rootData);
};

const identity = (state) => state;

/* lib */

// sentinel value
const NOT_SET = {};

// action creator
const reduceIn = (path, reducer, action) => {

    if(!isFSA(action)) {
        throw new Error('Expected action to be FSA (Flux Standard Action) compliant.');
    }

    const patch = {
        meta: {
            __redux_lens__: {
                path: path,
                reducer: reducer, // redux compatible reducer
            }
        }
    };

    return merge({}, action, patch);
};

const isReduceInAction = (action) => {

    const reducer = lodashGetIn(action, ['meta', '__redux_lens__', 'reducer'], NOT_SET);

    return isFSA(action) &&
        lodashGetIn(action, ['meta', '__redux_lens__', 'path'], NOT_SET) !== NOT_SET &&
        reducer !== NOT_SET &&
        isFunction(reducer);
};


const applyReduceInAction = (getIn, setIn) => (state, action) => {

    // invariant: lodashGetIn(action, ['meta', '__redux_lens__'], NOT_SET) !== NOT_SET

    const path = lodashGetIn(action, ['meta', '__redux_lens__', 'path']);
    const reducer = lodashGetIn(action, ['meta', '__redux_lens__', 'reducer']);

    deleteIn(action, ['meta', '__redux_lens__']);

    // TODO: if meta prop didn't exist in the original action; then it'll be an empty object.

    const oldValue = getIn(state, path);
    const newValue = reducer(oldValue, action);

    if(oldValue === newValue) {
        // fast path
        return state;
    }

    const newRoot = setIn(state, path, newValue);

    return newRoot;
};

const createReducer = (options) => {

    const setIn = lodashGetIn(options, ['set'], __setIn);
    const getIn = lodashGetIn(options, ['get'], __getIn);

    const __applyReduceInAction = applyReduceInAction(getIn, setIn);

    const reducer = (state, action) => {

        if(isReduceInAction(action)) {
            return __applyReduceInAction(state, action);
        }

        // fallback reducer

        const maybeReducer = lodashGetIn(options, ['reducer'], identity);
        const reducer = isFunction(maybeReducer) ? maybeReducer : identity;

        return reducer(state, action);
    };

    return reducer;
}

/* exports */

module.exports = {
    createReducer,
    reduceIn
};
