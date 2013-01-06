define(['ofio/ofio'], function (Ofio) {
  var functions = [];

  Function.prototype.private = function () {
    var self = this;
    var f = function () {
      self.call(this.context);
    };

    functions.push(f);
    return function () {
      get_function(self)();
    };
  };

  var get_function = function(f){
    return f;
  };

  var module = new Ofio.Module({
    name         : 'ofio.private',
    dependencies : arguments,
    on_include   : function (clazz) {
      clazz.private_functions = functions = [];
    }
  });

  module.init = function(){
    var self = this;
    get_function = function (f) {
      return f.bind(self);
    }
  };

  return module;
});