/**
 * @author eleventigers / http://jokubasdargis.com/
 */

Audio.Scene = function (listener){

    // Freesound API access
    this.freesound = new Freesound('d34c2909acd242819a7f4ceba6a7c041', true);

    // Context setup
    this.context = new webkitAudioContext();
    this.convolver = this.context.createConvolver();
    this.convolverGain = this.context.createGainNode();
    this.volume = this.context.createGainNode();
    this.mixer = this.context.createGainNode();
    this.flatGain = this.context.createGainNode();
    this.destination = this.mixer;
    this.mixer.connect(this.flatGain);
    this.mixer.connect(this.convolver);
    this.convolver.connect(this.convolverGain);
    this.flatGain.connect(this.volume);
    this.convolverGain.connect(this.volume);
    this.volume.connect(this.context.destination);

    this.environments = { enabled : false };

    this.bufferList = {};

    // attach context listener to a camera e.g.
    this.listener = listener; 
    this.listener.newPosition = new THREE.Vector3();
    this.listener.oldPosition = new THREE.Vector3();
    this.listener.posDelta = new THREE.Vector3();
    this.listener.posFront = new THREE.Vector3();

}

Audio.Scene.prototype.constructor = Audio.Scene;

Audio.Scene.prototype.update = function() {

        this.listener.oldPosition.copy( this.listener.newPosition );
        this.listener.newPosition.copy( this.listener.matrixWorld.getPosition() );
        this.listener.posDelta.sub( this.listener.newPosition, this.listener.oldPosition );

        this.listener.posFront.set( 0, 0, -1 );
        this.listener.matrixWorld.rotateAxis( this.listener.posFront );
        this.listener.posFront.normalize();

        this.context.listener.setPosition( this.listener.newPosition.x, this.listener.newPosition.y, this.listener.newPosition.z );
        this.context.listener.setVelocity( this.listener.posDelta.x, this.listener.posDelta.y, this.listener.posDelta.z );
        this.context.listener.setOrientation( this.listener.posFront.x, this.listener.posFront.y, this.listener.posFront.z, this.listener.up.x, this.listener.up.y, this.listener.up.z );
        
};


Audio.Scene.prototype.loadEnvironment = function(file) {
        var self = this;
        this.loadBuffer(file, function(buffer) {
            self.environments[name] = buffer;
        });
};


Audio.Scene.prototype.loadBuffer = function(url, callback) {
  // Load buffer asynchronously
  var request = new XMLHttpRequest();
  var filename = url.replace(/^.*[\\\/]/, '');
  request.open("GET", url, true);
  request.responseType = "arraybuffer";

  var self = this;

  request.onload = function() {
    // Asynchronously decode the audio file data in request.response
    self.context.decodeAudioData(
        request.response,
        function(buffer) {
            if (!buffer) {
              alert('error decoding file data: ' + url);
              return;
            }
            self.bufferList[filename] = buffer;
            callback(true, buffer);
        }
    );
  }

  request.onerror = function() {
    alert('Audio.Loader: XHR error');
  }

  request.send();
}

Audio.Scene.prototype.loadFreesoundBuffer = function(id, callback) {
  // Load buffer asynchronously
  var url, filename, returnedSndInfo;
  var request = new XMLHttpRequest();

  this.freesound.getSound(id, function(sound){
    returnedSndInfo = sound;
    url = sound.properties['preview-hq-mp3'];
    filename = id;//url.replace(/^.*[\\\/]/, '');

    request.open("GET", url, true);
    request.responseType = "arraybuffer";
    request.send();
    }, 
    function(){console.log("Error fetching freesound resource: "+id);
    });

  var self = this;

  request.onload = function() {
    // Asynchronously decode the audio file data in request.response
    self.context.decodeAudioData(
        request.response,
        function(buffer) {
            if (!buffer) {
              alert('error decoding file data: ' + url);
              return;
            }
            buffer.meta = returnedSndInfo;
            returnedSndInfo.getAnalysisFrames(function(analysis){
              buffer.meta.properties.analysis_frames = analysis;
              self.bufferList[filename] = buffer;
              callback(true, buffer);
            });           
        }
    );
  }

  request.onerror = function() {
    alert('Audio.Loader: XHR error');
  }
  
}

// TODO : merge methods below into one

Audio.Scene.prototype.loadBuffers = function(urlList, callback) {
    var self = this;
    var count = 0;
    for (var i = 0; i < urlList.length; ++i)
    this.loadBuffer(urlList[i], function(status, buffer){

        if (status){
          ++count;
        } 
        if (count == urlList.length) {
            callback(true, self.bufferList);
        }
    });
}

Audio.Scene.prototype.loadFreesoundBuffers = function(idList, callback) {
    var self = this;
    var count = 0;
    for (var i = 0; i < idList.length; ++i)
    this.loadFreesoundBuffer(idList[i], function(status, buffer){
        if (status) {
          ++count;
        }
        if (count == idList.length) {
            callback(true, self.bufferList);
        }
    });
}

    

