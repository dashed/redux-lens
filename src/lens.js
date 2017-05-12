const _ = require('lodash');

// re-implement relevant ramda (https://github.com/ramda/ramda) functions using lodash

// refs: https://medium.com/@dtipson/functional-lenses-d1aba9e52254

// https://github.com/ramda/ramda/blob/v0.23.0/src/path.js
const path = _.curry(function(path, root) {
    return _.get(root, _.toPath(path));
}, 2);

// https://github.com/ramda/ramda/blob/v0.23.0/src/assoc.js
const assoc = _.curry(function(prop, value, root) {
    // shallow clone
    const result = _.clone(root);
    result[prop] = value;
    return result;
}, 3);

// https://github.com/ramda/ramda/blob/v0.23.0/src/assocPath.js
const assocPath = _.curry(function(path, value, root) {

    path = _.toPath(path);

    if(path.length === 0) {
        return value;
    }

    const next_key = path[0];

    if (path.length > 1) {

        const sub_root = _.has(next_key, root) ? root[next_key] :
            _.isInteger(path[1]) ? [] : {};

        value = assocPath(Array.prototype.slice.call(path, 1), value, sub_root);
    }

    if (_.isInteger(next_key) && _.isArray(root)) {
        const arr = [].concat(root);
        arr[next_key] = value;
        return arr;
    } else {
        return assoc(next_key, value, root);
    }

}, 3);

const mapWith = _.curry((f, xs) => xs.map(f), 2);

const lens = _.curry((getter, setter, path, transform, root) => {
    return mapWith(replacement => setter(path, replacement, root), transform(getter(path, root)));
}, 5);

const lensPath = _.curry(function(__path) {
    return lens(path, assocPath, __path);
}, 1);

const Identity = x => ({value: x, map: (mapf) => Identity(mapf(x)) });
const Const = x => ({value: x, map(){ return this; }});
//K Combinator!
const _K = x => _ => x;

const over = _.curry((lens, transform, targetData) => {
    return lens(y => Identity(transform(y)))(targetData).value;
}, 3);

const view = _.curry((lens, targetData) => {
    return lens(Const)(targetData).value;
}, 2);

const set = _.curry((lens, val, targetData) => {
    return over(lens, _K(val), targetData);
}, 3);

module.exports = {
    view,
    set,
    lensPath
};
