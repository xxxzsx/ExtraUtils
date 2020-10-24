// Object utils

Object.prototype.toArray = function () {
    return Array.from(this)
}

Object.prototype.getOwnProperties = function (excluding = []) {
    return Object.fromEntries(Object.getOwnPropertyNames(this)
        .filter(property => !excluding.includes(property))
        .map(property => [property, this[property]]))
}

Object.prototype.addProperties = function (properties, rewrite = false) {
    if (Array.isArray(properties))
        properties = Object.assign(...properties)

    for (const [key, value] of Object.entries(properties)) {
        if (!this.hasOwnProperty(key) || rewrite)
            this[key] = value
    }
}

Object.prototype.getClass = function () {
    return this.hasOwnProperty('prototype') ?
        this : // is a class
        this.constructor // is an instance
}

Object.prototype.getStaticMethods = function () {
    const objectClass = this.getClass()
    return objectClass.getOwnProperties(['length', 'prototype', 'name'])
}

Object.prototype.getNonStaticMethods = function () {
    const objectClass = this.getClass()
    return objectClass.prototype.getOwnProperties(['constructor'])
}

Object.prototype.getAttributes = function () {
    const objectClass = this.getClass()
    return (new objectClass()).getOwnProperties()
}

Object.prototype.addStaticMethods = function (methods, rewrite = false) {
    const objectClass = this.getClass()
    objectClass.prototype.addProperties(methods, rewrite)
}

Object.prototype.addNonStaticMethods = function (methods, rewrite = false) {
    this.prototype.addProperties(methods, rewrite)
}

Object.prototype.addAttributes = function (attributes, rewrite = false) {
    const objectClass = this.getClass()
    objectClass.prototype.addProperties(attributes, rewrite)
}

Object.prototype.inbuild = function (target = Object.getPrototypeOf(this.getClass())) {
    target.addStaticMethods(this.getStaticMethods())
    target.addNonStaticMethods(this.getNonStaticMethods())
    target.addAttributes(this.getAttributes())
}


// Array utils

Object.defineProperty(Array.prototype, 'last', {
    get() {
        return this[this.length - 1]
    },
    set(value) {
        return this[this.length - 1] = value
    }
})


// String utils

String.prototype.escapeCharAt = function (index = 0) {
    const hex = this
        .charCodeAt(index)
        .toString(16)

    return hex.length <= 2 ? `\\x${hex.padStart(2, '0')}` :
        hex.length <= 4 ? `\\u${hex.padStart(4, '0')}` :
        `\\u{${hex}}`
}

String.prototype._getFilter = function (needle, except = true) {
    const _filter =
        needle instanceof Function ? needle :
        needle instanceof RegExp ? char => needle.test(char) :
        char => !!~String(needle).indexOf(char)

    return char => !(!except ^ _filter(char))
}

String.prototype.escape = function (needle = '', except = true) {
    const filter = this._getFilter(...arguments)

    return this.replace(/./g, char => filter(char) ? char.escapeCharAt(0) : char)
}

String.prototype.unescape = function (needle = '', except = true) {
    const filter = this._getFilter(...arguments)

    return this.replace(
        /\\x([\da-f]{2})|\\u([\da-f]{4})/gi,
        (x, charHex2, charHex4) => {
            const charHex = charHex2 || charHex4
            const char = String.fromCharCode(parseInt(charHex, 16))

            return filter(char) ? char : x
        }
    )
}

String.prototype.replaceAll = function (needle, replacer) {
    return this.replace(RegExp(needle.escape(), 'gm'), replacer)
}

String.prototype.replaceAllByList = function (array, replacer, splitReplacer = true) {
    if (!Array.isArray(array))
        array = String(array).split('')

    if (!Array.isArray(replacer) && !(replacer instanceof Function) && splitReplacer)
        replacer = String(replacer).split('')

    return array.reduce((string, needle, index) =>
        string.replaceAll(needle, Array.isArray(replacer) ? replacer[index] : replacer), this)
}
