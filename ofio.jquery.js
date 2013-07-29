define(['ofio/ofio', 'ofio/ofio.id', 'ofio/ofio.logger', 'jquery'], function (Ofio) {
    var module = new Ofio.Module({
        name: 'ofio.jquery',
        dependencies: arguments
    });

    var event_splitter = /^(\S+)\s*(.*)$/;


    module._init = function () {
        if (!this._options.$el && !this._options.el)
            this.$el = $(this.render());
        else
            this.$el = this._options.$el || $(this._options.el);

        this.el = this.$el[0];
        if (!this.el) this.log('`el` is undefined', 'warn', module);

        this._delegate_events();
    };


    module.$ = function () {
        return this.$el.find.apply(this.$el, arguments);
    };


    module.render = function () {
        return '';
    };


    module._delegate_events = function (events) {
        events = events || this._events();
        if (!events) return;

        for (var key in events) {
            if (!events.hasOwnProperty(key)) {
                continue;
            }

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


    module._events = function(){
        return null;
    }


    module._undelegate_events = function () {
        this.$el.off('.delegate_events' + this.id);
    };


    return module;
});