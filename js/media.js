define([], function () {



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
    }

    function successCallback(stream) {
        window.stream = stream; // make stream available to console
    }

    function errorCallback(error) {
        console.log('navigator.getUserMedia error: ', error);
    }

    var globalVolume = 0;
    // time when the audio started decreasing
    var startTime = (new Date()).getTime();
    var prevVolume = 0;
    var averageVol = 0;
    var totalVolumes = 0;
    var min_volume = 10000;
    var recent_min_list = [];

    function printVolume() {
        globalVolume = getVolume();
        if (globalVolume == null) {
            return;
        }
        averageVol = (globalVolume + (averageVol*totalVolumes)) / (totalVolumes+1);
        totalVolumes++;
        if (recent_min_list.length >= 120) {
            recent_min_list.shift();
        }
        if (totalVolumes > 30) {
            recent_min_list.push(globalVolume);
            if (globalVolume < min_volume) {
                min_volume = globalVolume;
            }
            min_volume = Math.min.apply(Math, recent_min_list);
        }

        var diffFromMin = Math.abs(globalVolume - min_volume);
        var diffFromAvg = Math.abs(globalVolume - averageVol);
        if (diffFromMin < diffFromAvg) {
            // YOU ARE SILENT
            return true;
        } else {
            // YOU ARE NOT SILENT
            return false;
        }
    }

    var audio = document.querySelector('audio');
    var globalStream = null;
    function updateVolume(stream) {
        // initialize recording
        setUpStream(stream);
        editor.initTime = (new Date()).getTime();

        // set up volume listener
        globalStream = stream;
        audio.src = window.URL.createObjectURL(stream);
        audio.onloadedmetadata = function(e) {
          //setInterval(printVolume, 150);
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
    }

    var ac = new AudioContext();
    var analyzer = ac.createAnalyser();
    function getVolume() {
        if (!globalStream) {
            return null;
        }
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
        for (var i = 0; i < myDataArray.length/2; i++) {
          vol += myDataArray[i];
        }
        vol /= myDataArray.length;
        return vol+128;
    }


    var audioInput = null;
    var sampleRate = null;
    var recordingLength = 0;
    var leftchannel = [];
    var rightchannel = [];
    var recorder = null;
    function setUpStream(stream) {
        var context = ac;
        // retrieve the current sample rate to be used for WAV packaging
        sampleRate = context.sampleRate;

        // creates a gain node
        volume = context.createGain();

        // creates an audio node from the microphone incoming stream
        audioInput = context.createMediaStreamSource(stream);

        // connect the stream to the gain node
        audioInput.connect(volume);

        // From the spec: This value controls how frequently the audioprocess event is
        // dispatched and how many sample-frames need to be processed each call.
        // Lower values for buffer size will result in a lower (better) latency.
        // Higher values will be necessary to avoid audio breakup and glitches
        var bufferSize = 2048;
        recorder = context.createScriptProcessor(bufferSize, 2, 2);

        count = 0;
        recorder.onaudioprocess = function(e){
            var left = e.inputBuffer.getChannelData(0);
            var right = e.inputBuffer.getChannelData(1);
            // we clone the samples
            leftchannel.push(new Float32Array(left));
            rightchannel.push(new Float32Array(right));
            recordingLength += bufferSize;
        }

        // we connect the recorder
        volume.connect(recorder);
        recorder.connect(context.destination);
    }


    function mergeBuffers(channelBuffer, recordingLength){
      var result = new Float32Array(recordingLength);
      var offset = 0;
      var lng = channelBuffer.length;
      for (var i = 0; i < lng; i++){
        var buffer = channelBuffer[i];
        result.set(buffer, offset);
        offset += buffer.length;
      }
      return result;
    }


    function interleave(leftChannel, rightChannel){
      var length = leftChannel.length + rightChannel.length;
      var result = new Float32Array(length);

      var inputIndex = 0;

      for (var index = 0; index < length; ){
        result[index++] = leftChannel[inputIndex];
        result[index++] = rightChannel[inputIndex];
        inputIndex++;
      }
      return result;
    }


    function writeUTFBytes(view, offset, string){
      var lng = string.length;
      for (var i = 0; i < lng; i++){
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    }



  var execute = function () {

    audioSelect.onchange = start;

    start();

  }
    function play_wav() {
        // we flat the left and right channels down
        var leftBuffer = mergeBuffers (leftchannel, recordingLength);
        var rightBuffer = mergeBuffers (rightchannel, recordingLength);
        // we interleave both channels together
        var interleaved = interleave ( leftBuffer, rightBuffer );

        // create the buffer and view to create the .WAV file
        var buffer = new ArrayBuffer(44 + interleaved.length * 2);
        var view = new DataView(buffer);

        // write the WAV container, check spec at: https://ccrma.stanford.edu/courses/422/projects/WaveFormat/
        // RIFF chunk descriptor
        writeUTFBytes(view, 0, 'RIFF');
        view.setUint32(4, 44 + interleaved.length * 2, true);
        writeUTFBytes(view, 8, 'WAVE');
        // FMT sub-chunk
        writeUTFBytes(view, 12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        // stereo (2 channels)
        view.setUint16(22, 2, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 4, true);
        view.setUint16(32, 4, true);
        view.setUint16(34, 16, true);
        // data sub-chunk
        writeUTFBytes(view, 36, 'data');
        view.setUint32(40, interleaved.length * 2, true);

        // write the PCM samples
        var lng = interleaved.length;
        var index = 44;
        var volume = 1;
        for (var i = 0; i < lng; i++){
            view.setInt16(index, interleaved[i] * (0x7FFF * volume), true);
            index += 2;
        }
        var blob = new Blob ( [ view ], { type : 'audio/wav' } );

        var playData = (function () {
            var audio = document.createElement("audio");
            document.body.appendChild(audio);
            audio.style = "display: none";
            recorder.onaudioprocess = function() {};
            return function (data) {
                audio.src = window.URL.createObjectURL(data);
                audio.play();
            };
        }());

        playData(blob);
    }

  return {
    load: execute,
    play_wav: play_wav,
    checkVolume: printVolume 
  }

});
