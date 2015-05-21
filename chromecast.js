var Webcast = require('webcast-osx-audio');
var Client = require('castv2-client').Client;
var DefaultMediaReceiver = require('castv2-client').DefaultMediaReceiver;
var mdns = require('mdns');

var Chromecast = function(options) {
  var self = this;
  var browser = mdns.createBrowser(mdns.tcp('googlecast'));

  this.deviceFound = false;
  this.options = options;
  this.devices = [];
  this.deviceListUpdateCallback = function(l){};
  this.statusChangeCallback = function(s){};

  browser.on('serviceUp', function(service) {
    self.devices.push(service);
    self.deviceListUpdateCallback(self.devices);
    browser.stop();
  });

  browser.start();
}

Chromecast.prototype.onDeviceListUpdate = function(fn) {
	this.deviceListUpdateCallback = fn;
};

Chromecast.prototype.onStatusChange = function(fn) {
	this.statusChangeCallback = fn;
};

Chromecast.prototype.connect = function(name, host) {

	var self = this;

    // don't try and start more than one connection (will fail if multiple devices are found)
    if (this.deviceFound) {
      return;
    }
    this.deviceFound = true;

    console.log("Connecting to device '%s'", name);
    var client = new Client();

    client.connect(host, function() {
      console.log('connected, launching app ...');

      self.statusChangeCallback('connected', name);

      var webcast = new Webcast(self.options);

      client.launch(DefaultMediaReceiver, function(err, player) {
        if (err) {
          console.error('Error: %s', err.message);
          client.close();
          return;
        }
        var media = {

          contentId: 'http://' + webcast.ip + ':' + self.options.port + '/' + self.options.url,
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
          console.log('status broadcast playerState=%s', status.playerState);
        });

        console.log('app "%s" launched, loading media %s ...', player.session.displayName, media.contentId);

        player.load(media, { autoplay: true }, function(err, status) {
    
           if (err) {
            console.error('Error: %s', err.message);
            client.close();
            return;
          }
          console.log('media loaded playerState=%s', status.playerState);
        });

      });
    });

    client.on('error', function(err) {
      console.error('Error: %s', err.message);
      client.close();
    });

  }


module.exports = Chromecast;