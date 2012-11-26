if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var GameState = require('/state/GameState');
var StateManager = require('/state/StateManager');
var Turtle = require('/turtle/turtle');
var Struct = require('/struct/struct');
Struct.Tree = require('/struct/tree');
Struct.Segment = require('/struct/segment');
Struct.Platform = require('/struct/platform');
var Level = require('/lvl/level');
Level.Zero = require('/lvl/zero');
var Sim = require('/sim/sim');
Sim.Spawner = require('/sim/spawner');
var Util = require('/util/util');
Util.Loader = require('/util/loader');

var Game = require('/game');
Game.init();