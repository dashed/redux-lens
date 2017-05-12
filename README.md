# redux-lens [![Build Status](https://travis-ci.org/dashed/redux-lens.svg?branch=master)](https://travis-ci.org/dashed/redux-lens)

> Apply a redux reducer and an action at the specified path of your application state tree (i.e. redux store).

## Install

```
$ npm install --save redux-lens
$ yarn add redux-lens
```

## Usage

```js
const {createStore} = require('redux');
const {createReducer, reduceIn} = require('redux-lens');

const defaultReducer = (state) => {
    console.log('defaultReducer called');
    return state;
};

const initialState = {
    foo: {
        bar: {
            baz: [1, 42]
        }
    },
    counter: 9000
};

const reducer = createReducer({
    reducer: defaultReducer,
    aliases: {
        plusTwo(state = 0, action) {
            switch(action.type) {
                case 'ADD': {
                    return state + 2;
                }
            }

            return state;
        }
    }
});

const store = createStore(reducer, initialState);

const addReduce = (state = 0, action) => {
    switch(action.type) {
        case 'ADD': {
            return state + 1;
        }
    }

    return state;
};

const addAction = {
    type: 'ADD'
};

store.getState();
// => {
//     foo: {
//         bar: {
//             baz: [1, 42]
//         }
//     },
//     counter: 9000
// };

store.dispatch(reduceIn(['foo', 'bar', 'baz', 1], 'plusTwo', addAction));
// => {
//     foo: {
//         bar: {
//             baz: [1, 44]
//         }
//     },
//     counter: 9000
// };

store.dispatch(reduceIn(['counter'], addReduce, addAction));
// => {
//     foo: {
//         bar: {
//             baz: [1, 44]
//         }
//     },
//     counter: 9001
// };
```

## API

### `createReducer(options)`

```js
options = {
    // Function signature: fallback_reducer(state, action) => next_state
    //
    // redux compatible reducer function (optional)
    reducer: fallback_reducer,

    // Function signature: getter(state, path) => value
    //
    // function to get the value at "path" of "state". (optional)
    get: getter,

    // Function signature: setter(state, path, new_value) => next_state
    //
    // function to set "new_value" at "path" of "state". (optional)
    set: setter,

    // Plain object mapping aliases to redux reducers. (optional)
    aliases: {
        alias: reducer
    }
}
```

Returns a redux reducer function. This reducer consumes actions generated by the `reduceIn` function.

### `reduceIn(path, reducer, action) => action`

`reduceIn` is an action creator, which generates an action that would be consumed by the reducer generated by `createReducer(options)`.

- `path` (array): An array of keys forming a path to the value in the state to be reduced.

- `reducer` or `alias` (function | alias): redux reducer function or an alias. If an alias is passed, the redux reducer mapped to the alias must be configured through the `createReducer` function.

- `action` (plain object / flux standard action): An action that `reducer` can consume. **Must be [flux standard action (FSA) compliant](https://github.com/acdlite/flux-standard-action).**

License
=======

MIT.
