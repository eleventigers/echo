/**
 * @author eleventigers / http://jokubasdargis.com/
 */

Audio.Tree = function (parameters) {

	var self = this;

	THREE.Object3D.call(this);
	this.initParams = parameters;
	this.playing = false;

	this.scene = parameters.scene;	
	this.directionalSource = false;

	this.panner = this.scene.context.createPanner();
	this.panner.refDistance = 10.0;
	this.panner.panningModel = 1;
	this.panner.rolloffFactor = 2;

	this.volume = this.scene.context.createGainNode();
	//this.volume.connect(this.panner);
	this.panner.connect(this.scene.context.destination);

	this.analyser = this.scene.context.createAnalyser();
	this.analyser.smoothingTimeConstant = 0.3;
	this.analyser.fftSize = 2048;
	this.volume.connect(this.analyser);

	this.processor = this.scene.context.createJavaScriptNode(1024, 1, 1);
	this.processor.connect(this.volume);
	this.processor.onaudioprocess = function(e) { self.posUpdate(); };

	this.sampleRate = this.scene.context.sampleRate;
	this.fftRes = this.sampleRate / this.analyser.fftSize;
	
	this.oldPosition = new THREE.Vector3();
	this.posDelta = new THREE.Vector3();
	this.posFront = new THREE.Vector3();
	this.posUp = new THREE.Vector3();

	this.voices = [];
	this.maxVoices = 4;

	this.avgLoudness = 0;
	this.sumLoudness = 0;
	this.avgCount = 0;


}

Audio.Tree.prototype = new THREE.Object3D();
Audio.Tree.prototype.constructor = Audio.Tree; 

Audio.Tree.prototype.posUpdate = function() {
	var posSource;
	// (typeof this.parent != "undefined")	? posSource = this.parent : 
	posSource = this;
	this.oldPosition.copy( this.position );
	this.position.copy( posSource.position );
	this.posDelta.sub( this.position, this.oldPosition );
	this.panner.setPosition( this.position.x, this.position.y, this.position.z );
	this.panner.setVelocity( this.posDelta.x, this.posDelta.y, this.posDelta.z );
	if ( this.directionalSource ) {
		this.posFront.set( 0, 0, -1 );
		this.matrixWorld.rotateAxis( this.posFront );
		this.posFront.normalize();
		this.posUp.copy( posSource.up);
		this.panner.setOrientation( this.posFront.x, this.posFront.y, this.posFront.z, this.posUp.x, this.posUp.y, this.posUp.z );
	}
};

Audio.Tree.prototype.extractFft = function(analyser, callback) {
	var freqData = new Uint8Array(analyser.frequencyBinCount);
	analyser.getByteFrequencyData(freqData);
	if (callback) {
		callback(freqData);
	} else {
		return freqData;
	}		
};

Audio.Tree.prototype.computeCentroid = function(freqData){
	var centroid = 0.0, mag = 0.0, num = 0.0, den = 0.0;
	for (var i = 0; i < freqData.length; i++){
		mag = freqData[i]*freqData[i];
		num += i * mag * this.fftRes;	
		den += mag;
	}
	(den) ? centroid = num / den : centroid = 0.0;	
	return centroid;
};

Audio.Tree.prototype.computeLoudness = function(freqData){
	var val = 0, length = freqData.length ;
	for (var i = 0; i < length; i++){
		val += freqData[i];	
	}	
	return val / length;
};

Audio.Tree.prototype.build = function(turtle, callback){

  	var freqData = this.extractFft(this.analyser);
	var centroid = this.computeCentroid(freqData);
	var loudness = this.computeLoudness(freqData);
	var cent = 360 / centroid * loudness  ;
	if (!isFinite(cent)){
		cent = 0;
	}
	var mesh;

	if (loudness > 60){
		if (turtle.stack.length>0) turtle.pop();
		this.avgCount++;
		this.sumLoudness += loudness;
		this.avgLoudness = this.sumLoudness / this.avgCount;
		if (loudness > this.avgLoudness){
			turtle.push();
			cent *= -1;
			loudness *= -1;
		}
		turtle.pitch(cent);
		//turtle.yaw(cent);
		// turtle.roll(cent);
		turtle.setWidth(loudness/10);
		mesh = turtle.drop(loudness*cent/100);	
		this.position = turtle.position;
		return callback(mesh);	
	}

	

}

Audio.Tree.prototype.play = function (smp, smpSt, smpDur) {

	var playingCount = 0;

	var sample = (!sample) ? this.initParams.stream : smp;
	var sampleStart = (!smpSt) ? 0 : smpSt;
	var sampleDuration = (!smpDur) ? 0 : smpDur;

	if (this.voices.length <= this.maxVoices){

		for (var i = 0; i < this.voices.length; i++){
			if (this.voices[i].playing){
				playingCount ++;
			}
			if (!this.voices[i].playing){
				this.voices.splice(i, 1);
			}
		}

		if (playingCount == this.maxVoices){
			this.voices[0].stop();
			this.voices.splice(0, 1);
			var voice = new Voice(this, sample);
			this.voices.push(voice);
			voice.play(sampleStart, sampleDuration);
		} else {
			var voice = new Voice(this, sample);
			this.voices.push(voice);
			voice.play(sampleStart, sampleDuration);
		}
	}
	
};

function Voice (parent, buffer) {

	this.parent = parent;

	this.source = this.parent.scene.context.createBufferSource(mixToMono = false);
	this.source.buffer = buffer;
	this.source.loop = this.parent.initParams.loop;
	this.source.connect(this.parent.volume);
	this.source.start = 0;
	this.playing = false;

	var self = this;
	
	this.play = function (smpSt, smpDur) {



		this.sampleStart = (!smpSt) ? 0 : smpSt;
		this.sampleDuration = (!smpDur || smpDur == 0) ? this.source.buffer.duration : smpDur;

		this.playHead = this.parent.scene.context.createJavaScriptNode(2048, 1, 1);
		this.playHead.onaudioprocess = function(e) {self.follow()};

		this.source.noteGrainOn(0, this.sampleStart, this.sampleDuration);
		this.playHead.connect(this.parent.volume);

		this.source.start = this.parent.scene.context.currentTime;
		this.playing = true;
	};

	this.stop = function () {
		this.playHead.disconnect(this.parent.volume);
		this.source.noteOff(0);
		this.playing = false;
	};

	this.follow = function() {
		if (this.playing) {
			this.playHeadPos = this.parent.scene.context.currentTime - this.source.start;
		}
		if (this.playHeadPos >= this.sampleDuration){
			this.stop();
		}
	};	

}

