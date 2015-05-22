var Webcast = require('webcast-osx-audio');
var Client = require('castv2-client').Client;
var DefaultMediaReceiver = require('castv2-client').DefaultMediaReceiver;
var mdns = require('mdns');

var Chromecast = function(options) {
  var self = this;
  var browser = mdns.createBrowser(mdns.tcp('googlecast'));

  this.cs = {
    IDLE: 1,
    SETUP: 2,
    CASTING: 3,
    DESTROY: 4
  }
  this.currentCS = this.cs.IDLE;
  this.options = options;
  this.devices = [];
  this.deviceListUpdateCallback = function(l){};
  this.displayChangeCallback = function(s){};

  browser.on('serviceUp', function(service) {

    self.devices.push(service);
    self.deviceListUpdateCallback(self.devices);
    self.displayChangeCallback('ready');
    browser.stop();
  });

  browser.start();

  this.webcast = new Webcast(this.options);
  this.player = null;
}

Chromecast.prototype.onDeviceListUpdate = function(fn) {
	this.deviceListUpdateCallback = fn;
};

Chromecast.prototype.onDisplayChange = function(fn) {
	this.displayChangeCallback = fn;
};

Chromecast.prototype.connect = function(name, host) {

	var self = this;

  if (this.currentCS !== this.cs.IDLE) {
    console.error('already connected..');
    this.displayChangeCallback('error');
    return;
  }
  this.currentCS = this.cs.SETUP;
  this.displayChangeCallback('connecting');

  this.client = new Client();

  this.client.connect(host, function() {

    self.displayChangeCallback('setting up');

    self.client.launch(DefaultMediaReceiver, function(err, player) {
      if (err) {
        console.error('Error: %s', err.message);
        self.client.close();
        return;
      }

      self.currentCS = self.cs.CASTING;

      self.player = player;

      self.displayChangeCallback('starting player');

      var media = {

        contentId: 'http://' + self.webcast.ip + ':' + self.options.port + '/' + self.options.url,
        contentType: 'audio/mpeg3',
        streamType: 'LIVE', // or LIVE

        // Title and cover displayed while buffering
        metadata: {
          type: 0,
          metadataType: 0,
          title: self.options.name 
        }        
      };

      player.on('status', function(status) {
        self.displayChangeCallback(status.playerState);
      });

      //console.log('app "%s" launched, loading media %s ...', player.session.displayName, media.contentId);

      player.load(media, { autoplay: true }, function(err, status) {
        if (err) {
          console.error('Error: %s', err.message);
          self.client.close();
          return;
        }
        //console.log('media loaded playerState=%s', status.playerState);
      });

    });
  });

  this.client.on('error', function(err) {
    console.error('Error: %s', err.message);
    self.client.close();
    self.displayChangeCallback('error');
  });

  this.client.on('close', function() {
    self.disconnect();
  });

  this.client.on('message', function(message) {
    
    if (message && message.payload) {
      var payload = JSON.parse(message.payload);

      if (payload.type === "CLOSE") {

        self && self.disconnect();
      }
    }
  });
}

Chromecast.prototype.disconnect = function() {

  if (this.currentCS !== this.cs.CASTING) {
    return;
  } 

  var self = this;
  this.currentCS = this.cs.DESTROY;
  this.displayChangeCallback('closing');

  this.client.stop(self.player, function(arg) {
    self.client.close();
    self.cleanup();
  });
}

Chromecast.prototype.cleanup = function() {
  var self = this;

  this.displayChangeCallback('connection closed');
  this.currentCS = this.cs.IDLE;

  setTimeout(function(){
    self.displayChangeCallback('ready');
  }, 1000);
};


module.exports = Chromecast;