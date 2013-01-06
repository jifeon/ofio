define(['ofio/ofio'], function (Ofio) {
  var module = new Ofio.Module({
    name         : 'ofio.id'
  });

  var id = 0;

  module.init = function(){
    this.id = id++;
  };

  module.equal = function (instance) {
    return instance && this.id === instance.id;
  };

  return module;
});