define(['ofio/ofio', 'ofio/ofio.id', 'ofio/ofio.logger', 'vendor/jquery.min'], function (Ofio) {
  var module = new Ofio.Module({
    name: 'ofio.jquery',
    dependencies: arguments
  });

  var event_splitter = /^(\S+)\s*(.*)$/;


  module.init = function () {
    if (!this.options.$el && !this.options.el)
      this.$el = $(this.render());
    else
      this.$el = this.options.$el || $(this.options.el);

    this.el = this.$el[0];
    if (!this.el) this.log('`el` is undefined', 'warn', module);

    this.delegate_events();
  };


  module.$ = function () {
    return this.$el.find.apply(this.$el, arguments);
  };


  module.render = function () {
    return '';
  };


  module.delegate_events = function (events) {
    events = events || (typeof this.events == 'function' ? this.events() : this.events);
    if (!events) return;

    this.undelegate_events();
    for (var key in events) {
      var method = events[key];
      if (typeof method == 'string')
        method = this[method];

      if (typeof method != 'function')
        throw new Error('Method "' + key + '" does not exist');

      var match = key.match(event_splitter);
      var event_name = match[1];
      var selector = match[2];

      method = method.bind(this);
      event_name += '.delegate_events' + this.id;

      if (selector === '')
        this.$el.on(event_name, method);
      else if (selector == 'window')
        $(window).on(event_name, method);
      else if (selector == 'document')
        $(document).on(event_name, method);
      else
        this.$el.on(event_name, selector, method);
    }
  };


  module.undelegate_events = function () {
    this.$el.off('.delegate_events' + this.id);
  };


  return module;
});