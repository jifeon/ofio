define(function(){
  /**
   * Copies all the properties of source into target.
   * @param {Object} target
   * @param {Object} source
   * @return {Object} extended target
   */
  var merge = function(target, source){
    for (var prop in source) {
      target[prop] = source[prop];
    }

    return target;
  };


  /**
   * Returns a shallow-copied clone of the object. Any nested objects or arrays will be copied by reference, not
   * duplicated
   * @param {Object} object
   * @return {*}
   */
  var clone = function(object){
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
   * @param {Object} [params={}] Parameters for new class creation
   * @param {Ofio.Module[]} [params.modules=[]] List of modules for the class
   * @param {Function} [params.extend] Parent class for nesting
   * @return {Function} Created class
   * @constructor
   */
  var Ofio = function(params){
    params = params || {};

    /**
     * Creating class
     * @type {Function}
     */
    this.new_class = this.create_class();
    
    /**
     * Parent class
     * @type {Function|null}
     */
    this.parent_class = null;

    /**
     * Modules included into the class
     * @type {Object} keys are modules names, values are {@link Ofio.Module} instances
     */
    this.modules = {};
    
    /**
     * A hash containig namespaces constructors
     * @type {Object}
     */
    this.namespaces = {};
    
    /**
     * 
     * @type {Object}
     */
    this.included = {};

    this.prepare_modules(params.modules);
    this.extend(params.extend);
    this.include_modules();

    this.new_class.prototype.init = function(){};

    return this.new_class;
  };


  /**
   *
   * @return {Function}
   */
  Ofio.prototype.create_class = function(){
    var ofio = this;

    var new_class = function(params){
      Object.defineProperty(this, 'options', {
        enumerable   : false,
        configurable : false,
        writable     : false,
        value        : clone(params)
      });

      return ofio.init_class(this);
    };

    new_class.ofio = this;
    return new_class;
  };


  Ofio.prototype.prepare_modules = function(modules){
    Array.prototype.forEach.call(modules || [], function(module){
      if (module instanceof Ofio.Module)
        this.modules[module.config.name] = module;
    }, this);
  };


  Ofio.prototype.extend = function(parent){
    if (typeof parent != "function") return;
    this.parent_class = parent;

    var extend = function(){};
    extend.prototype = parent.prototype;

    this.new_class.prototype = new extend;
    this.new_class.prototype.constructor = this.new_class;
    this.new_class.parent = parent.prototype;

    if (typeof parent.ofio == 'object') {
      this.modules = merge(clone(parent.ofio.modules), this.modules);
      this.namespaces = clone(parent.ofio.namespaces);
    }
  };


  Ofio.prototype.include_modules = function(modules){
    modules = modules || this.modules;
    var included = this.included;
    var parent_ofio = this.parent_class && this.parent_class.ofio;
    var parent_included = parent_ofio && parent_ofio.modules || {};
    var prototype = this.new_class.prototype;

    for (var name in modules) {
      if (included[name]) continue;
      included[name] = true;

      var module = this.modules[name] = modules[name];
      this.include_modules(module.config.dependencies);

      if (!parent_included[name]) {
        var namespace = module.config.namespace;
        if (namespace) {
          var namespace_constructor = this.namespaces[namespace] = function(instance){
            this.parent = instance;
          };
          namespace_constructor.prototype = module;
        }

        else for (var prop in module) {
          if (prop == 'init') continue;
          if (prototype[prop] !== undefined)
            log('A property ' + prop + ' has redefined by module ' + module.config.name + '!', 'warn');
          prototype[prop] = module[prop];
        }
      }

      module.config.on_include.call(this.new_class.prototype, this.new_class);
    }
  };

  Ofio.prototype.init_class = function(instance){
    this.init_modules(instance);

    return instance.init && instance.init() || instance;
  };

  Ofio.prototype.init_modules = function(instance, modules, inited){
    modules = modules || this.modules;
    inited = inited || {};

    for (var name in modules) {
      if (inited[name]) continue;
      inited[name] = true;

      var module = modules[ name ];
      this.init_modules(instance, module.config.dependencies, inited);

      var context = instance;

      var namespace = module.config.namespace;
      if (namespace)
        context = instance[namespace] = new this.namespaces[namespace](instance);

      module.init.call(context);
    }
  };


  var Module = Ofio.Module = new Ofio;

  Module.prototype.init = function(){
    Object.defineProperty(this, "config", {
      enumerable   : false,
      configurable : false,
      writable     : false,
      value        : {
        name         : '',
        dependencies : {},
        namespace    : '',
        on_include   : function(){
        }
      }
    });

    merge(this.config, this.options);

    var dependencies = {};
    Array.prototype.forEach.call(this.config.dependencies || [], function(module){
      if (module instanceof Ofio.Module)
        dependencies[module.config.name] = module;
    });

    this.config.dependencies = dependencies;
  };

  return Ofio;
});