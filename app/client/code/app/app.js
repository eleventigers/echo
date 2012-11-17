if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var GameState = require('/state/GameState');
var StateManager = require('/state/StateManager');
var Turtle = require('/turtle/turtle');
var Struct = require('/struct/struct');
Struct.Tree = require('/struct/tree');
Struct.Segment = require('/struct/segment');

var Game = require('/game');
Game.init();