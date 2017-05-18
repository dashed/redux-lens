'use strict';

const isFSA = require('flux-standard-action').isFSA;

const L = require('./lens');
const merge = require('lodash/merge');
const isFunction = require('lodash/isFunction');
const deleteIn = require('lodash/unset');
const lodashGetIn = require('lodash/get');
const lodashSetIn = require('lodash/set');

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

// constants

const path_to_redux_lens_path = ['meta', '__redux_lens__', 'path'];
const path_to_redux_lens_reducer = ['meta', '__redux_lens__', 'reducer'];

// action creator
const reduceIn = (path, reducer, action) => {

    if(!isFSA(action)) {
        throw new Error('Expected action to be FSA (Flux Standard Action) compliant.');
    }

    const patch = {
        meta: {
            __redux_lens__: {
                path: path,
                // redux compatible reducer or an alias to a reducer
                reducer: reducer,
            }
        }
    };

    return merge({}, action, patch);
};

const isReduceInAction = (action) => {

    const reducer = lodashGetIn(action, path_to_redux_lens_reducer, NOT_SET);

    return isFSA(action) &&
        lodashGetIn(action, path_to_redux_lens_path, NOT_SET) !== NOT_SET &&
        reducer !== NOT_SET;
};

const applyReduceInAction = (getIn, setIn) => (state, action) => {

    // invariant: lodashGetIn(action, ['meta', '__redux_lens__'], NOT_SET) !== NOT_SET

    const path = lodashGetIn(action, path_to_redux_lens_path);
    const reducer = lodashGetIn(action, path_to_redux_lens_reducer);

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

const applyAliases = (action, aliases) => {

    const reducer = lodashGetIn(action, path_to_redux_lens_reducer);

    if(isFunction(reducer)) {
        return action;
    }

    // reducer may be an alias
    const resolvedReducer = lodashGetIn(aliases, [reducer], NOT_SET);

    if(resolvedReducer === NOT_SET) {
        throw Error(`Alias not found: ${reducer}`);
    }

    if(!isFunction(resolvedReducer)) {
        throw Error(`Reducer mapped to alias '${reducer}' is not a function: ${resolvedReducer}`);
    }

    return lodashSetIn(action, path_to_redux_lens_reducer, resolvedReducer);
};

const createReducer = (options) => {

    const setIn = lodashGetIn(options, ['set'], __setIn);
    const getIn = lodashGetIn(options, ['get'], __getIn);
    const aliases = lodashGetIn(options, ['aliases'], NOT_SET);

    const __applyReduceInAction = applyReduceInAction(getIn, setIn);

    const reducer = (state, action) => {

        if(isReduceInAction(action)) {

            if(aliases !== NOT_SET) {
                action = applyAliases(action, aliases);
            }

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
