var audioSelect = document.querySelector('select#audioSource');

navigator.getUserMedia = navigator.getUserMedia ||
  navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

navigator.mediaDevices = navigator.mediaDevices || ((navigator.mozGetUserMedia || navigator.webkitGetUserMedia) ? {
   getUserMedia: function(c) {
     return new Promise(function(y, n) {
       (navigator.mozGetUserMedia ||
        navigator.webkitGetUserMedia).call(navigator, c, y, n);
     });
   }
} : null);

function gotSources(sourceInfos) {
  console.log(sourceInfos);
  for (var i = 0; i !== sourceInfos.length; ++i) {
    var sourceInfo = sourceInfos[i];
    var option = document.createElement('option');
    option.value = sourceInfo.id;
    if (sourceInfo.kind === 'audio') {
      option.text = sourceInfo.label || 'microphone ' +
        (audioSelect.length + 1);
      audioSelect.appendChild(option);
    } else {
      console.log('Some other kind of source: ', sourceInfo);
    }
  }
}

if (typeof MediaStreamTrack === 'undefined' ||
    typeof MediaStreamTrack.getSources === 'undefined') {
  alert('This browser does not support MediaStreamTrack.\n\nTry Chrome.');
} else {
  MediaStreamTrack.getSources(gotSources);
}

function successCallback(stream) {
  window.stream = stream; // make stream available to console
}

function errorCallback(error) {
  console.log('navigator.getUserMedia error: ', error);
}

function printVolume() {
    console.log(getVolume());
}

var audio = document.querySelector('audio');
globalStream = null;
function updateVolume(stream) {
    globalStream = stream;
    audio.src = window.URL.createObjectURL(stream);
    audio.onloadedmetadata = function(e) {
      setInterval(printVolume, 150);
      console.log(stream.getAudioTracks());
      console.log(stream);
      audio.play();
    };
}


function start() {
  if (!!window.stream) {
    window.stream.active = false;
  }
  var audioSource = audioSelect.value;
  var constraints = {
    audio: {
      optional: [{
        sourceId: audioSource
      }]
    }
  };
  navigator.mediaDevices.getUserMedia(constraints, successCallback,
              errorCallback).then(updateVolume);
  //navigator.getUserMedia(constraints, successCallback,
  //            errorCallback);
}

audioSelect.onchange = start;

start();



var ac = new AudioContext();
var analyzer = ac.createAnalyser();
function getVolume() {
    /* create the Web Audio graph, let's assume we have sound coming out of the
     * node 'audio' */
    source = ac.createMediaStreamSource(globalStream);
    source.connect(analyzer);
    /* Get an array that will hold our values */
    //var myDataArray = new Uint8Array(analyzer.fftSize);

    var myDataArray = new Float32Array(analyzer.frequencyBinCount); // Float32Array should be the same length as the frequencyBinCount 

    // GOD knows what this does
    //analyzer.getByteTimeDomainData(myDataArray);
    analyzer.getFloatFrequencyData(myDataArray);
    var vol = 0;
    //console.log(myDataArray);
    for (var i = 0; i < myDataArray.length; i++) {
      vol += myDataArray[i];
    }
    vol /= myDataArray.length;
    return vol+128;
}
