define(['ofio/ofio'], function (Ofio) {
  var module = new Ofio.Module({
    name         : 'ofio.idb',
    namespace    : 'idb'
  });


//  module.init = function(){
//    this.id = id++;
//  };

  module.equal = function (instance) {
    return instance && this.id === instance.id;
  };

  return module;
});