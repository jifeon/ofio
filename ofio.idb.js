define(['ofio/ofio', 'ofio/ofio.events'], function (Ofio) {
  var module = new Ofio.Module({
    name         : 'ofio.idb',
    namespace    : 'idb',
    dependencies : arguments
  });


  module.init = function(){
    this.db = null;
    this.db_config = this.parent.db;

    this.init_indexed_db();

    this.remove_db(this.init_db.bind(this));
  };


  module.init_indexed_db = function(){
    window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
    window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
    window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;

    if (!window.indexedDB) {
      window.alert("Your browser doesn't support a stable version of IndexedDB.")
    }
  };


  module.init_db = function(){
    var db = this.db_config;
    var request = indexedDB.open(db.name, db.version);

    request.onerror = function(event) {
      console.error(event);
    };

    request.onsuccess = this.ready.bind(this);

    request.onupgradeneeded = this.upgrade_db.bind(this);
  };


  module.ready = function(event){
    this.db = event.target.result;
    this.parent.emit('idb_ready');
  };


  module.upgrade_db = function(event){
    this.db = event.target.result;

    var versions = this.db_config.versions;
    for(var i = event.oldVersion + 1; i <= event.newVersion; i++)
      versions[i] && versions[i](this);
  };


  module.create_store = function (name, options) {
    this.db.createObjectStore.apply(this.db, arguments);
  };

  module.remove_db = function(callback){
    var request = indexedDB.deleteDatabase(this.db_config.name);
    request.onsuccess = callback;
    return request;
  };

  return module;
});