define(['ofio/ofio'], function (Ofio, versions) {
  var module = new Ofio.Module({
    name         : 'ofio.idb',
    namespace    : 'idb'
  });


  module.init = function(){
    this.db = null;

    this.init_indexed_db();
    this.init_db();
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
    var db_config = this.parent.db;
    var request = indexedDB.open(db_config.name, db_config.version);
    var self = this;

    request.onerror = function(event) {
      console.error(event);
    };

    request.onsuccess = function(event) {
      console.log('uc');
      self.db = event.target;
    };

    request.onupgradeneeded = this.upgrade_db.bind(this);
  };


  module.upgrade_db = function(event){
    console.log('up');
  };


  module.create_base = function (name) {

  };

  return module;
});