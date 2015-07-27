(function (window) {
	var userContext, userInstance, userMixer, userCompressor, userReverb, userReverbPre
        Trace = function (context) {
            if (!context) {
                context = window.AudioContext && (new window.AudioContext());
            }

            userContext = context;
            userInstance = this;
            console.log(userContext)
            userMixer = userContext.createGain();

            userCompressor = userContext.createDynamicsCompressor();
            userCompressor.ratio.value = 20;
            userCompressor.threshold.value = -20;

            userReverb = new userInstance.ImpulseReverb();
            userReverbPre = userContext.createGain();
            userReverbPre.connect(userReverb.input);
            userReverb.connect(userCompressor);

            userMixer.connect(userCompressor);
            userCompressor.connect(userContext.destination);

            this.mixer = (function(){
                return {
                    level : function(value){
                        if(!value && value > 1 || value < 0) return;
                        value = (value === 0) ? 0.0001 : value;
                        userMixer.gain.value = value;
                        userReverbPre.gain.value = value;
                    }
                }
            })();

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
                        },
                        getPosition: function(){
                            return posNew;
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
                                callback(buffer);
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
                        function(){
                            console.error("trace.js: error fetching Freesound resource: " + id);
                            callback(false);
                        }
                    );
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
                                        callback(buffer);
                                    });
                                } else {
                                    store[filename] = buffer;
                                    callback(buffer);
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
                    load: function(list, oncomplete, onprogress, onerror){

                        var buffers = [];

                        if( Object.prototype.toString.call( list ) === '[object Array]' ){
                            next(list, 0);
                        } else {
                            next([list], 0);
                        }

                         function next(list, index){
                            if(list.length > 0){
                                loadBuffer(list[index], function(buffer){
                                    if(buffer){
                                        if(onprogress) onprogress(list[index]);
                                        buffers.push(buffer);
                                    } else {
                                        if(onerror) onerror(list[index]);
                                    }
                                    if(index != list.length-1) {
                                        next(list, index+1);
                                    } else {
                                       if(oncomplete) oncomplete(buffers);
                                    }
                                });
                            } else {
                                console.error("trace.js: trying to load an empty list!")
                            }
                        }

                    },
                    loadFreesound : function(list, oncomplete, onprogress, onerror, analysis){
                        if (!freesound) return;

                        var buffers = [];

                        if( Object.prototype.toString.call( list ) === '[object Array]' ){
                            next(list, 0);
                        } else {
                            next([list], 0);
                        }

                        function next(list, index){
                            if(list.length > 0){
                                loadFreesoundBuffer(list[index], function(buffer){
                                    if(buffer){
                                        if(onprogress) onprogress(list[index]);
                                        buffers.push(buffer);
                                    } else {
                                        if(onerror) onerror(list[index]);
                                    }
                                    if(index != list.length-1) {
                                        next(list, index+1);
                                    } else {
                                       if(oncomplete) oncomplete(buffers);
                                    }
                                }, analysis);
                            } else {
                                console.error("trace.js: trying to load an empty list!")
                            }
                        }
                    }
                }
            })();

            this.buffers.load('sounds/41451__sandyrb__3auc-ir-close-003.mp3', function(buffers){
                userReverb.buffer = buffers[0];
            });

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

    function dbTomp3olume (db) {
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
            // console.log("trace.js: supplied pitch is not within MIDI range");
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

        this.input = userContext.createGain();
        this.panner = userContext.createPanner();
        this.output = userContext.createGain();
        this.send = userContext.createGain();

        this.analyser = new userInstance.Analyser();
        this.builder = userContext.createScriptProcessor(this.buildRate);
        this.builder.onaudioprocess = function(e) {if(self.building) self.build(e)};
        this.sampler = new userInstance.Sampler();

        this.input.connect(this.panner);;
        this.input.connect(this.analyser.input);

        this.panner.connect(this.output);

        this.panner.setPosition( this.position.x, this.position.y, this.position.z );
        this.output.connect(userMixer);
        this.panner.connect(this.send);
        this.send.connect(userReverbPre);

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
                loop: {value: false, automatable:false, type:BOOLEAN},
            }
        },
        panPos: {
            value: function (value) {
                this.oldPosition.copy( this.position );
                this.position.copy( value );
                this.posDelta.sub( this.position, this.oldPosition );
                this.panner.setPosition( this.position.x, this.position.y, this.position.z );
                this.panner.setVelocity( this.posDelta.x, this.posDelta.y, this.posDelta.z );
                var toListener = this.position.distanceTo(userInstance.listener.getPosition());
                var sendGain = Math.log(toListener);
                this.send.gain.value = Math.min(1, sendGain/5);
                this.output.gain.value = 1/sendGain*2;
            }
        },
        play: {
            enumerable: true,
            value: function(value){

                var self = this;
                var prevMesh;

                if(value) {
                    this.building = value.building || false;
                    this.loop = value.loop || false;
                    this.suicide = value.suicide || false;
                }

                function onSamplerStop(){
                    self.stop();
                    if(self.loop) self.play({buffer:self.drops, loop:true});
                }

                function onIndexChange(drop){
                   if(drop){
                        drop.dance({suicide: self.suicide});
                        self.panPos(drop.matrixWorld.getPosition());
                   }
                }

                function onSamplerError(){
                    console.log("trace.js: boom ");
                    self.stop();
                    if(self.parent) self.parent.removeSelf();
                }

                function seqBuffs(value){
                    var segments = self.buffCat(value);
                    self.sampler.connect(self.input);
                    self.input.connect(self.builder);
                    self.builder.connect(self.output);
                    self.sampler.playData({buffer: segments, onStop: onSamplerStop, onIndexChange: onIndexChange, onError: onSamplerError});
                }

                function oneShot(value) {
                    var buffer =  value.buffer;
                    var start = value.sampleStart;
                    var duration = value.sampleDuration;
                    self.sampler.connect(self.input);
                    self.input.connect(self.builder);
                    self.builder.connect(self.output);
                    if(buffer) self.sampler.play({buffer: buffer, start: start, duration: duration, onStop: onSamplerStop});
                }

                if (!value){
                    if(this.building) {
                        this.building = false;
                    }
                    this.stop();
                    this.play({buffer:this.drops, building:false, loop:false});
                } else {
                    if (Object.prototype.toString.call( value.buffer ) === '[object Array]') {
                        seqBuffs(value.buffer);
                    }  else {
                        oneShot(value);
                    }
                }
            }
        },
        stop: {
            enumerable: true,
            value: function(){
                if(this.sampler) {
                    this.sampler.disconnect();
                };
                if(this.builder){
                    this.builder.disconnect();
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

                    this.panPos(this.parent.turtle.matrixWorld.getPosition());

                    var angle = 0,
                        analysis = this.analyser.analysis,
                        cent = 360  / analysis.centroid * analysis.loudness / 2;

                    if (!isFinite(cent)){
                        cent = 0;
                    }

                    if (analysis.loudness > analysis.avgLoudness){
                        if (analysis.centroid > analysis.avgCentroid){
                            cent *= Math.cos(cent)*Math.log(analysis.loudness)+Math.random()*2-1;
                        }
                        // turtle.push();
                        if (analysis.centroid <= analysis.avgCentroid){
                             //if (turtle.stack.length>0) turtle.pop();
                            cent /= 100 * Math.sin(analysis.loudness);
                            angle = cent * analysis.loudness;
                            analysis.loudness;
                        }

                        this.parent.turtle.pitch(cent);
                        this.parent.turtle.yaw(angle);
                        // this.parent.turtle.roll(angle);
                        var color = pitchToColor(freqToMidi(analysis.avgCentroid));
                        if(color) this.parent.turtle.setColor(color);
                        var width = Math.log(analysis.loudness)*Math.sin(cent)*Math.PI;
                        (width < 0) ? width *= -Math.PI : width = width;
                        if (width < 1) width += Math.PI;
                        this.parent.turtle.setWidth(width);
                        var captured = this.capturedBuffers.get();
                        var distance = captured[0].length *  analysis.loudness / 3;
                        (distance < 0) ? distance *= -Math.PI : distance = distance;
                        if (distance < 1) distance += Math.PI;

                        var drop = this.parent.turtle.drop(distance);
                        drop.buffers = captured;
                        drop.collectable = true;
                        drop.castShadow = true;
                        drop.material.wireframe = true;
                        this.parent.add(drop);
                        drop.dance({suicide: this.suicide});


                    }

                }
            }
        },
        drops : {
            get: function(){
                var dropped = [];
                var i;
                if(this.parent){
                    var children = this.parent.children;
                    for (i = 0; i < children.length; ++i){
                        if (children[i].collectable) dropped.push(children[i]);
                    }
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
                var seqBuffs = [];
                var i;
                for (i = 0; i < length; ++i){
                     seqBuffs = value[i].buffers;
                     for (var j = 0; j < seqBuffs[0].length; ++j){
                        cat[0].push(seqBuffs[0][j]);
                        cat[1].push(seqBuffs[1][j]);
                        cat[2].push(value[i]);
                     }
                }
                return cat;
            }
        },
        removeSelf: {
            value: function(){
                this.stop();
                if(this.parent)this.parent.remove(this);
                this.deallocate();
            }
        },
        init: {
            value: function(){
                this.output.gain.value = 0.8;
                this.panner.refDistance = 70;
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


        this.voices = [];
        this.voiceCount = 0;
        this.maxVoices = properties.maxVoices || this.defaults.maxVoices.value;
        this.buildRate = properties.buildRate || this.defaults.buildRate.value;
        this.onStop = properties.onStop || this.defaults.onStop.value;
        this.onIndexChange = properties.onIndexChange || this.defaults.onIndexChange.value;
        this.onError = properties.onError || this.defaults.onError.value;

        this.han = this.generateHanning(this.buildRate);
        this.bufferData = properties.bufferData || this.defaults.bufferData.value;
        this.bufferIndex = 0;
        this.playing = false;

        this.output = userContext.createGain();
        this.input = userContext.createGain();
        this.rebuilder = userContext.createScriptProcessor(this.buildRate, 1, 2);
        this.rebuilder.onaudioprocess = function(e) { if(!this.bufferData) self.rebuild(e)};
        this.input.connect(this.output);

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
                bufferData : {value: [], automatable: false},
                buildRate: {value: 4096, automatable:false, type: INT}
            }
        },
        play: {
            enumerable: true,
            value: function(params){
                if(!params) return;
                var idle = this.idleVoices;
                if(idle) {
                    this.onStop = params.onStop;
                    this.voices[idle[0]].play(params.buffer, params.start, params.duration);
                    this.voiceCount += 1;
                    this.playing = true;
                } else {
                    console.log("voices all full");
                }
            }
        },
        playData: {
             value : function(params){
                    if(!params) return;
                    this.bufferIndex = 0;
                    this.bufferData = params.buffer;
                    this.onStop = params.onStop;
                    this.onIndexChange = params.onIndexChange;
                    this.onError = params.onError;
                    this.playing = true;
                    this.output.gain.setValueAtTime(0, userContext.currentTime);
                    this.output.gain.linearRampToValueAtTime(1, userContext.currentTime+0.15);
                    this.rebuilder.connect(this.input);
            }
        },
        stop: {
             value : function(){
                this.playing = false;
                this.rebuilder.disconnect();
                this.onStop();
            }
        },
        rebuild: {
            value: function(e){
                    if (!this.bufferData[0] || this.bufferData[0].length === 0){
                        this.rebuilder.disconnect();
                        this.onError();
                        return;
                    } else {

                        var isRand = (Math.random()*16 > 15);
                        var id = (isRand) ? Math.min(this.bufferData[2].length, this.bufferIndex+Math.floor(Math.random()*this.bufferData[2].length)) : this.bufferIndex;
                        var left = e.outputBuffer.getChannelData(0), right = e.outputBuffer.getChannelData(1);
                        var isHan = (this.bufferIndex === 0 || this.bufferIndex === this.bufferData[0].length - 1);
                        var currSegment = this.bufferData[2][id];

                        this.onIndexChange(currSegment);
                        if(currSegment && currSegment.children.length > 0){
                            for (var i = 0; i < currSegment.children.length; ++i){
                                if(currSegment.children[i].constructor === Struct.Tree && currSegment.children[i].sound) currSegment.children[i].sound.play();
                            }
                        }

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
                    curve[i] =  0.9 * ( 1 - Math.cos( (2*Math.PI*i) / (curveLength+1 - 1) ) );
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

        this.output = userContext.createGain();
        this.playHead = userContext.createScriptProcessor(256, 0, 1);
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
                    this.source.loopStart = userContext.currentTime;
                    this.output.gain.setValueAtTime(0, this.source.loopStart);
                    this.output.gain.linearRampToValueAtTime(1, this.source.loopStart+0.1);
                    this.source.start(0, this.start, this.duration);
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
                this.source.stop(0);
                this.playHead.disconnect(this.output);

            }
        },
        follow: {
            value: function(e) {
                if (this.playing) {
                    this.playHeadPos = userContext.currentTime - this.source.loopStart;
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

    Trace.prototype.ImpulseReverb = function(properties){
        if (!properties) {
            properties = this.getDefaults();

        }


        this.input = userContext.createGain();
        this.output = userContext.createGain();
        this.wet = userContext.createGain()
        this.convolver = userContext.createConvolver();

        this.input.connect(this.convolver);
        this.convolver.connect(this.wet);
        this.wet.connect(this.output);

    };

    Trace.prototype.ImpulseReverb.prototype = Object.create(Super, {
        traceName: {value: "ImpulseReverb"},
        defaults: {
            value: {

            }
        },

        buffer: {
            set: function(buffer){
                 if(buffer) this.convolver.buffer = buffer;
            }
        }
    });

    Trace.prototype.Analyser = function(properties){
        if (!properties) {
            properties = this.getDefaults();
        }

        this.input = userContext.createGain();
        this.output = userContext.createGain();
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
                this.anal.smoothingTimeConstant = 0.8;
            }
        }
    });

    Trace.toString = Trace.prototype.toString = function () {
        return "Trace " + version + " by eleventigers";
    };
    (typeof define != "undefined" ? (define("Trace", ['libs/three/three', 'libs/freesound/freesoundLib'], function () {return Trace})) : window.Trace = Trace)

})(this);