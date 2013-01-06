define(function(){
  Object.extend = function(obj1, obj2){
    for (var prop in obj2) {
      obj1[ prop ] = obj2[ prop ];
    }

    return obj1;
  };

  Object.merge = function(obj1, obj2){
    var res = Object.extend({}, obj1);
    return Object.extend(res, obj2);
  };


  var log = function (text, level) {
    if (console) console[level || 'log']('Ofio: ' + text);
  };


  var Ofio = function(params){
    params = params || {};

    this.new_class = this.create_class();
    this.modules = {};
    this.namespaces = {};
    this.included = {};

    this.prepare_modules(params.modules);
    this.extend(params.extend);
    this.include_modules();

    return this.new_class;
  };


  Ofio.prototype.create_class = function(){
    var ofio = this;

    var new_class = function(params){
      Object.defineProperty(this, 'options', {
        enumerable   : false,
        configurable : false,
        writable     : false,
        value        : Object.merge(params)
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


  Ofio.prototype.extend = function(extend){
    if (typeof extend != "function") return;

    this.new_class.prototype = extend.prototype;
    this.new_class.prototype.constructor = this.new_class;
    this.new_class.parent = extend.prototype;

    if (typeof extend.ofio == 'object') {
      this.modules = Object.merge(extend.ofio.modules, this.modules);
      this.namespaces = extend.ofio.namespaces;
    }
  };


  Ofio.prototype.include_modules = function(modules){
    modules = modules || this.modules;
    var included = this.included;

    for (var name in modules) {
      if (included[name]) continue;
      included[name] = true;

      var module = modules[name];
      this.include_modules(module.config.dependencies);

      var extended = this.new_class.prototype;
      if (module.config.namespace) {
        var namespace_constructor = this.namespaces[module.config.namespace] = function(instance){
          this.parent = instance;
        };
        extended = namespace_constructor.prototype;
      }

      for (var prop in module) {
        if (prop == 'init') continue;
        if (extended[prop] !== undefined) {
          log('A property ' + prop + ' has redefined by module ' + module.config.name + '!', 'warn');
        }
        extended[prop] = module[prop];
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

    Object.extend(this.config, this.options);

    var dependencies = {};
    Array.prototype.forEach.call(this.config.dependencies || [], function(module){
      if (module instanceof Ofio.Module)
        dependencies[module.config.name] = module;
    });

    this.config.dependencies = dependencies;
  };

  return Ofio;
});