const chai = require('chai');
const expect = chai.expect;
const createStore = require('redux').createStore;

const defaultReducer = (state) => {
    return state;
};

describe('redux-lens', function() {

    let reduceIn;
    let createReducer
    let store;
    let addAction;
    let initialState;

    beforeEach(() => {
        reduxLens = require('../src/index.js');

        reduceIn = reduxLens.reduceIn;
        createReducer = reduxLens.createReducer;

        addAction = {
            type: 'ADD'
        };

        initialState = {
            foo: {
                bar: {
                    baz: [1, 42]
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

    it('update at root path', () => {

        const prev = store.getState();
        expect(prev).to.eql(initialState);

        store.dispatch(reduceIn([], 'bamboozle', addAction));

        const expected = 'bamboozle';
        const actual = store.getState();

        expect(actual).to.eql(expected);
    });

    it('update at non-existent path', () => {

        const prev = store.getState();
        expect(prev).to.eql(initialState);

        store.dispatch(reduceIn(['path', 'to', 'unknown'], 'bamboozle', addAction));

        const expected = {
            foo: {
                bar: {
                    baz: [1, 42]
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

    it('should throw on unknown alias', () => {

        const prev = store.getState();
        expect(prev).to.eql(initialState);

        const throwable = function() {
            store.dispatch(reduceIn(['path', 'to', 'state'], 'unknown alias', addAction));
        }

        expect(throwable).to.throw(Error);
    });

    it('should throw when alias resolves to a non-function value', () => {

        const prev = store.getState();
        expect(prev).to.eql(initialState);

        const throwable = function() {
            store.dispatch(reduceIn(['path', 'to', 'state'], 'not_a_reducer', addAction));
        }

        expect(throwable).to.throw(Error);
    });

    it('reduceIn should throw on non FSA actions', () => {

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

    it('update at existing path using an alias', () => {

        const prev = store.getState();
        expect(prev).to.eql(initialState);

        store.dispatch(reduceIn(['foo', 'bar', 'baz', 1], 'bamboozle', addAction));
        store.dispatch(reduceIn('foo.bar.baz[0]', 'plusTwo', addAction));

        const actual = store.getState();

        const expected = {
            foo: {
                bar: {
                    baz: [3, 'bamboozle']
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

        const actual = store.getState();

        const expected = {
            foo: {
                bar: {
                    baz: [1, 44]
                }
            },
            counter: 9000
        };

        expect(actual).to.eql(expected);
    });

    it('should be able to configure getters / setters', () => {

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
            get(state, path) {
                get_calls++;
                expect(state).to.eql({ foo: {bar: 42}});
                expect(path).to.equal('foo.bar');
                return GET_RETURN;
            },
            set(state, path, new_value) {
                set_calls++;
                expect(state).to.eql({ foo: {bar: 42}});
                expect(path).to.equal('foo.bar');
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

            expect(state).to.eql(GET_RETURN);
            return REDUCER_RETURN;
        }

        expect(get_calls).to.eql(0);
        expect(set_calls).to.eql(0);

        __store.dispatch(reduceIn('foo.bar', probe, action));

        const actual = __store.getState();
        expect(actual).to.eql(SET_RETURN);

        expect(get_calls).to.eql(1);
        expect(set_calls).to.eql(1);

    });
});
