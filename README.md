# Castawave
A nw.js (node-webkit) app to stream local audio (input) to chromecast on OSX. 

![castawave](https://cloud.githubusercontent.com/assets/692826/7750301/a6e22038-ffd3-11e4-9259-2ff153d681e6.png)

If you whish to cast your computers audio output, you can use [Soundflower](https://rogueamoeba.com/freebies/soundflower/) to reroute it in a way that it becomes available as an input. Use Soundflower (2ch) as your default microphone and output sound device.

This project is heavily reliant on the awesome npm modules of [Nathan Wittstock](https://github.com/fardog), which are compatible only with node 0.10 - therefore [nw.js v0.8.5 (Feb 26, 2014)](https://github.com/nwjs/nw.js/wiki/Downloads-of-old-versions) must be used.

```
npm install -g nw-gyp
npm install
```

Now you need to recompile certain modules/submodules to be usable by nw.
Go to the directories of these modules:
- *mdns*
- *lame* 
- *osx_audio* 

and there, run
```
nw-gyp rebuild --target=0.8.5
```
