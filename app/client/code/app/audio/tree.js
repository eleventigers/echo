/**
 * @author eleventigers / http://jokubasdargis.com/
 */

Audio.Org = function (parameters) {

	var self = this;

	THREE.Object3D.call(this);
	this.initParams = parameters;
	this.sample = this.initParams.stream;
	this.playing = false;

	this.scene = parameters.scene;	
	this.directionalSource = false;

	this.panner = this.scene.context.createPanner();
	this.panner.refDistance = 20.0;
	this.panner.panningModel = 1;
	this.panner.rolloffFactor = 2;
	this.panner.connect(this.scene.context.destination);

	this.compressor = this.scene.context.createDynamicsCompressor();
	this.compressor.connect(this.panner);
	this.compressor.threshold.value = -5;
	this.compressor.ratio.value = 20;
	console.log(this.compressor)

	this.volume = this.scene.context.createGainNode();
	this.volume.connect(this.compressor);

	this.analyser = this.scene.context.createAnalyser();
	this.analyser.smoothingTimeConstant = 0.3;
	this.analyser.fftSize = 2048;
	this.volume.connect(this.analyser);

	this.processor = this.scene.context.createJavaScriptNode(1024, 1, 1);
	this.processor.connect(this.volume);
	this.processor.onaudioprocess = function(e) { 
		if (self.building) self.build(); 
	};

	this.sampleRate = this.scene.context.sampleRate;
	this.fftRes = this.sampleRate / this.analyser.fftSize;
	
	this.oldPosition = new THREE.Vector3();
	this.posDelta = new THREE.Vector3();

	this.voices = {};
	this.maxVoices = 1;

	this.avgLoudness = 0;
	this.sumLoudness = 0;
	this.avgCount = 0;

	this.avgCentroid = 0;
	this.sumCentroid = 0;

	this.prevBuildTime = 0;
	this.currentTime = 0;
	this.timeJitter = 0;

	this.building = false;

}

Audio.Org.prototype = new THREE.Object3D();
Audio.Org.prototype.constructor = Audio.Org; 

Audio.Org.prototype.posUpdate = function(newPosition) {
	this.oldPosition.copy( this.position );
	this.position.copy( newPosition );
	this.posDelta.sub( this.position, this.oldPosition );
	this.panner.setPosition( this.position.x, this.position.y, this.position.z );
	this.panner.setVelocity( this.posDelta.x, this.posDelta.y, this.posDelta.z );
};

Audio.Org.prototype.extractFft = function(analyser, callback) {
	var freqData = new Uint8Array(analyser.frequencyBinCount);
	analyser.getByteFrequencyData(freqData);
	if (callback) {
		callback(freqData);
	} else {
		return freqData;
	}		
};

Audio.Org.prototype.computeCentroid = function(freqData){
	var centroid = 0.0, mag = 0.0, num = 0.0, den = 0.0;
	for (var i = 0; i < freqData.length; i++){
		mag = freqData[i]*freqData[i];
		num += i * mag * this.fftRes;	
		den += mag;
	}
	(den) ? centroid = num / den : centroid = 0.0;	
	return centroid;
};

Audio.Org.prototype.computeLoudness = function(freqData){
	var val = 0, length = freqData.length ;
	for (var i = 0; i < length; i++){
		val += freqData[i];	
	}	
	return val / length;
};

Audio.Org.prototype.build = function(){

	if (this.parent.turtle && this.building){
		var newAngle = 0;
		var turtle = this.parent.turtle;
		var freqData = this.extractFft(this.analyser);
		var centroid = this.computeCentroid(freqData);
		var loudness = this.computeLoudness(freqData);
		var cent = 360  / centroid * loudness;
		if (!isFinite(cent)){
			cent = 0;
		}

		if (loudness > 0){
			if (turtle.stack.length>0) turtle.pop();
			turtle.penDown;	
			this.avgCount++;
			this.sumLoudness += loudness;
			this.avgLoudness = this.sumLoudness / this.avgCount;
			this.sumCentroid += centroid;
			this.avgCentroid = this.sumCentroid / this.avgCount;

			if (loudness > this.avgLoudness){
				//turtle.push();
				cent /= -100 * Math.sin(loudness);
				newAngle = cent * loudness / 10;
			}

			turtle.pitch(newAngle);
			turtle.yaw(cent);
			//turtle.roll(cent);
			var width = Math.log(loudness)+cent;
			(width < 0) ? width *= -1 : width = width;
			turtle.setWidth(width);
			var distance = loudness*Math.atan(cent)/10;
			(distance < 0) ? distance *= -1 : distance = distance;
			this.toBeReleased = turtle.drop(distance);
			this.posUpdate(turtle.position);

			var delta = ((this.currentTime - this.prevBuildTime) > 0) ? this.currentTime - this.prevBuildTime : this.processor.bufferSize / this.sampleRate;
			//console.log(delta);
			var start = this.currentTime;
			this.release(this.sample, start, delta);

			this.prevBuildTime = this.currentTime;
		
						
		}
	}	
};

