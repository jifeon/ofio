define([
  'ofio/ofio',
  'ofio/ofio.jquery',
  'ofio/ofio.events',
  'ofio/ofio.logger'
], function (Ofio) {
  var module = new Ofio.Module({
    name         : 'ofio.canvas',
    dependencies : arguments
  });

  var update_canvas = function(){
    var width = this.$el.width();
    var height = this.$el.height();

    if (this.canvas.width != width || this.canvas.height != height) {
      this.canvas.width = width;
      this.canvas.height = height;

      this.emit('ofio.canvas.update');
    }
  };

  module.init = function(){
    if (this.el.tagName.toLowerCase() != 'canvas') {
      this.log('`el` is not a canvas', 'warn', module);
    }

    this.canvas = this.el;

    update_canvas.call(this);

    this.canvas.width = this.$el.width();
    this.canvas.height = this.$el.height();

    this.ctx = this.el.getContext('2d');

    $(window).resize(update_canvas.bind(this));
  };


  module.clear_canvas = function(){
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  };

  return module;
});