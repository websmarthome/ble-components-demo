(function(){

  window.BLEBridgeSetting = (function(){
    var klass = function(uuid, listener) {
      this.initialize(uuid, listener); 
    };  
    (function(){
      this.initialize = function(uuid, listener) {
        this.service = uuid.toUpperCase();
        this.stateListener = listener;
        this.observeDestinations = [];
        this.writeDestinations = [];
      };
      this.addObserveDestination = function(uuid, listener) {
        this.observeDestinations.push([uuid.toUpperCase(), listener]);
      };
      this.addWriteDestination = function(uuid) {
        this.writeDestinations.push(uuid.toUpperCase());
      };
    }).apply(klass.prototype);
    return klass;
  })();

  var BLEBridge = (function(){

    var BRIDGE_NS_CONNECT = "ble.connect";
    var BRIDGE_NS_OBSERVE = "ble.observe";
    var BRIDGE_NS_SEND    = "ble.send";
    var BRIDGE_NS_UPDATE  = "ble.update";
    var BRIDGE_NS_CONNECTION_STATE = "ble.connection.state";

    var klass = function(){
      this.initialize();
    }; 

    (function(){

      this.initialize = function() {
        this._setupListeners();
      };

      this._setupListeners = function() {
        this.listeners = {};
        this._setupUpdateListener();
        this._setupConnectionStateChangeListener();
      };

      this._setupUpdateListener = function() {
        var self = this;
        this.listeners[BRIDGE_NS_UPDATE] = {};
        WebBridge.observe(BRIDGE_NS_UPDATE, function(notification){
          if (notification.params && "uuid" in notification.params && "value" in notification.params) {
            var uuid = notification.params.uuid.toUpperCase();
            var value = notification.params.value;
            var callback = self.listeners[BRIDGE_NS_UPDATE][uuid];
            if (callback) {
              callback(uuid, value);
            }
          }
        });
      };

      this._setupConnectionStateChangeListener = function() {
        var self = this;
        this.listeners[BRIDGE_NS_CONNECTION_STATE] = {};
        WebBridge.observe(BRIDGE_NS_CONNECTION_STATE, function(notification){
          if (notification.params && "uuid" in notification.params && "state" in notification.params) {
            var uuid = notification.params.uuid.toUpperCase();
            var state = notification.params.state;
            var callback = self.listeners[BRIDGE_NS_CONNECTION_STATE][uuid];
            if (callback) {
              callback(uuid, state);
            }
          }
        });
      };

      this.send = function(uuid, value) {
        // FIXME type should be indicated
        WebBridge.call(BRIDGE_NS_SEND, {
          "uuid": uuid,
          "value": value
        });
      };

      this.connect = function(setting) {
        var observeDestinations = [];
        for (var i = 0; i < setting.observeDestinations.length; i++) {
          var ch = setting.observeDestinations[i];
          var uuid = ch[0];
          var listener = ch[1];
          observeDestinations.push(uuid);
          this.listeners[BRIDGE_NS_UPDATE][uuid] = listener;
        }
        WebBridge.call(BRIDGE_NS_CONNECT, {
          "uuid": setting.service,
          "observe": observeDestinations,
          "write": setting.writeDestinations
        });
        this.listeners[BRIDGE_NS_CONNECTION_STATE][setting.service] = setting.stateListener;
      };
    }).apply(klass.prototype);

    return klass;

  })();

  window.BLEBridge = new BLEBridge();

})();
