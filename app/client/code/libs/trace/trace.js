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

                function loadFreesoundBuffer (id, callback, analysis) {
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
                    loadFreesound : function(id, callback, analysis){
                        if (!freesound) return;
                        if( Object.prototype.toString.call( id ) === '[object Array]' ){
                            var count = 0;
                            var i;
                            var buffers = [];
                            for (i = 0; i < id.length; ++i) {
                                loadFreesoundBuffer(id[i], function(status, buffer){
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
                                }, analysis);                               
                            }      
                        } else {
                            loadFreesoundBuffer(id, function(status, buffer){
                                if (status){
                                    if (callback) callback(buffer);
                                } else {
                                     if (callback) callback(false);
                                }
                            }, analysis);
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
    function freqToMidi(frequency){
        if(frequency) return 12 * Math.log(frequency/440)/Math.log(2)+69;
    }
    function pitchToColor(pitch){
        if(pitch >= 0 && pitch <= 127){
            var note = Math.round(pitch) % 12;
            switch(note){
                case 0:
                    return 0x7de700;
                case 1:
                    return 0x1cf8eb;
                case 2:
                    return 0x0472ee;
                case 3:
                    return 0x350ede;
                case 4:
                    return 0x8a34bd;
                case 5:
                    return 0x460d5a;
                case 6:
                    return 0x7b1264;
                case 7:
                    return 0xce2829;
                case 8:
                    return 0xea5212;
                case 9:
                    return 0xff7e00;
                case 10:
                    return 0xffe400;
                case 11:
                    return 0xc9f400;
            }
        } else {
            console.log("trace.js: supplied pitch is not withing MIDI reange");
        }

    }

    ////////// Container for sounds positioned in 3D space ////////////

    Trace.prototype.Sound3D = function(properties){

        if (!properties) {
            properties = this.getDefaults();
        }

        THREE.Object3D.call(this);

        var self = this;

        this.sampleRate = userContext.sampleRate;
        this.oldPosition = new THREE.Vector3();
        this.posDelta = new THREE.Vector3();
        this.buildRate = properties.buildRate || this.defaults.buildRate.value;
        this.building = properties.building || this.defaults.building.value;
        this.loop =  properties.loop || this.defaults.loop.value;

        this.input = userContext.createGainNode();
        this.panner = userContext.createPanner();
        this.output = userContext.createGainNode();
        this.analyser = new userInstance.Analyser();

        this.input.connect(this.panner);
        this.input.connect(this.analyser.input);
        
        this.panner.connect(this.output);
        this.output.connect(userContext.destination); // destination might be a mixer later
             
        this.capturedBuffers = (function(){
            var left = [];
            var right = [];    
            return {
                set : function(buffer){
                    if(buffer[0]) left.push(buffer[0]);
                    if(buffer[0]) right.push(buffer[0]);
                },
                get : function(){
                    var result = [];
                    result[0] = left.splice(0, left.length);
                    result[1] = right.splice(0, right.length);
                    return result;     
                }     
            }    
        })();

        this.init();

    };

    Trace.prototype.Sound3D.prototype = Object.create(new THREE.Object3D(), {
        traceName: {value: "Sound3D"},
        defaults: {
            value: {
                buildRate: {value: 4096, automatable: false, type: INT},
                building: {value: false, automatable:false, type:BOOLEAN},
                loop: {value: false, automatable:false, type:BOOLEAN}
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
            value: function(value, building){

                var self = this;
                var prevMesh;

                self.building = building;
                    
                function onSamplerStop(){
                        self.stop();
                        if(self.loop) self.play(self.drops, false);              
                }

                function onIndexChange(drop){
                   if(drop){
                        drop.dance();
                        self.panPos(drop.position);
                   } 

                }

                function onSamplerError(){
                    console.log("boom");
                    self.stop();
                    if(self.parent) self.parent.removeSelf();
                }

                function seqBuffs(value){
                    var segments = self.buffCat(value);
                    self.builder = userContext.createJavaScriptNode(self.buildRate);
                    self.builder.onaudioprocess = function(e) {if(self.building) self.build(e)};
                    self.sampler = new userInstance.Sampler({onStop: onSamplerStop, bufferData: segments, onIndexChange: onIndexChange, onError: onSamplerError}); 
                    self.sampler.connect(self.input);
                    self.input.connect(self.builder);
                    self.builder.connect(self.output);
                    self.sampler.playData();
                }
                
                function oneShot(value) {
                    self.builder = userContext.createJavaScriptNode(self.buildRate);
                    self.builder.onaudioprocess = function(e) {if(self.building) self.build(e)};
                    self.sampler = new userInstance.Sampler({onStop: onSamplerStop});
                    var buffer =  value.sample;
                    var start = value.sampleStart;
                    var duration = value.sampleDuration;
                    self.sampler.connect(self.input);
                    self.input.connect(self.builder);
                    self.builder.connect(self.output);
                    if(buffer) self.sampler.play(buffer, start, duration);    
                }

                if (Object.prototype.toString.call( value ) === '[object Array]') {     
                    seqBuffs(value);
                } else {
                    oneShot(value);
                }
                    
            }
        },
        stop: {
            enumerable: true,
            value: function(){
                if(this.sampler) {
                    this.sampler.disconnect(this.input);
                    this.sampler = null;
                };
                if(this.builder){
                    this.builder.disconnect(this.output);
                    this.builder = null;
                }
                
            }
        },
        build: {
            value: function(e){

                var channels = e.inputBuffer.numberOfChannels;
                var buffer = [];
                for (var i = 0; i < channels; ++i){
                    buffer[i] = new Float32Array(e.inputBuffer.getChannelData(i));
                }
                this.capturedBuffers.set(buffer);   

                if(this.parent && this.parent.turtle){

                    var angle = 0,
                        turtle = this.parent.turtle,
                        analysis = this.analyser.analysis;

                    var cent = 360  / analysis.centroid * analysis.loudness;

                    if (!isFinite(cent)){
                        cent = 0;
                    }

                    if (analysis.loudness > 1){

                        if (turtle.stack.length>0) turtle.pop();   
                   

                        if (analysis.loudness < analysis.avgLoudness){
                            turtle.push(); 
                            cent /= -100 * Math.cos(Math.PI*analysis.loudness);
                            angle = cent * analysis.loudness / 10;
                        }

                        turtle.pitch(angle);
                        turtle.yaw(cent);
                        // turtle.roll(angle);
                        var color = pitchToColor(freqToMidi(analysis.avgCentroid));
                        if(color) turtle.setColor(color);
                        var width = Math.log(analysis.loudness)*Math.sin(cent)*Math.PI;
                        (width < 0) ? width *= -Math.PI : width = width;
                        (width < 1) ? width = Math.PI : width = width;
                        turtle.setWidth(width);
                        var captured = this.capturedBuffers.get();
                        var distance = captured[0].length *  analysis.loudness / 3  ;
                        (distance < 0) ? distance *= -Math.PI : distance = distance;
                        
                        var drop = turtle.drop(distance);
                        drop.buffers = captured;
                        drop.collectable = true;  
                        drop.castShadow = true;
                        drop.material.wireframe = true;
                        //drop.receiveShadow = true;
                        this.parent.add(drop);
                        drop.dance();

                        this.panPos(turtle.position);
                                    
                    }

                }            
            }
        },
        drops : {
            get: function(){
                var dropped = [];
                var i;
                var children = this.parent.children;
                for (i = 0; i < children.length; ++i){
                    if (children[i].collectable) dropped.push(children[i]);
                }
                return dropped;
            }
        }, 
        dropBust: {
            value: function(){
               
                     // var newSegments = this.buffCat(this.drops);
                     // this.sampler.bufferData = newSegments;
                      
            }
        },
        buffCat: {
            value: function(value) {
                var length = value.length;
                var cat = [[],[],[]];
                for (var i = 0; i < length; ++i){
                     var seqBuffs = value[i].buffers;  
                     for (var j = 0; j < seqBuffs[0].length; ++j){
                        cat[0].push(seqBuffs[0][j]);
                        cat[1].push(seqBuffs[1][j]);
                        cat[2].push(value[i]);
                     }      
                }
                return cat;
            }
        },   
        init: {
            value: function(){
                this.panner.refDistance = 40;
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

        var self = this;

        this.output = userContext.createGainNode();
        this.input = userContext.createGainNode();   
        this.rebuilder = userContext.createJavaScriptNode(4096, 1, 2);
        this.rebuilder.onaudioprocess = function(e) { if(!this.bufferData) self.rebuild(e)};

        this.input.connect(this.output);

        this.voices = [];
        this.voiceCount = 0;
        this.maxVoices = properties.maxVoices || this.defaults.maxVoices.value;

        this.onStop = properties.onStop || this.defaults.onStop.value;
        this.onIndexChange = properties.onIndexChange || this.defaults.onIndexChange.value;
        this.onError = properties.onError || this.defaults.onError.value;

        this.han = this.generateHanning(4096);
        this.bufferData = properties.bufferData || this.defaults.bufferData.value;
        this.bufferIndex = 0;

        this.playing = false;

        this.initVoices();

    };
    Trace.prototype.Sampler.prototype = Object.create(Super, {
        traceName: {value: "Sampler"},
        defaults: {
            value: {
                maxVoices: {value: 2, automatable: false, type: INT},
                onStop: {value: function(){}, automatable: false},
                onIndexChange: {value: function(){}, automatable: false},
                onError: { value: function(){}, automatable: false},
                bufferData : {value: null, automatable: false}
            }
        },
        play: {
            enumerable: true,
            value: function(buffer, start, duration){      
                var idle = this.idleVoices;
                if(idle) {   
                    this.voices[idle[0]].play(buffer, start, duration);
                    this.voiceCount += 1;
                    this.playing = true; 
                } else {
                    console.log("voices all full");
                }  
            }
        },
        playData: {
             value : function(){
                    this.playing = true;
                    this.rebuilder.connect(this.input);     
            }
        },
        stop: {
             value : function(){
                this.playing = false;
                this.rebuilder.disconnect(this.input);  
                this.onStop();            
            }
        },
        rebuild: {
            value: function(e){
                    if (!this.bufferData[0]){
                        this.rebuilder.disconnect(this.input);
                        this.onError();
                        return;
                    } else {
                      
                        var id = this.bufferIndex;
                        var left = e.outputBuffer.getChannelData(0), right = e.outputBuffer.getChannelData(1);   
                        var isHan = (this.bufferIndex === 0 || this.bufferIndex === this.bufferData[0].length - 1);

                        this.onIndexChange(this.bufferData[2][id]);

                        for (var i = 0; i < left.length; ++i){
                            if(this.bufferData[0][id]) left[i] =  this.bufferData[0][id][i];
                            if(this.bufferData[1][id]) right[i] = this.bufferData[1][id][i];
                            if(isHan) left[i] *= this.han[i];
                            if(isHan) right[i] *= this.han[i];
                        }
                       
                        if (this.bufferIndex === this.bufferData[0].length - 1) this.stop();
                        ++this.bufferIndex;     
                    }          
            }
        },
        idleVoices: {
            get:function(){
                var i, notPlaying = [];
                for(i = 0; i < this.voices.length; ++i){
                    if(!this.voices[i].playing) {
                        notPlaying.push(i);
                    }
                }
                return (notPlaying.length > 0) ? notPlaying : 0; 
            }
        },
        meanTime: {
            get: function(){
                var totalTime = 0;
                var active = 1;
                for (var i = 0; i < this.voices.length; ++i){
                    if(this.voices[i].playing) {
                        totalTime += this.voices[i].time;
                        ++active
                    }        
                }
                return totalTime / active;
            }
        },
        generateHanning: {
            value: function(length){
                var curveLength = length;
                var curve = new Float32Array(curveLength);
                for (var i = 0; i < curveLength; ++i){
                    curve[i] =  0.5 * ( 1 - Math.cos( (2*Math.PI*i) / (curveLength+1 - 1) ) ); 
                }
                return curve;   
            }
        },
        initVoices: {
            value: function(){
                var i;
                var self = this;
                for (i = 0; i < this.maxVoices; ++i){
                     this.voices.push(new userInstance.Voice({
                        parent: this, 
                        onStop: function(){ 
                            self.voiceCount -= 1;  
                            if(self.playing && self.voiceCount === 0) {
                                self.stop();  
                            }   
                        }    
                    }));
                }
            }
        }
    });

    ///////////// //////////////

    Trace.prototype.Voice = function(properties){
        if(!properties) {
            properties = this.getDefaults();
        }

        var self = this;
        
        this.output = userContext.createGainNode();
        this.playHead = userContext.createJavaScriptNode(256, 0, 1);
        this.playHead.onaudioprocess = function(e) {self.follow(e)};

        this.parent = properties.parent || this.defaults.parent.value;
        this.onStop = properties.onStop || this.defaults.onStop.value;

        this.playHeadPos = 0;
        this.playing = false;
      
        this.connect(this.parent.input);

    };
    Trace.prototype.Voice.prototype = Object.create(Super, {
        traceName: {value: "Voice"},
        defaults: {
            value: {
                parent: {value: null, automatable: false},
                onStop: {value: function(){}, automatable: false},
            }
        },
        play: {
            value: function (buffer, start, duration) {
                if (buffer && buffer.constructor.name === "AudioBuffer") {
                    this.source = userContext.createBufferSource(mixToMono = false);
                    this.source.buffer = buffer;          
                    this.start = (start) ? start : 0;
                    this.duration = (duration) ? duration : this.source.buffer.duration;
                    this.source.start = userContext.currentTime; 
                    this.source.noteGrainOn(0, this.start, this.duration); 
                    this.playHead.connect(this.output);
                    this.source.connect(this.output);
                    this.playing = true;
                }       
            }
        },
        stop: {
            value: function() {
                this.playing = false;
                if(this.onStop) this.onStop(this.index); 
                this.source.noteOff(0);
                this.playHead.disconnect(this.output);
                      
            }
        },
        follow: {
            value: function(e) {
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
                //console.log("fft");
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
                this.anal.fftSize = 2048;
                this.anal.smoothingTimeConstant = 0.3;
            }
        } 
    });
 
    Trace.toString = Trace.prototype.toString = function () {
        return "Trace " + version + " by eleventigers!";
    };
    (typeof define != "undefined" ? (define("Trace", [], function () {return Trace})) : window.Trace = Trace)
	
})(this);