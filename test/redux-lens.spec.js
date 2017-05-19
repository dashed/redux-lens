'use strict';

const chai = require('chai');
const expect = chai.expect;
const createStore = require('redux').createStore;

// http://stackoverflow.com/a/16060619/412627
function requireUncached(module){
    delete require.cache[require.resolve(module)]
    return require(module)
}

const defaultReducer = (state) => {
    return state;
};

describe('redux-lens', function() {

    let reduceIn;
    let createReducer
    let lensPath;

    let store;
    let addAction;
    let initialState;


    beforeEach(() => {

        // TODO: explicit refresh
        const reduxLens = requireUncached('../src/index.js');

        reduceIn = reduxLens.reduceIn;
        createReducer = reduxLens.createReducer;
        lensPath = reduxLens.path;

        addAction = {
            type: 'ADD'
        };

        initialState = {
            foo: {
                bar: {
                    baz: [1, 42, {qux: 33}]
                }
            },
            counter: 9000
        };

        const reducer = reduxLens.createReducer({
            reducer: defaultReducer,
            aliases: {

                not_a_reducer: true,

                bamboozle(state, action) {
                    return 'bamboozle';
                },

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

        store = createStore(reducer, initialState);
    });

    describe('update with path', function() {

        it('root path using array (i.e. [] )', () => {

            const prev = store.getState();
            expect(prev).to.eql(initialState);

            store.dispatch(reduceIn([], 'bamboozle', addAction));

            const expected = 'bamboozle';
            const actual = store.getState();

            expect(actual).to.eql(expected);
        });

        it('root path using lensPath (i.e. lensPath([]) )', () => {

            const prev = store.getState();
            expect(prev).to.eql(initialState);

            const path = lensPath([]);
            store.dispatch(reduceIn(path, 'bamboozle', addAction));

            const expected = 'bamboozle';
            const actual = store.getState();

            expect(actual).to.eql(expected);
        });


        it('at non-existent path using array', () => {

            const prev = store.getState();
            expect(prev).to.eql(initialState);

            store.dispatch(reduceIn(['path', 'to', 'unknown'], 'bamboozle', addAction));

            const expected = {
                foo: {
                    bar: {
                        baz: [1, 42, {qux: 33}]
                    }
                },
                counter: 9000,
                path: {
                    to: {
                        unknown: 'bamboozle'
                    }
                }
            };

            const actual = store.getState();

            expect(actual).to.eql(expected);
        });


        it('at non-existent path using lensPath', () => {

            const prev = store.getState();
            expect(prev).to.eql(initialState);

            const path = lensPath(['path', 'to', 'unknown']);
            store.dispatch(reduceIn(path, 'bamboozle', addAction));

            const expected = {
                foo: {
                    bar: {
                        baz: [1, 42, {qux: 33}]
                    }
                },
                counter: 9000,
                path: {
                    to: {
                        unknown: 'bamboozle'
                    }
                }
            };

            const actual = store.getState();

            expect(actual).to.eql(expected);
        });

    });

    describe('should throw on unknown alias', () => {

        it('using path array', () => {

            const prev = store.getState();
            expect(prev).to.eql(initialState);

            const throwable = function() {
                store.dispatch(reduceIn(['path', 'to', 'state'], 'unknown alias', addAction));
            }

            expect(throwable).to.throw(Error);
        });

        it('using lensPath', () => {

            const prev = store.getState();
            expect(prev).to.eql(initialState);

            const throwable = function() {
                const path = lensPath(['path', 'to', 'state']);
                store.dispatch(reduceIn(path, 'unknown alias', addAction));
            }

            expect(throwable).to.throw(Error);
        });

    });

    describe('should throw when alias resolves to a non-function value', () => {

        it('using path array', () => {

            const prev = store.getState();
            expect(prev).to.eql(initialState);

            const throwable = function() {
                store.dispatch(reduceIn(['path', 'to', 'state'], 'not_a_reducer', addAction));
            }

            expect(throwable).to.throw(Error);
        });

        it('using lensPath', () => {

            const prev = store.getState();
            expect(prev).to.eql(initialState);

            const throwable = function() {
                const path = lensPath(['path', 'to', 'state']);
                store.dispatch(reduceIn(path, 'not_a_reducer', addAction));
            }

            expect(throwable).to.throw(Error);
        });

    });

    describe('reduceIn should throw on non FSA actions', () => {

        it('using array path', () => {

            const prev = store.getState();
            expect(prev).to.eql(initialState);

            const throwable = function() {

                const addReduce = (state = 0, action) => {
                    switch(action.type) {
                        case 'ADD': {
                            return state + 1;
                        }
                    }

                    return state;
                };

                store.dispatch(reduceIn(['path', 'to', 'state'], addReduce, true));
            }

            expect(throwable).to.throw(Error);
        });

        it('using lensPath', () => {

            const prev = store.getState();
            expect(prev).to.eql(initialState);

            const throwable = function() {

                const addReduce = (state = 0, action) => {
                    switch(action.type) {
                        case 'ADD': {
                            return state + 1;
                        }
                    }

                    return state;
                };

                const path = lensPath(['path', 'to', 'state']);

                store.dispatch(reduceIn(path, addReduce, true));
            }

            expect(throwable).to.throw(Error);
        });

    });

    it('update at existing path using an alias', () => {

        const prev = store.getState();
        expect(prev).to.eql(initialState);

        store.dispatch(reduceIn(['foo', 'bar', 'baz', 1], 'bamboozle', addAction));
        store.dispatch(reduceIn(lensPath(['foo', 'bar', 'baz', 0]), 'plusTwo', addAction));
        store.dispatch(reduceIn('foo.bar.baz[0]', 'plusTwo', addAction));

        const actual = store.getState();

        const expected = {
            foo: {
                bar: {
                    baz: [5, 'bamboozle', {qux: 33}]
                }
            },
            counter: 9000
        };

        expect(actual).to.eql(expected);
    });

    it('update at existing path with passed reducer function', () => {

        const prev = store.getState();
        expect(prev).to.eql(initialState);

        const addReduce = (state = 0, action) => {
            switch(action.type) {
                case 'ADD': {
                    return state + 1;
                }
            }

            return state;
        };

        store.dispatch(reduceIn(['foo', 'bar', 'baz', 1], addReduce, addAction));
        store.dispatch(reduceIn('foo.bar.baz[1]', addReduce, addAction));
        store.dispatch(reduceIn('foo.bar.baz[2].qux', addReduce, addAction));
        store.dispatch(reduceIn(['foo', 'bar', 'baz', 2, 'qux'], addReduce, addAction));
        store.dispatch(reduceIn(lensPath(['foo', 'bar', 'baz', 1]), addReduce, addAction));

        const actual = store.getState();

        const expected = {
            foo: {
                bar: {
                    baz: [1, 45, {qux: 35}]
                }
            },
            counter: 9000
        };

        expect(actual).to.eql(expected);
    });

    describe('should be able to configure getters / setters', () => {

        const reduxLens = requireUncached('../src/index.js');

        [
            ['using path string', 'foo.bar'],
            ['using path array', ['foo', 'bar']],
            ['using lensPath', reduxLens.path(['foo', 'bar'])]].forEach((tuple) => {

            const description = tuple[0];
            const path = tuple[1];

            it(description, () => {

                let get_calls = 0;
                let set_calls = 0;
                const GET_RETURN = {};
                const SET_RETURN = {};
                const REDUCER_RETURN = {};

                expect(GET_RETURN).to.not.equal(SET_RETURN);
                expect(GET_RETURN).to.not.equal(REDUCER_RETURN);
                expect(SET_RETURN).to.not.equal(REDUCER_RETURN);

                const reducer = createReducer({
                    reducer: defaultReducer,
                    get(state, __path) {
                        get_calls++;
                        expect(state).to.eql({ foo: {bar: 42}});
                        expect(__path).to.eql(path);
                        return GET_RETURN;
                    },
                    set(state, __path, new_value) {
                        set_calls++;
                        expect(state).to.eql({ foo: {bar: 42}});
                        expect(__path).to.eql(path);
                        expect(new_value).to.equal(REDUCER_RETURN);
                        return SET_RETURN;
                    },
                });

                const initialState = {
                    foo: {
                        bar: 42
                    }
                };

                const __store = createStore(reducer, initialState);

                const action = { type: 'foo', meta: {}};
                const probe = (state, __action) => {
                    expect(__action).to.eql(action);

                    expect(state).to.equal(GET_RETURN);
                    return REDUCER_RETURN;
                }

                expect(get_calls).to.eql(0);
                expect(set_calls).to.eql(0);

                __store.dispatch(reduceIn(path, probe, action));

                const actual = __store.getState();
                expect(actual).to.eql(SET_RETURN);

                expect(get_calls).to.eql(1);
                expect(set_calls).to.eql(1);

            });

        });

    });

});
