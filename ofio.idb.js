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
    console.log('ready');
    this.db = event.target.result;
    this.parent.emit('idb_ready');
  };


  module.upgrade_db = function(event){
    console.log('upgrade', event.oldVersion);
    this.db = event.target.result;

    var versions = this.db_config.versions[this.db_config.name];
    for(var i = event.oldVersion + 1; i <= event.newVersion; i++)
      versions[i] && versions[i](this);
  };


  module.create_store = function (name, options) {
    console.log('creating', name);
    this.db.createObjectStore.apply(this.db, arguments);
  };


  module.remove_db = function(callback){
    console.log('removing');
    var request = indexedDB.deleteDatabase(this.db_config.name);
    request.onsuccess = callback;
    return request;
  };


  module.add = function(table, record, callback){
    var store = this.db.transaction(table, 'readwrite').objectStore(table);
    var request = store.add(record);
    request.onsuccess = callback;
    return request;
  };


  module.get_all = function(table, callback){
    var records = [];
    var store = this.db.transaction(table).objectStore(table);

    store.openCursor().onsuccess = function(event) {
      var cursor = event.target.result;
      if (cursor) {
        records.push(cursor.value);
        cursor.continue();
      }
      else {
        callback(records);
      }
    };
  };

  return module;
});