Audio.Org.prototype.release = function(sample, sampleStart, sampleDuration){
		this.toBeReleased.sample = sample;
		this.toBeReleased.sampleStart = sampleStart;
		this.toBeReleased.sampleDuration = sampleDuration;			
		this.parent.add(this.toBeReleased);
};

Audio.Org.prototype.getSampleTime = function() {
	var voiceCount = 0;
	var totalTime = 0;
	for (k in this.voices){
		if (this.voices.hasOwnProperty(k)) {
			totalTime += this.voices[k].getTime();
			++voiceCount;
		}	
	}
	return this.voices[0].getTime();
};

Audio.Org.prototype.getVoiceCount = function() {
	var voiceCount = 0;
	for (k in this.voices){
		if (this.voices.hasOwnProperty(k)) ++voiceCount;
		
	}
	return voiceCount;
};

Audio.Org.prototype.play = function (params) {
	var self = this;
	var deleteVoiceOnStop = function(index){
		delete self.voices[index];
		if(self.getVoiceCount() === 0) self.building = false;
	}

	if (this.getVoiceCount() <= this.maxVoices && !this.building){
		
			var sample = (!params.sample) ? this.initParams.stream : params.sample;
			if (!_.isObject(params.object)){
				var sampleStart = (!params.sampleStart) ? this.initParams.sampleStart : params.sampleStart;
				var sampleDuration = (!params.sampleDuration) ? this.initParams.sampleDuration : params.sampleDuration;
				if (params.position) this.posUpdate(params.position);
				if (this.parent.turtle && params.position) this.parent.turtle.position.copy(params.position);
			} else {
				var sampleStart = (!params.object.sampleStart) ?  this.initParams.sampleStart : params.object.sampleStart;
				var sampleDuration = (!params.object.sampleDuration) ? this.initParams.sampleDuration : params.object.sampleDuration;
				if (params.object.position) this.posUpdate(params.object.position);
				if (this.parent.turtle && params.object.position) this.parent.turtle.position.copy(params.object.position);
				console.log("pickup", params.object.sampleStart, params.object.sampleDuration);
			}

			this.building = (params.build) ? params.build : false;
			var index = this.getVoiceCount();
			var voice = new Voice(this, sample, deleteVoiceOnStop, index);
			this.voices[index] = voice;
			this.voices[index].play(sampleStart, sampleDuration);
		
	}	
};

Audio.Org.prototype.playSequence = function (seq) {
	if(!seq.length) return; 
	var self = this;
	var seq = seq;
	var current = 0;

	var onVoiceOnStop = function(index){
		delete self.voices[index];
		if(self.getVoiceCount() === 0) self.building = false;
		if(current < seq.length) playNext(current);
	}

	var playNext = function (seqNr){
		++current;
		self.building = true;
		self.sample = seq[seqNr].sample; 
		var index = self.getVoiceCount();
		var voice = new Voice(self, seq[seqNr].sample, onVoiceOnStop, index);
		self.voices[index] = voice;
		self.voices[index].play(seq[seqNr].sampleStart, seq[seqNr].sampleDuration);
	}

	playNext(current);

};

function Voice (parent, buffer, onStop, index) {
	var self = this;
	var parent = parent;
	var onStop = onStop;
	var index = index;
	var source = parent.scene.context.createBufferSource(mixToMono = false);
	var volume = parent.scene.context.createGainNode();
	var voices = parent.getVoiceCount();
	var scale = (voices !== 0) ? 1 / voices / 2 : 1;
	volume.gain.setValueAtTime(scale, parent.scene.context.currentTime);
	source.buffer = buffer;
	source.connect(volume);
	volume.connect(parent.volume);
	source.start = 0;
	var sampleStart, sampleDuration;
	var playHead = parent.scene.context.createJavaScriptNode(256, 1, 1);
	playHead.onaudioprocess = function(e) {self.follow()};

	this.playing = false;
	
	this.play = function (smpSt, smpDur) {
		sampleStart = (!smpSt) ? 0 : smpSt;
		sampleDuration = (!smpDur || smpDur === 0) ? source.buffer.duration-sampleStart : smpDur;
		parent.prevBuildTime = sampleStart;
		source.start = parent.scene.context.currentTime;
		console.log("start&duration", sampleStart, sampleDuration);
		playHead.connect(parent.volume);
		source.noteGrainOn(0, sampleStart, sampleDuration);	
		this.playing = true;
	};

	this.stop = function () {
		source.noteOff(0);
		playHead.disconnect(parent.volume);
		this.playing = false;
		if(onStop) onStop(index);
	};

	this.follow = function() {
		if (this.playing) {
			playHeadPos = parent.scene.context.currentTime - source.start;
			parent.currentTime = sampleStart + playHeadPos - parent.timeJitter;

		}
		if (playHeadPos >= sampleDuration){
			parent.timeJitter = playHeadPos-sampleDuration;
			this.stop();
		}
	};	

	this.getTime = function(){
		return sampleStart+playHeadPos;
	}

}

