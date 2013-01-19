define(['ofio/ofio', 'vendor/underscore', 'ofio/ofio.id', 'ofio/ofio.events'], function (Ofio) {
  var module = new Ofio.Module({
    name         : 'ofio.model',
    dependencies : arguments
  });

  module.init = function(){
    init_attributes.call(this);
  };

  module.create_attribute = function(attr, value){
    if (value === undefined) value = null;

    Object.defineProperty(this, attr, {
      set : function (v) {
        if (v !== value) {
          value = v;
          this.emit('change:' + attr);
          this.emit('change');
        }
      },
      get : function () {
        return value;
      }
    })
  };

  var init_attributes = function () {
    var attributes = Object.create(this);
    this.attributes.call(attributes);
    _.extend(attributes, this.options);

    Object.keys(attributes).forEach(function (attr) {
      this.create_attribute(attr, attributes[attr]);
    }, this);
  };



  return module;
});