var $ = require('jquery');
var freeport = require('freeport');
var gui = require('nw.gui');
var Chromecast = require('./chromecast');

// Get the current window
var win = gui.Window.get();
win.focus();

//win.x = 0;
//win.showDevTools();

///----------------------------


freeport(function(err, port) {
  if (err) throw err

  cc = new Chromecast({
    port: port,
    bitrate: 192,
    samplerate: 44100,
    name: 'Castawave',
    url: 'castawave.mp3',
  });

  $("footer #portinfo").text("Streaming from local port " + port);

  win.on('close', function(){
    var scope = this;
    cc.disconnect(false, function(){
      scope.close(true);
    })
  });

  cc.onDeviceListUpdate(function(list){

  $('#deviceList').empty();

    if (list.length) {
      
      for (var i = 0; i < list.length; i++) {
        var device = list[i];
        var item = $('<a href="javascript:void(0);"></a>').text(device.name);

        item.click(function(e) {
          if (cc.currentCS == cc.cs.CASTING) {
            cc.disconnect();
            return;
          }

          if (cc.currentCS == cc.cs.IDLE) {
            $(e.target).addClass("icon loading");
            cc.connect(device.name, device.addresses[0]);
          }
        });

        $('#deviceList').append($('<li></li>').append(item));
      };

    } else {

      $('#deviceList').append($('<li></li>').text('no devices found'));

    }
    
  });

  cc.onDisplayChange(function(status) {

    status = status.toLowerCase();

    $('#status').text(status);

    switch(status) {
      case "connecting":
      case "setting up":
      case "buffering":
        break;

      case "playing":
        $('#deviceList li .loading').addClass("casting");
        $('#deviceList li .casting').removeClass("loading");
        break;

      case "error": alert('error, look at console log');
      case "connection closed":
        $('#deviceList li .icon')
          .removeClass("casting")
          .removeClass("loading")
          .removeClass("icon");
        break;

      default:
    }
  });
});