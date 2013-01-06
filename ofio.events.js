define(['ofio/ofio'], function(Ofio){
  var listeners_by_id = {};
  var id = 0;

  var class_on = function(event, listener){
    var listeners;
    if (!this.listeners[event])
      listeners = this.listeners[event] = {};
    else
      listeners = this.listeners[event];

    listeners[id] = listener;
    listeners_by_id[id] = listeners;

    return id++;
  };


  //todo: parents
  var class_emit = function(event){
    var listeners = this.listeners[ event ];
    if (!listeners) return;

    var args = Array.prototype.slice.call(arguments, 1);

    for (var id in listeners) {
      listeners[ id ].apply(this, args);
    }
  };


  var on_include = function(clazz){
    clazz.listeners = {};
    clazz.on = class_on;
    clazz.emit = class_emit;
  };

  //todo: remove listener for classes
  var module = new Ofio.Module({
    name         : 'ofio.events',
    on_include   : on_include
  });

  module.init = function(){
    this.__listeners = {};
  };


  module.on = function(event, listener){
    var listeners;

    if (typeof listener != "function")
      throw new Error('Second argument must be a function');

    if (!this.__listeners[event])
      listeners = this.__listeners[event] = {};
    else
      listeners = this.__listeners[event];

    listeners[ id ] = listener;
    listeners_by_id[ id ] = listeners;

    return id++;
  };


  module.emit = function(event){
    var args = Array.prototype.slice.call(arguments, 1);

    var listeners = this.__listeners[event];
    for (var id in listeners) {
      listeners[id].apply(this, args);
    }

    args.unshift(event, this);

    var parent = this;
    while (parent) {
      if (!parent.emit) break;
      parent.constructor.emit.apply(parent.constructor, args);
      parent = parent.parent;
    }
  };


  module.remove_listener = function(id){
    var listeners = listeners_by_id[ id ];
    if (!listeners) return false;

    delete listeners[ id ];
  };

  return module;
});
