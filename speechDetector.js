function speechDetector(THRESHOLD, DURATION, OFFDURATION, onUtterance) {

  navigator.getUserMedia = (
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia
  );

  var audioCtx = new AudioContext();
  var scriptNode = audioCtx.createScriptProcessor(4096, 1, 1);

  navigator.getUserMedia({
    audio: true
  }, success, function(e) {
    alert('Error capturing audio.');
  });

  var source = null;

  function success(e) {
    source = audioCtx.createMediaStreamSource(e);
    source.connect(scriptNode);
    source.onended = function() {
      source.disconnect(scriptNode);
      scriptNode.disconnect(audioCtx.destination);
      console.log("Disconnected source");
    }
  }

  scriptNode.connect(audioCtx.destination);
  var onSince = -1,
    offSince = -1,
    lastCheck = -1,
    wasOn = false;

  // Give the node a function to process audio events
  scriptNode.onaudioprocess = function(audioProcessingEvent) {
    var inputBuffer = audioProcessingEvent.inputBuffer;
    var outputBuffer = audioProcessingEvent.outputBuffer;
    var data = inputBuffer.getChannelData(0);
    var sum = data.reduce(function(a, b) {
      return a + Math.abs(b);
    }, 0);
    var now = new Date().getTime();
    if (sum > THRESHOLD) {
      if (onSince < 0) {
        onSince = now;
        uttStartTime = now;
      }
      wasOn = false;
      offSince = -1;
      //console.log("ON", onSince, now, now - onSince)
    } else {
      //console.log("OFF", onSince, now)
      if ((onSince > 0) && (now - onSince) > DURATION) {
        wasOn = true;
      }
      if (wasOn && (offSince > 0) && (now - offSince) > OFFDURATION) {
        console.log("Utterance Done", now, onSince, now - onSince)
        onUtterance(uttStartTime, now - uttStartTime);
        wasOn = false;
      }

      onSince = -1;
      if (offSince < 0) {
        offSince = now;
      }
    }
    lastCheck = now;
  }
}