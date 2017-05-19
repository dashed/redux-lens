# redux-lens [![npm version](https://img.shields.io/npm/v/redux-lens.svg?style=flat)](https://www.npmjs.com/package/redux-lens) [![Build Status](https://travis-ci.org/dashed/redux-lens.svg?branch=master)](https://travis-ci.org/dashed/redux-lens)

> Apply a redux reducer and an action at the specified path of your application state tree (i.e. redux store).

## Install

```
$ npm install --save redux-lens
$ yarn add redux-lens
```

## Usage

```js
const {createStore} = require('redux');
const {createReducer, reduceIn, path} = require('redux-lens');

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

// Using an alias.
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

// Create a lens path
const pathToCounter = path(['counter']);

store.dispatch(reduceIn(pathToCounter, addReduce, addAction));
// => {
//     foo: {
//         bar: {
//             baz: [1, 44]
//         }
//     },
//     counter: 9002
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

- `path` (`Array` | `String` | `lensPath`): An array of keys forming a path to the value in the state to be reduced. If `path` is a `String`, then the path will be resolved into an array using the lodash function [`_.toPath`](https://lodash.com/docs/4.17.4#toPath).

- `reducer` (`Function`) or `alias` (`String`): redux reducer function or an alias. If an alias is passed, the redux reducer mapped to the alias must be configured through the `createReducer` function.

- `action` (plain object / flux standard action): An action that `reducer` can consume. **Must be [flux standard action (FSA) compliant](https://github.com/acdlite/flux-standard-action).**

### `path(path_to_state) => lensPath`

Creates a function (i.e. `lensPath`) whose focus is at the specified path, `path_to_state`.

Similar to: http://ramdajs.com/docs/#lensPath

Type signature of `lensPath`:

```
lensPath<P, R, T, U>: path<P> => curriedLens<R, T, U>
lens<P, R, T, U>: getter<P, R, T> => setter<P, U, R> => path<P> => curriedLens<R, T, U>
curriedLens<R, T, U>: intoFunctor<T, U> => root<R> => Functor<U>
intoFunctor<T, U>: sub_root<T> => Functor<U>

Functor<T>: {
    value: T,
    map: mapf => Functor<U>
}

mapf<T, U>: T => U
```

To learn more about lenses, see: https://medium.com/@dtipson/functional-lenses-d1aba9e52254

Development
===========

- Install dependencies: `yarn install`

- Lint: `yarn run eslint`

- Tests: `yarn run test`

Credits
=======

Credits to the following, of which I've refactored out `lens` functions into `~/src/lens.js`:

- https://medium.com/@dtipson/functional-lenses-d1aba9e52254
- https://github.com/ramda/ramda

License
=======

MIT.
