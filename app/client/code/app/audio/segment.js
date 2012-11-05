/**
 * @author eleventigers / http://jokubasdargis.com/
 */

Audio.Segment = function (parameters) {

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
	
	this.position = new THREE.Vector3();

	this.voices = [];
	this.maxVoices = 1;

}

Audio.Segment.prototype = new THREE.Object3D();
Audio.Segment.prototype.constructor = Audio.Segment; 

Audio.Segment.prototype.posUpdate = function(position) {	
	if (position){
		this.position = position;
		this.panner.setPosition(position.x, position.y, position.z);	
	}
	return this.position;	
};


Audio.Segment.prototype.play = function (smp, smpSt, smpDur) {

	var playingCount = 0;

	var sample = (!sample) ? this.initParams.stream : smp;
	var sampleStart = (!smpSt) ? this.initParams.sampleStart : smpSt;
	var sampleDuration = (!smpDur) ? this.initParams.sampleStart : smpDur;

	console.log( this.initParams.sampleStart);

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

	this.getTime = function(){
		return this.playHeadPos;
	}

}

