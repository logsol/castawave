var $ = require('jquery');
var freeport = require('freeport');
var gui = require('nw.gui');
var Chromecast = require('./chromecast');

// Get the current window
var win = gui.Window.get();
win.focus();
//win.showDevTools();

///----------------------------


freeport(function(err, port) {
  if (err) throw err

  cc = new Chromecast({
    port: port,
    bitrate: 192,
    samplerate: 44100,
    name: 'Audio Streamer',
    url: 'stream.mp3',
  });

  $("footer p").text("Streaming from local port " + port);

  cc.onDeviceListUpdate(function(list){

  $('#deviceList').empty();

    if (list.length) {
      
      for (var i = 0; i < list.length; i++) {
        var device = list[i];
        var item = $('<a href="javascript:void(0);"></a>').text(device.name);
        item.click(function(e) {
          cc.connect(device.name, device.addresses[0]);
        });
        $('#deviceList').append($('<li></li>').append(item));
      };

    } else {

      $('#deviceList').append($('<li></li>').text('no devices found'));

    }
    
  });

});