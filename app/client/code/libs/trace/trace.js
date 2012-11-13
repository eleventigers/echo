(function (window) {
	var userContext,
        userInstance,
        Trace = function (context) {
            if (!context) {
                context = window.webkitAudioContext && (new window.webkitAudioContext());
            }

            userContext = context;
            userInstance = this;

            ////////// Defining audio context listener, depends on THRE.js being present //////////

            if (typeof THREE === "undefined"){ 
                        console.error("trace.js: THREE.js library is missing, therefore trace.js is crippled severely");
            } else {
                this.listener = (function(){
                    var posNew = new THREE.Vector3();
                    var posOld = new THREE.Vector3();
                    var posDelta = new THREE.Vector3();
                    var posFront = new THREE.Vector3();
                    return {
                        update : function(object){
                            if(!object){
                                return false;
                            } else {
                                posOld.copy( posNew );
                                posNew.copy( object.matrixWorld.getPosition() );
                                posDelta.sub( posNew, posOld );
                                posFront.set( 0, 0, -1 );
                                object.matrixWorld.rotateAxis( posFront );
                                posFront.normalize();
                                userContext.listener.setPosition( posNew.x, posNew.y, posNew.z );
                                userContext.listener.setVelocity( posDelta.x, posDelta.y, posDelta.z );
                                userContext.listener.setOrientation( posFront.x, posFront.y, posFront.z, object.up.x, object.up.y, object.up.z );
                                return true;
                            }
                        }
                    };
                })();
            }

            ////////// Handling url and Freesound API served buffers here //////////

            this.buffers = (function(){     
                 if (typeof FS === "undefined") {  // Freesound API js library is required to use load Freesound buffers
                    console.error( "trace.js: Freesound library is missing, won't be able to load sounds from Freesound" );
                } else {
                    var freesound = new Freesound('d34c2909acd242819a7f4ceba6a7c041', true);
                } 

                var store = {}; // keeping all loaded buffers here

                function loadBuffer(url, callback) {
                    var request = new XMLHttpRequest();
                    var filename = url.replace(/^.*[\\\/]/, '');
                    request.open("GET", url, true);
                    request.responseType = "arraybuffer";
                    request.onload = function() {
                        userContext.decodeAudioData(
                            request.response,
                            function(buffer) {
                                if (!buffer) {
                                  console.error('trace.js: error decoding file data: ' + url);
                                  callback(false);
                                  return;
                                }
                                store[filename] = buffer;
                                callback(true, buffer);
                            }
                        );
                    }
                    request.onerror = function() {
                        console.error('trace.js: XHR error while loading buffer');
                        callback(false);
                    }
                    request.send();
                }

                function loadFreesoundBuffer (id, analysis, callback) {
                    var url, filename, returnedSndInfo;
                    var request = new XMLHttpRequest();
                    freesound.getSound(id, function(sound){
                        returnedSndInfo = sound;
                        url = sound.properties['preview-hq-mp3'];
                        filename = id;//url.replace(/^.*[\\\/]/, '');
                        request.open("GET", url, true);
                        request.responseType = "arraybuffer";
                        request.send();
                        }, 
                        function(){console.error("trace.js: error fetching Freesound resource: " + id);
                    });
                    request.onload = function() {
                        userContext.decodeAudioData(
                            request.response,
                            function(buffer) {
                                if (!buffer) {
                                    console.error('trace.js: error decoding file data: ' + url);
                                    return;
                                }
                                if(analysis) {
                                    buffer.meta = returnedSndInfo;
                                    returnedSndInfo.getAnalysisFrames(function(analysis){
                                        buffer.meta.properties.analysis_frames = analysis;
                                        store[filename] = buffer;
                                        callback(true, buffer);
                                    });
                                } else {
                                    store[filename] = buffer;
                                    callback(true, buffer);
                                }          
                            }
                        );
                    }
                    request.onerror = function() {
                        console.error('trace.js: XHR error while loading Freesound buffer');
                        callback(false);
                    }   
                }

                return {
                    get: function(name){
                        if (name) {
                            return (store.hasOwnProperty(name)) ? store[name] : false;
                        } else {
                            return store;
                        }
                    },
                    remove: function(name){
                        if (name){
                            if (store.hasOwnProperty(name)) {
                                delete store[name];
                            }
                        }
                    },
                    load: function(url, callback){
                        if( Object.prototype.toString.call( url ) === '[object Array]' ){
                            var count = 0;
                            var i;
                            var buffers = [];
                            for (i = 0; i < url.length; ++i) {
                                loadBuffer(url[i], function(status, buffer){
                                    if (status){
                                        ++count;
                                        buffers.push(buffer);
                                    } 
                                    if (count === url.length) {
                                        if (callback) callback(buffers);
                                    }
                                    if (count !== url.length && i === url.length-1) {
                                        if (callback) callback(false);
                                    }
                                });                               
                            }      
                        } else {
                            loadBuffer(url, function(status, buffer){
                                if (status){
                                    if (callback) callback(buffer);
                                } else {
                                     if (callback) callback(false);
                                }
                            });
                        }
                    },
                    loadFreesound : function(id, analysis, callback){
                        if (!freesound) return;
                        if( Object.prototype.toString.call( id ) === '[object Array]' ){
                            var count = 0;
                            var i;
                            var buffers = [];
                            for (i = 0; i < id.length; ++i) {
                                loadFreesoundBuffer(id[i], analysis, function(status, buffer){
                                    if (status){
                                        ++count;
                                        buffers.push(buffer);
                                    } 
                                    if (count === id.length) {
                                        if (callback) callback(buffers);
                                    }
                                    if (count !== id.length && i === id.length-1) {
                                        if (callback) callback(false);
                                    }
                                });                               
                            }      
                        } else {
                            loadFreesoundBuffer(id, analysis, function(status, buffer){
                                if (status){
                                    if (callback) callback(buffer);
                                } else {
                                     if (callback) callback(false);
                                }
                            });
                        }
                    }
                }
            })(); 

            ////////// /////////     
        },
        version = "0.1",
        set = "setValueAtTime",
        linear = "linearRampToValueAtTime",
        pipe = function (param, val) {param.value = val}, 
        Super = Object.create(null, {
            connect: {
                value: function (target) {
                    this.output.connect(target);
                }
            },
            disconnect: {
                value: function () {
                    this.output.disconnect();
                }
            },
            connectInOrder: {
                value: function (nodeArray) {
                    var i = nodeArray.length - 1;
                    while (i--) {
                        if (!nodeArray[i].connect) {
                            return console.error("AudioNode.connectInOrder: TypeError: Not an AudioNode.", nodeArray[i]);
                        }
                        if (nodeArray[i + 1].input) {
                            nodeArray[i].connect(nodeArray[i + 1].input);
                        } else {
                            nodeArray[i].connect(nodeArray[i + 1]);
                        }
                    }
                }
            },
            getDefaults: {
                value: function () {
                    var result = {};
                    for (var key in this.defaults) {
                        result[key] = this.defaults[key].value;
                    }
                    return result;
                }
            },
            automate: {
                value: function (property, value, duration, startTime) {
                    var start = startTime ? ~~(startTime / 1000) : userContext.currentTime,
                        dur = duration ? ~~(duration / 1000) : 0,
                        _is = this.defaults[property],
                        param = this[property],
                        method;

                    if (param) {
                        if (_is.automatable) {
                           if (!duration) {
                                method = set;
                            } else {
                                method = linear;
                                param.cancelScheduledValues(start);
                                param.setValueAtTime(param.value, start);
                            }
                            param[method](value, dur + start);
                        } else {
                            param = value;
                        }
                    } else {
                        console.error("Invalid Property for " + this.name);
                    }
                } 
            }
        }), 
        FLOAT = "float",
        BOOLEAN = "boolean",
        STRING = "string",
        INT = "int";

    function dbToWAVolume (db) {
        return Math.max(0, Math.round(100 * Math.pow(2, db / 6)) / 100);   
    }
    function fmod (x, y) {
        // http://kevin.vanzonneveld.net
        // +   original by: Onno Marsman
        // +      input by: Brett Zamir (http://brett-zamir.me)
        // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        // *     example 1: fmod(5.7, 1.3);
        // *     returns 1: 0.5
        var tmp, tmp2, p = 0,
            pY = 0,
            l = 0.0,
            l2 = 0.0;

        tmp = x.toExponential().match(/^.\.?(.*)e(.+)$/);
        p = parseInt(tmp[2], 10) - (tmp[1] + '').length;
        tmp = y.toExponential().match(/^.\.?(.*)e(.+)$/);
        pY = parseInt(tmp[2], 10) - (tmp[1] + '').length;

        if (pY > p) {
            p = pY;
        }

        tmp2 = (x % y);

        if (p < -100 || p > 20) {
            // toFixed will give an out of bound error so we fix it like this:
            l = Math.round(Math.log(tmp2) / Math.log(10));
            l2 = Math.pow(10, l);

            return (tmp2 / l2).toFixed(l - p) * l2;
        } else {
            return parseFloat(tmp2.toFixed(-p));
        }
    }
    function sign (x) {
        if (x == 0) {
            return 1;
        } else {
            return Math.abs(x) / x;
        }
    }
    function tanh (n) {
        return (Math.exp(n) - Math.exp(-n)) / (Math.exp(n) + Math.exp(-n));
    }

    ////////// Container for sounds positioned in 3D space ////////////

    Trace.prototype.Sound3D = function(properties){

        if (!properties) {
            properties = this.getDefaults();
        }

        THREE.Object3D.call(this);

        this.input = userContext.createGainNode();
        this.panner = userContext.createPanner();
        this.output = userContext.createGainNode();
        this.analyser = new userInstance.Analyser();

        this.input.connect(this.panner);
        this.input.connect(this.analyser.input);
        this.panner.connect(this.output);
        this.output.connect(userContext.destination); // destination might be a mixer later

        this.init();
        
        this.sampleRate = userContext.sampleRate;

        this.oldPosition = new THREE.Vector3();
        this.posDelta = new THREE.Vector3();

        this.buffer = properties.buffer || this.defaults.buffer.value;
        this.buildRate = properties.buildRate || this.defaults.buildRate.value;

        this.building = false;

    };

    Trace.prototype.Sound3D.prototype = Object.create(new THREE.Object3D(), {
        traceName: {value: "Sound3D"},
        defaults: {
            value: {
                buffer: {value: null, automatable: false},
                buildRate: {value: 1024, automatable: false, type: INT}
            }
        }, 
        panPos: {  
            value: function (value) {
                this.oldPosition.copy( this.position );
                this.position.copy( value );
                this.posDelta.sub( this.position, this.oldPosition );
                this.panner.setPosition( this.position.x, this.position.y, this.position.z );
                this.panner.setVelocity( this.posDelta.x, this.posDelta.y, this.posDelta.z );       
            }
        },
        play: {
            enumerable: true,
            value: function(value){

                var self = this;
                    seq = value,
                    length = 0,
                    current = 0;
                    
                function onSamplerStop(){
                    if(current === length) self.stop();
                    if(current < length) playNext(current);              
                }

                this.sampler = new userInstance.Sampler({onStop: onSamplerStop});
                this.builder = userContext.createJavaScriptNode(this.buildRate);
                this.builder.onaudioprocess = function(e) {self.build()};

                if( Object.prototype.toString.call( seq ) === '[object Array]' ){

                    length = seq.length;
                    var playNext = function (seqNr){
                        ++current;
                        self.buffer = seq[seqNr].sample; 
                        var buffer = (!seq[seqNr].sample) ? self.buffer : seq[seqNr].sample;
                        var start = (!seq[seqNr].sampleStart) ?  0 : seq[seqNr].sampleStart;
                        var duration = (!seq[seqNr].sampleDuration) ? 0 : seq[seqNr].sampleDuration;
                        self.builder.connect(self.output);
                        self.sampler.connect(self.input);
                        self.sampler.play(buffer, start, duration); 
                        // if (seq[seqNr].position) self.panPos(seq[seqNr].position);
                        // if (self.parent && self.parent.turtle && seq[seqNr].position) self.parent.turtle.position.copy(seq[seqNr].position);    
                    }
                    playNext(current);

                } else {
                    length = 1;
                    ++current;
                    self.buffer = seq.sample; 
                    var buffer = (!seq.sample) ? this.buffer : seq.sample;
                    var start = (!seq.sampleStart) ?  0 : seq.sampleStart;
                    var duration = (!seq.sampleDuration) ? 0 : seq.sampleDuration;
                    self.builder.connect(self.output);
                    this.sampler.connect(this.input);
                    this.sampler.play(buffer, start, duration);
                    // if (seq.position) this.panPos(seq.position);
                    // if (this.parent && this.parent.turtle && seq.position) this.parent.turtle.position.copy(seq.position);
                }
            }
        },
        stop: {
            enumerable: true,
            value: function(){
                if(this.sampler) this.sampler.disconnect(this.input);
                if(this.builder) this.builder.disconnect(this.output);
            }
        },
        build: {
            value: function(){
              
                if(this.parent && this.parent.turtle){


                    var angle = 0,
                        turtle = this.parent.turtle,
                        analysis = this.analyser.analysis,
                        cent = 360  / analysis.centroid * analysis.loudness;

                    if (!isFinite(cent)){
                        cent = 0;
                    }

                    if (analysis.loudness > 0){
                        if (turtle.stack.length>0) turtle.pop();
                        turtle.penDown; 

                        if (analysis.loudness > analysis.avgLoudness){
                            //turtle.push();
                            cent /= -100 * Math.sin(analysis.loudness);
                            angle = cent * analysis.loudness / 10;
                        }

                        turtle.pitch(angle);
                        turtle.yaw(cent);
                        //turtle.roll(cent);
                        var width = Math.log(analysis.loudness)+cent;
                        (width < 0) ? width *= -1 : width = width;
                        turtle.setWidth(width);
                        var distance = analysis.loudness*Math.atan(cent)/10;
                        (distance < 0) ? distance *= -1 : distance = distance;
                        var drop = turtle.drop(distance);
                       
                        
                        drop.sample = this.buffer;
                        var delta = userContext.currentTime - this.sampler.lastTimeCheck;
                        drop.sampleDuration = ( delta > 0 ) ? delta : this.builder.bufferSize / this.sampleRate;
                        drop.sampleStart = this.sampler.meanTime;
                        drop.collectable = true;
                         
                        //console.log(drop);

                        this.parent.add(drop);
                        this.panPos(turtle.position);
                                    
                    }

                }            
            }
        },    
        init: {
            value: function(){
                this.panner.refDistance = 20;
                this.panner.rolloffFactor = 2;
            }
        },
        getDefaults: {
                value: function () {
                    var result = {};
                    for (var key in this.defaults) {
                        result[key] = this.defaults[key].value;
                    }
                    return result;
                }
        },
        connect: {
            value: function (target) {
                 this.output.connect(target);
            }
        },
        disconnect: {
            value: function () {
                this.output.disconnect();
            }
        }
    });
    

    //////////// //////////////

    Trace.prototype.Sampler = function(properties){
        if (!properties) {
            properties = this.getDefaults();
        }

        this.output = userContext.createGainNode();
        this.input = userContext.createGainNode();

        this.input.connect(this.output);

        this.voices = {};
        this.maxVoices = properties.maxVoices || this.defaults.maxVoices.value;
        this.onStop = properties.onStop || this.defaults.onStop.value;
        this.playing = false;

        this.lastTimeCheck = userContext.currentTime;

    };
    Trace.prototype.Sampler.prototype = Object.create(Super, {
        traceName: {value: "Sampler"},
        defaults: {
            value: {
                maxVoices: {value: 1, automatable: false, type: INT},
                onStop: {value: function(){}, automatable: false}
            }
        },
        play: {
            enumerable: true,
            value: function(buffer, start, duration){
                var self = this;
                var removeVoice = function(index){
                    if(self.voices.hasOwnProperty(index)) delete self.voices[index];
                    if(self.playing && self.voiceCount === 0) {
                        self.stop();
                    }
                };
                var index = this.voiceCount;
                if(index <= this.maxVoices - 1){
                    var voice = new userInstance.Voice({parent: this, buffer: buffer, onStop: removeVoice, index: index, start: start, duration: duration});
                    this.voices[index] = voice;
                    voice.play();
                    this.playing = true; 
                } else {
                    console.log("trace.js: "+this.traceName+" can only play " + this.maxVoices + " buffer at a time");
                }
            }
        },
        stop: {
            value: function(){
                if (this.voiceCount > 0) {
                    for (k in this.voices){
                        if (this.voices.hasOwnProperty(k)) this.voices[k].stop(); 
                    }
                }
                this.playing = false;
                this.onStop();        
            }
        },
        voiceCount: {
            get: function(){
                var voiceCount = 0;
                for (k in this.voices){
                    if (this.voices.hasOwnProperty(k)) ++voiceCount; 
                }
                return voiceCount;
            }
        },
        meanTime: {
            get: function(){
                var totalTime = 0;
                for (k in this.voices){
                    if (this.voices.hasOwnProperty(k)) {
                        totalTime += this.voices[k].time;
                    }   
                }
                this.lastTimeCheck = userContext.currentTime;      
                return (this.voiceCount) ? totalTime / this.voiceCount : 0;
            }
        }   
    });

    ///////////// //////////////

    Trace.prototype.Voice = function(properties){
        if(!properties) {
            properties = this.getDefaults();
        }

        var self = this;

        this.source = userContext.createBufferSource(mixToMono = false);
        this.output = userContext.createGainNode();
        this.playHead = userContext.createJavaScriptNode(256, 1, 1);
        this.playHead.onaudioprocess = function(e) {self.follow()};

        this.parent = properties.parent || this.defaults.parent.value;

        this.source.connect(this.output);
        this.connect(this.parent.input);

        this.source.buffer = properties.buffer || this.defaults.buffer.value;
        this.start = properties.start || this.defaults.start.value;
        this.duration = properties.duration || this.defaults.duration.value;
        this.onStop = properties.onStop || this.defaults.onStop.value;
        this.index = properties.index || this.defaults.index.value;

        this.playHeadPos = 0;
        this.playing = false;

    };
    Trace.prototype.Voice.prototype = Object.create(Super, {
        traceName: {value: "Voice"},
        defaults: {
            value: {
                parent: {value: null, automatable: false},
                buffer: {value: null, automatable: false},
                onStop: {value: function(){}, automatable: false},
                index: {value: 0, automatable: false},
                start: {value: 0, automatable: false},
                duration : {value: 0, automatable: false}
            }
        },
        play: {
            value: function () {
                this.duration = (this.duration === 0) ? this.source.buffer.duration-this.start : this.duration;
                this.source.start = userContext.currentTime;
                this.playHead.connect(this.output);
                this.source.noteGrainOn(0, this.start, this.duration); 
                this.playing = true;
            }
        },
        stop: {
            value: function() {
                this.source.noteOff(0);
                this.playHead.disconnect(this.output);
                this.playing = false;
                if(this.onStop) this.onStop(this.index); 
            }
        },
        follow: {
            value: function() {
                if (this.playing) {
                    this.playHeadPos = userContext.currentTime - this.source.start;
                }
                if (this.playHeadPos >= this.duration && this.playing){
                    this.stop();
                }
            }
        },
        time: {
            get: function() {
                return this.start + this.playHeadPos;
            }
        }
    });

    //////////// //////////////

    Trace.prototype.Analyser = function(properties){
        if (!properties) {
            properties = this.getDefaults();
        }

        this.input = userContext.createGainNode();
        this.output = userContext.createGainNode();
        this.anal = userContext.createAnalyser();

        this.input.connect(this.anal);
        this.input.connect(this.output);

        this.init();

        this.sampleRate = userContext.sampleRate;
        this.fftRes = this.sampleRate / this.anal.fftSize;

        this.count = 0;
        this.sumCentroid = 0;
        this.sumLoudness = 0;

    };
    Trace.prototype.Analyser.prototype = Object.create(Super, {
        traceName: {value: "Analyser"},
        defaults: {
            value: {
                
            }
        },
        fft: {
            get: function(){
                var freqData = new Uint8Array(this.anal.frequencyBinCount);
                this.anal.getByteFrequencyData(freqData);
                ++this.count;
                return freqData;
            }
        },
        computeCentroid: {
            get: function(){
                var freqData = this.fft;
                var centroid = 0.0, mag = 0.0, num = 0.0, den = 0.0;
                for (var i = 0; i < freqData.length; i++){
                    mag = freqData[i]*freqData[i];
                    num += i * mag * this.fftRes;   
                    den += mag;
                }
                (den) ? centroid = num / den : centroid = 0.0;  
                this.sumCentroid += centroid;
                return centroid;
            }     
        },
        computeLoudness: {
            get: function(){
                var freqData = this.fft;
                var val = 0, length = freqData.length ;
                for (var i = 0; i < length; i++){
                    val += freqData[i]; 
                }
                var loudness = val / length;
                this.sumLoudness += loudness;   
                return loudness;
            }
        },
        analysis: {
            get: function(){
                var result = {};
                result.centroid = this.computeCentroid,
                result.loudness = this.computeLoudness,
                result.avgCentroid = (this.sumCentroid) ? this.sumCentroid / this.count : 0;
                result.avgLoudness = (this.sumLoudness) ? this.sumLoudness / this.count : 0;
                return result;
            }
        },
        init: {
            value: function(){
                this.anal.fftSize = 512;
                this.anal.smoothingTimeConstant = 0.3;
            }
        } 

    });
 
    Trace.toString = Trace.prototype.toString = function () {
        return "Trace " + version + " by eleventigers!";
    };
    (typeof define != "undefined" ? (define("Trace", [], function () {return Trace})) : window.Trace = Trace)
	
})(this);