define(function () {
    /**
     * Copies all the properties of source into target.
     * @param {Object} target
     * @param {Object} source
     * @return {Object} extended target
     */
    var merge = function (target, source) {
        for (var prop in source) {
            if (source.hasOwnProperty(prop)) {
                target[prop] = source[prop];
            }
        }

        return target;
    };


    /**
     * Returns a shallow-copied clone of the object. Any nested objects or arrays will be copied by reference, not
     * duplicated
     * @param {Object} object
     * @return {*}
     */
    var clone = function (object) {
        return merge({}, object);
    };


    /**
     * Logs the text into a browser console.
     * @param {String} text
     * @param {String} [level="log"] A name of console method to log, such as "log", "warn", "error" or "info"
     */
    var log = function (text, level) {
        if (console) console[level || 'log']('Ofio: ' + text);
    };


    var ParentClass = function(){};
    ParentClass.prototype.init = function () {};

    var checkSuper = /xyz/.test(function(){return "xyz";}) ? /\b_super\b/ : /.*/;

    var extend = function (options, proto) {
        if (proto === undefined) {
            proto = options;
            options = {};
        }
        else {
            options = options || {};
        }

        if (typeof options.extend != 'function') {
            options.extend = this === Ofio ? ParentClass : this;
        }
        var newClass = new Ofio(options),
            childProto = newClass.prototype,
            parentProto = options.extend.prototype;

        for (var propName in proto) {
            if (!proto.hasOwnProperty(propName)) {
                continue;
            }

            var property = proto[propName];
            if (typeof property != 'function' || typeof parentProto[propName] != 'function' || !checkSuper.test(property)) {
                childProto[propName] = proto[propName];
            }

            childProto[propName] = (function(name, fn) {
                var wrapper = function() {
                    var tmp = this._super;

                    // Add a new ._super() method that is the same method
                    // but on the super-class
                    this._super = parentProto[name];

                    // The method only need to be bound temporarily, so we
                    // remove it when we're done executing
                    var ret = fn.apply(this, arguments);
                    this._super = tmp;

                    return ret;
                };
                for (var key in fn) {
                    wrapper[key] = fn[key];
                    delete fn[key];
                }
                return wrapper;
            })(propName, property);
        }

        newClass.extend = extend;
        return newClass;
    };


    /**
     * Ofio is a library that provides good way to write a laconic code. Ofio allows you to separate the code into two
     * different parts. It's classes and modules. Modules is an objects that merges into classes prototypes. It's a place
     * for the code you can use many times in a different classes. You also can take out a code from the files into the
     * modules to reduce the size of big classes.
     *
     * You specify a list of modules when describing a class. Classes can be inherited from another classes. Modules can
     * have dependencies from another modules. Dependencies can be automatically resolved using requirejs library.
     *
     * Both classes and modules can have a special method named "init". It executes when instance is creating.
     * Initialization of modules is before class initialization. "init" is the only method of modules that is never copied
     * into classes prototypes.
     * @class Ofio
     * @param {Object} [params={}] Parameters for new class creation
     * @param {Ofio.Module[]} [params.modules=[]] List of modules for the class
     * @param {Function} [params.extend] Parent class for nesting
     * @return {Function} Created class
     * @constructor
     */
    var Ofio = function (params) {
        params = params || {};

        /**
         * Creating class
         * @type {Function}
         */
        this._newClass = this._createClass();

        /**
         * Parent class
         * @type {Function|null}
         */
        this._parentClass = null;

        /**
         * Modules included into the class
         * @type {Object} keys are modules names, values are {@link Ofio.Module} instances
         */
        this.modules = {};

        /**
         * A hash containing namespaces constructors
         * @type {Object}
         */
        this.namespaces = {};

        /**
         * @type {Object}
         */
        this.included = {};

        this._prepareModules(params.modules);
        this._extend(params.extend);
        this._includeModules();

        return this._newClass;
    };

    Ofio.extend = extend;

    /**
     * @return {Function}
     */
    Ofio.prototype._createClass = function () {
        var self = this;

        var newClass = function (params) {
            Object.defineProperty(this, 'options', {
                enumerable: false,
                configurable: false,
                writable: false,
                value: clone(params)
            });

            return self._initClass(this);
        };

        newClass.ofio = this;
        return newClass;
    };


    Ofio.prototype._prepareModules = function (modules) {
        Array.prototype.forEach.call(modules || [], function (module) {
            if (module instanceof Ofio.Module)
                this.modules[module.config.name] = module;
        }, this);
    };


    Ofio.prototype._extend = function (parent) {
        if (typeof parent != "function") parent = ParentClass;
        this._parentClass = parent;

        var extend = function () {
        };
        extend.prototype = parent.prototype;

        this._newClass.prototype = new extend;
        this._newClass.prototype.constructor = this._newClass;
        this._newClass.parent = parent.prototype;

        if (typeof parent.ofio == 'object') {
            this.modules = merge(clone(parent.ofio.modules), this.modules);
            this.namespaces = clone(parent.ofio.namespaces);
        }
    };


    Ofio.prototype._includeModules = function (modules) {
        modules = modules || this.modules;
        var included = this.included;
        var parentOfio = this._parentClass && this._parentClass.ofio;
        var parentIncluded = parentOfio && parentOfio.modules || {};
        var prototype = this._newClass.prototype;

        for (var name in modules) {
            if (!modules.hasOwnProperty(name) || included[name]) continue;
            included[name] = true;

            var module = this.modules[name] = modules[name];
            this._includeModules(module.config.dependencies);

            if (!parentIncluded[name]) {
                var namespace = module.config.namespace;
                if (namespace) {
                    var NamespaceConstructor = this.namespaces[namespace] = function (instance) {
                        this.parent = instance;
                    };
                    NamespaceConstructor.prototype = module;
                }

                else for (var prop in module) {
                    if (!module.hasOwnProperty(prop) || prop == 'init') continue;
                    if (prototype[prop] !== undefined)
                        log('A property ' + prop + ' has redefined by module ' + module.config.name + '!', 'warn');
                    prototype[prop] = module[prop];
                }
            }

            module.config.onInclude.call(this._newClass.prototype, this._newClass);
        }
    };

    Ofio.prototype._initClass = function (instance) {
        this._initModules(instance);

        return instance.init && instance.init() || instance;
    };

    Ofio.prototype._initModules = function (instance, modules, inited) {
        modules = modules || this.modules;
        inited = inited || {};

        for (var name in modules) {
            if (!modules.hasOwnProperty(name) || inited[name]) continue;
            inited[name] = true;

            var module = modules[ name ];
            this._initModules(instance, module.config.dependencies, inited);

            var context = instance;

            var namespace = module.config.namespace;
            if (namespace)
                context = instance[namespace] = new this.namespaces[namespace](instance);

            module.init.call(context);
        }
    };


    var Module = Ofio.Module = new Ofio;

    Module.prototype.init = function () {
        Object.defineProperty(this, "config", {
            enumerable: false,
            configurable: false,
            writable: false,
            value: {
                name: '',
                dependencies: {},
                namespace: '',
                onInclude: function () {
                }
            }
        });

        merge(this.config, this.options);

        var dependencies = {};
        Array.prototype.forEach.call(this.config.dependencies || [], function (module) {
            if (module instanceof Ofio.Module)
                dependencies[module.config.name] = module;
        });

        this.config.dependencies = dependencies;
    };

    return Ofio;
});