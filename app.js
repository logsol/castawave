var $ = require('jquery');
var freeport = require('freeport');
var gui = require('nw.gui');
var Chromecast = require('./chromecast');
var audio = require('webcast-osx-audio/node_modules/osx-audio');

// Get the current window
var win = gui.Window.get();
win.focus();

var cc;

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

// Meter
var b_canvas = document.getElementById("b");
var b_context = b_canvas.getContext("2d");
var height = b_canvas.height;
var width = b_canvas.width;
var border = 0;

var audioCtx = new webkitAudioContext();
var source = audioCtx.createBufferSource();
var analyser = audioCtx.createAnalyser();
var myArrayBuffer = audioCtx.createBuffer(2, 44100 * 3, 44100);

source.connect(analyser);

var input = new audio.Input(); // Is a singleton, so webcast will use same instance.
var meter = 0;

input.on('data', function(buffer){
  var value = Math.abs(buffer.readInt16LE(0)) / 10000;
  if (value > meter) {
    meter = value;
  }
});

function step() {
  meter -= .005;
  b_context.fillStyle = "#4191B0";
  b_context.clearRect(0,0,1000,1000)
  b_context.fillRect(border, border, meter * (width - border*2), height - border*2);

  requestAnimationFrame(step);
};
requestAnimationFrame(step);


