const _ = require('lodash');

// re-implement relevant ramda (https://github.com/ramda/ramda) functions using lodash

// refs: https://medium.com/@dtipson/functional-lenses-d1aba9e52254

// path :: P -> R -> T
//
// P := path
// R := root
// T := value_at_path
// https://github.com/ramda/ramda/blob/v0.23.0/src/path.js
const path = _.curry(function(path, root) {
    path = _.isArray(path) ? path : _.toPath(path);
    return _.get(root, path);
}, 2);

// assoc ::  K -> T -> R -> R'
//
// K := key
// T := newValye
// R := root
// R' := newRoot
// https://github.com/ramda/ramda/blob/v0.23.0/src/assoc.js
const assoc = _.curry(function(key, newValue, root) {
    // shallow clone
    const result = _.clone(root);
    result[key] = newValue;
    return result;
}, 3);

// assocPath :: P -> T -> R -> R'
//
// P := path
// T := newValue
// R := root
// R' := newRoot
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

// mapWith :: Functor f => G -> xs -> f U
//
// G := T -> U
// T := value
// U := nextValue
// xs := f T (note: Functor of type T)
// f T := Functor<T>
// f U := Functor<U>
//
// Functor<T>: {
//     value: T,
//     map: mapf -> Functor<U>
// }
// mapf :: T -> U
const mapWith = _.curry((G, xs) => xs.map(G), 2);

// lens :: Functor f => getter -> setter -> P -> intoFunctor -> R -> f U
// getter :: P -> R -> T
// setter :: P -> U -> R -> R'
// intoFunctor :: Functor f => T -> f T
//
// P := path
// R := root
// T := value_at_path
// U := newValue
// R' := newRoot
// f T := Functor<T>
// f U := Functor<U>
const lens = _.curry((getter, setter, path, intoFunctor, root) => {
    return mapWith(replacement => setter(path, replacement, root), intoFunctor(getter(path, root)));
}, 5);

// lensPath :: Functor f => P -> getter -> setter -> lens
//
// lens :: Functor f => intoFunctor -> R -> f U
// getter :: P -> R -> T (default to path function)
// setter :: P -> U -> R -> R' (default ot assocPath function)
// intoFunctor :: Functor f => T -> f T
//
// P := path
// R := root
// T := value_at_path
// U := newValue
// R' := newRoot
// f T := Functor<T>
// f U := Functor<U>
const lensPath = _.curry(function(__path, getter = path, setter = assocPath) {
    return lens(getter, setter, __path);
}, 1);

// Identity :: Functor f => T -> f T
// mapf :: T -> U
// map :: Functor f => mapf -> f U
const Identity = x => ({value: x, map: (mapf) => Identity(mapf(x)) });

// Const :: Functor f => T -> f T
// map :: Functor f => _ -> f T
const Const = x => ({value: x, map(){ return this; }});

// This is a K Combinator
// _K :: T -> _ -> T
const _K = x => _ => x;

// over :: lens -> transform -> R -> R'
// lens :: Functor f => intoFunctor -> R -> f R'
// intoFunctor :: Functor f => U -> f U
// transform :: T -> U
//
// P := path
// R := root
// R' := newRoot
// T := value_at_path
// U := newValue
// f R' := Functor<R'>
// f U := Functor<U>
const over = _.curry((lens, transform, root) => {
    return lens(y => Identity(transform(y)), root).value;
}, 3);

// view :: lens -> R -> T
// lens :: Functor f => intoFunctor -> R -> f T
// intoFunctor :: Functor f => U -> f T
//
// T := value_at_path
// R := root
// f T := Functor<T>
// f U := Functor<U>
const view = _.curry((lens, root) => {
    return lens(Const, root).value;
}, 2);


// set :: lens -> U -> R -> R'
// lens :: Functor f => intoFunctor -> R -> f R'
// intoFunctor :: Functor f => T -> f U
//
// R := root
// R' := newRoot
// U := newValue
// f U := Functor<U>
// f R' := Functor<R'>
const set = _.curry((lens, newValue, root) => {
    return over(lens, _K(newValue), root);
}, 3);

module.exports = {
    view,
    set,
    lensPath
};
