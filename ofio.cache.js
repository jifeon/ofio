/**
 *
 * @return {Function}
 */
Function.prototype.cache = function () {
  this.cacheable = true;
  return this;
};

Function.prototype.once = function(){
  var res;
  var self = this;
  var f = function() {
    if (f.ran) return res;
    f.ran = true;
    res = self.apply(this, arguments);
    return res;
  };

  return f;
};

Function.prototype.reset_cache = function () {
  this.ran = false;
};

define(['ofio/ofio'], function (Ofio) {
  var module = new Ofio.Module({
    name         : 'ofio.cache',
    dependencies : arguments
  });

  module.init = function(){
    for (var key in this) {
      var f = this[key];
      if (typeof f != 'function' || !f.cacheable) continue;
      this[key] = this[key].once();
    }
  };

  module.reset_cache = function(){
    for (var key in this) {
      var f = this[key];
      if (typeof f != 'function' || !f.reset_cache) continue;
      this[key].reset_cache();
    }
  };

  return module;
});