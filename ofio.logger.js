define(['ofio/ofio'], function (Ofio) {
  if (!window.console) {
    var stub = function () {
      return arguments;
    };

    window.console = {
      error: stub,
      log: stub,
      info: stub,
      warn: stub,
      trace: stub,
      group: stub,
      groupEnd: stub
    };
  }

  var module = new Ofio.Module({
    name: 'ofio.logger'
  });

  module.log = function (text, level, module) {
    if (module) {
      text = '[Module: ' + module.config.name + '] ' + text;
    }
    console[level || 'log'].call(console, text);
  };

  return module;
});