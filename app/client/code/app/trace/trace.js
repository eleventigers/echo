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
            activate: {
                writable: true, 
                value: function (doActivate) {
                    if (doActivate) {
                        //console.log("activating: " + this.name)
                        this.input.disconnect();
                        this.input.connect(this.activateNode);
                        this.activateCallback && this.activateCallback(doActivate);
                    } else {
                        //console.log("deactiving: " + this.name)
                        this.input.disconnect();
                        this.input.connect(this.output);
                    }
                }  
            },
            bypass: {
                get: function () {return this._bypass},
                set: function (value) {
                    if (this._lastBypassValue === value) {return}
                    this._bypass = value;
                    this.activate(!value);
                    this._lastBypassValue = value;
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

    Trace.prototype.Sound3D = function(properties){

        if (!properties) {
            properties = this.getDefaults();
        }

        THREE.Object3D.call(this);

        this.input = userContext.createGainNode();
        this.activateNode = userContext.createGainNode();
        this.panner = userContext.createPanner();
        this.output = userContext.createGainNode();
        this.analyser = userContext.createAnalyser();  

        this.activateNode.connect(this.panner);
        this.activateNode.connect(this.analyser);
        this.panner.connect(this.output);

        this.panner.refDistance = properties.refDistance || this.defaults.refDistance.value;
        this.panner.rolloffFactor = properties.rolloffFactor || this.defaults.rolloffFactor.value; 
        this.analyser.smoothingTimeConstant = properties.smoothingTimeConstant || this.defaults.smoothingTimeConstant.value; 
        this.analyser.fftSize = properties.fftSize || this.defaults.fftSize.value; 
        this.sampleRate = userContext.sampleRate;
        this.fftRes = this.sampleRate / this.analyser.fftSize;
        this.bypass = false;

        this.oldPosition = new THREE.Vector3();
        this.posDelta = new THREE.Vector3();


    };

    Trace.prototype.Sound3D.prototype = THREE.Object3D();
    Trace.prototype.Sound3D.prototype = Object.create(Super, {
        traceName: {value: "Sound3D"},
        defaults: {
            value: {
                refDistance: {value: 20, min: 0, max: 1000, automatable: false, type: FLOAT},
                rolloffFactor: {value: 2, min: 0, max: 1000, automatable: false, type: FLOAT},
                smoothingTimeConstant: {value: 0.3, min: 0, max: 1, automatable: false, type: FLOAT},
                fftSize: {value: 2048, min: 256, max: 4096, automatable: false, type: INT},
                bypass: {value: true, automatable: false, type: BOOLEAN}
            }
        }, 
        panPos: {
            enumerable: true, 
            get: function () {return this.position},
            set: function (position) {
                console.log(position);
                this.oldPosition.copy( this.position );
                this.position.copy( position );
                this.posDelta.sub( this.position, this.oldPosition );
                this.panner.setPosition( this.position.x, this.position.y, this.position.z );
                this.panner.setVelocity( this.posDelta.x, this.posDelta.y, this.posDelta.z );       
            }
        }
    });
 
    Trace.toString = Trace.prototype.toString = function () {
        return "Trace " + version + " by eleventigers!";
    };
    (typeof define != "undefined" ? (define("Trace", [], function () {return Trace})) : window.Trace = Trace)
	
})(this);