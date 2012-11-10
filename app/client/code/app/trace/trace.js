(function (window) {

	var userContext,
        userInstance,
        Trace = function (context) {
            if (!context) {
                console.log("tuna.js: Missing audio context! Creating a new context for you.");
                context = window.webkitAudioContext && (new window.webkitAudioContext());
            }
            userContext = context;
            userInstance = this;
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
    Trace.prototype.updateListener = function(object){
    	
    	




    }; 
    
    Trace.toString = Trace.prototype.toString = function () {
        return "You are running Trace version " + version + " by eleventigers!";
    };
    (typeof define != "undefined" ? (define("Trace", [], function () {return Trace})) : window.Trace = Trace)
	
})(this);