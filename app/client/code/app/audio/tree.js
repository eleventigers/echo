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
	this.panner.refDistance = 20.0;
	this.panner.panningModel = 1;
	this.panner.rolloffFactor = 2;

	this.volume = this.scene.context.createGainNode();
	this.volume.connect(this.panner);
	this.panner.connect(this.scene.context.destination);

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
	this.maxVoices = 2;

	this.avgLoudness = 0;
	this.sumLoudness = 0;
	this.avgCount = 0;

	this.avgCentroid = 0;
	this.sumCentroid = 0;

	this.building = false;

}

Audio.Tree.prototype = new THREE.Object3D();
Audio.Tree.prototype.constructor = Audio.Tree; 

Audio.Tree.prototype.posUpdate = function(newPosition) {
	this.oldPosition.copy( this.position );
	this.position.copy( newPosition );
	this.posDelta.sub( this.position, this.oldPosition );
	this.panner.setPosition( this.position.x, this.position.y, this.position.z );
	this.panner.setVelocity( this.posDelta.x, this.posDelta.y, this.posDelta.z );
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

Audio.Tree.prototype.build = function(){

	if (this.parent.turtle){
		var turtle = this.parent.turtle;
		var freqData = this.extractFft(this.analyser);
		var centroid = this.computeCentroid(freqData);
		var loudness = this.computeLoudness(freqData);
		var cent = 360  / centroid * loudness;
		if (!isFinite(cent)){
			cent = 0;
		}

		if (loudness > 10){
			turtle.penDown;	
			this.avgCount++;
			this.sumLoudness += loudness;
			this.avgLoudness = this.sumLoudness / this.avgCount;
			this.sumCentroid += centroid;
			this.avgCentroid = this.sumCentroid / this.avgCount;

			if (loudness < this.avgLoudness){
				if (turtle.stack.length>0) turtle.pop();	
				cent /= -100 * Math.sin(loudness);
				loudness *= -1;
			}

			if (centroid > this.avgCentroid){
				turtle.push();
			}

			turtle.pitch(cent);
			//turtle.yaw(cent);
			//turtle.roll(cent);
			turtle.setWidth(Math.cos(cent)*loudness/10);
			// turtle.setColor(color);
			var mesh = turtle.drop(cent*loudness/50);
			
			mesh.sampleStart = this.getSampleTime();
			mesh.sampleDuration = this.processor.bufferSize / this.sampleRate;
			//console.log(this.processor.bufferSize / this.sampleRate);
			//mesh.suicide(5000);
	
			this.parent.add(mesh);
			this.posUpdate(turtle.position);
		}
	}	
};

Audio.Tree.prototype.getSampleTime = function() {
	var voiceCount = 0;
	var totalTime = 0;
	for (k in this.voices){
		if (this.voices.hasOwnProperty(k)) {
			totalTime += this.voices[k].getTime();
			++voiceCount;
		}	
	}
	return totalTime / voiceCount;
};

Audio.Tree.prototype.getVoiceCount = function() {
	var voiceCount = 0;
	for (k in this.voices){
		if (this.voices.hasOwnProperty(k)) ++voiceCount;
		
	}
	return voiceCount;
};

Audio.Tree.prototype.play = function (params) {
	var self = this;
	var deleteVoiceOnStop = function(index){
		delete self.voices[index];
		if(self.getVoiceCount() === 0) self.building = false;
		//if(params.object) params.object.suicide(0);
	}

	if (this.getVoiceCount() <= this.maxVoices && !this.building){
		var sample = (!params.sample) ? this.initParams.stream : params.sample;
		if (!params.object){
			var sampleStart = (!params.sampleStart) ? this.initParams.sampleStart : params.sampleStart;
			var sampleDuration = (!params.sampleDuration) ? this.initParams.sampleDuration : params.sampleDuration;
			if (params.position) this.posUpdate(params.position);
			if (this.parent.turtle && params.position) this.parent.turtle.position.copy(params.position);
		} else {
			var sampleStart = (!params.object.sampleStart) ?  this.initParams.sampleStart : params.object.sampleStart;
			var sampleDuration = (!params.object.sampleDuration) ? this.initParams.sampleDuration : params.object.sampleDuration;
			if (params.object.position) this.posUpdate(params.object.position);
			if (this.parent.turtle && params.object.position) this.parent.turtle.position.copy(params.object.position);
		}
		
		this.building = (params.build) ? params.build : false;
		var index = this.getVoiceCount();
		var voice = new Voice(this, sample, deleteVoiceOnStop, index);
		this.voices[index] = voice;
		this.voices[index].play(sampleStart+Math.random()*0.01, sampleDuration);
	}	
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
	//source.loop = parent.initParams.loop;
	source.connect(volume);
	volume.connect(parent.volume);
	source.start = 0;
	var sampleStart, sampleDuration;
	var playHead = parent.scene.context.createJavaScriptNode(512, 1, 1);
	playHead.onaudioprocess = function(e) {self.follow()};

	this.playing = false;
	
	this.play = function (smpSt, smpDur) {
		sampleStart = (!smpSt) ? 0 : smpSt;
		sampleDuration = (!smpDur || smpDur == 0) ? source.buffer.duration-sampleStart : smpDur;
		source.start = parent.scene.context.currentTime;
		playHead.connect(parent.volume);
		source.noteGrainOn(0, sampleStart, sampleDuration);	
		this.playing = true;
	};

	this.stop = function () {
		playHead.disconnect(parent.volume);
		source.noteOff(0);
		this.playing = false;
		if(onStop) onStop(index);
	};

	this.follow = function() {
		if (this.playing) {
			playHeadPos = parent.scene.context.currentTime - source.start;
		}
		if (playHeadPos >= sampleDuration){
			this.stop();
		}
	};	

	this.getTime = function(){
		return Math.sqrt((playHeadPos - sampleStart)*(playHeadPos - sampleStart));
	}

}

