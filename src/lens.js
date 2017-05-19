const _ = require('lodash');

// re-implement relevant ramda (https://github.com/ramda/ramda) functions using lodash

// refs: https://medium.com/@dtipson/functional-lenses-d1aba9e52254

// path<P, R, T>: path<P> => root<R> => sub_root<T>
// https://github.com/ramda/ramda/blob/v0.23.0/src/path.js
const path = _.curry(function(path, root) {
    path = _.isArray(path) ? path : _.toPath(path);
    return _.get(root, path);
}, 2);

// assoc<K, T, R>: key<K> => newValue<T> => root<R>
// https://github.com/ramda/ramda/blob/v0.23.0/src/assoc.js
const assoc = _.curry(function(key, newValue, root) {
    // shallow clone
    const result = _.clone(root);
    result[key] = newValue;
    return result;
}, 3);

// assocPath<P, T, R>: path<P> => newValue<T> => root<R> => newRoot<R>
// https://github.com/ramda/ramda/blob/v0.23.0/src/assocPath.js
const assocPath = _.curry(function(path, value, root) {

    path = _.isArray(path) ? path : _.toPath(path);

    if(path.length <= 0) {
        return value;
    }

    const next_key = path[0];

    if (path.length > 1) {

        const sub_root = _.has(root, next_key) ? root[next_key] :
            _.isInteger(path[1]) ? [] : {};

        value = assocPath(Array.prototype.slice.call(path, 1), value, sub_root);
    }

    if (_.isInteger(next_key) && _.isArray(root)) {
        const arr = [].concat(root);
        arr[next_key] = value;
        return arr;
    }

    return assoc(next_key, value, root);

}, 3);

// mapWith<T, U>: f<T, U> => xs<T> => Functor<U>
// f<T, U>: T => U
// xs<T>: Functor<T>
const mapWith = _.curry((f, xs) => xs.map(f), 2);

// lens<P, R, T, U>: getter<P, R, T> => setter<P, U, R> => path<P> => intoFunctor<T, U> => root<R> => Functor<U>
// getter<P, R, T>: path<P> => root<R> => sub_root<T>
// setter<P, U, R>: path<P> => newValue<U> => root<R> => newRoot<R>
// intoFunctor<T, U>: sub_root<T> => Functor<U>
const lens = _.curry((getter, setter, path, intoFunctor, root) => {
    return mapWith(replacement => setter(path, replacement, root), intoFunctor(getter(path, root)));
}, 5);

// lensPath<P, R, T, U>: path<P> => curriedLens<R, T, U>
// lens<P, R, T, U>: getter<P, R, T> => setter<P, U, R> => path<P> => curriedLens<R, T, U>
// curriedLens<R, T, U>: intoFunctor<T, U> => root<R> => Functor<U>
// intoFunctor<T, U>: sub_root<T> => Functor<U>
const lensPath = _.curry(function(__path) {
    return lens(path, assocPath, __path);
}, 1);

// Identity<T, U>: T => FunctorIdentity<T, U>
// FunctorIdentity<T, U>::map: mapf<T, U> => FunctorIdentity<U>
// mapf<T, U>: T => U
const Identity = x => ({value: x, map: (mapf) => Identity(mapf(x)) });

// Const<T, U>: T => FunctorConst<T, U>
// FunctorConst<T, U>::map: U => FunctorConst<T>
const Const = x => ({value: x, map(){ return this; }});
// This is a K Combinator
// _K<T>: T => _ => T
const _K = x => _ => x;

// over: lens<P, R, T, U> => transform<T, U> => root<R> => newRoot<R>
// lens<T, U, R>: intoFunctor<T, U> => root<R> => Functor<U>
// intoFunctor<T, U>: sub_root<T> => Functor<U>
// transform<T ,U>: sub_root<T> => new_sub_root<U>
const over = _.curry((lens, transform, root) => {
    return lens(y => Identity(transform(y)), root).value;
}, 3);

// view<R, T, U>: lens<R, T, U> => root<R> => sub_root<U>
// lens<R, T, U>: intoFunctor<T, U> => root<R> => Functor<U>
// intoFunctor<T, U>: sub_root<T> => Functor<U>
const view = _.curry((lens, root) => {
    return lens(Const, root).value;
}, 2);

// set<R, T, U>: lens<R, T, U> => newValue<U> => root<R> => newRoot<R>
// lens<R, T, U>: intoFunctor<T, U> => root<R> => Functor<U>
// intoFunctor<T, U>: sub_root<T> => Functor<U>
const set = _.curry((lens, newValue, root) => {
    return over(lens, _K(newValue), root);
}, 3);

module.exports = {
    view,
    set,
    lensPath
};
