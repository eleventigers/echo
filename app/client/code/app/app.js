if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var GameState = require('/state/GameState');
var StateManager = require('/state/StateManager');
var Turtle = require('/turtle/turtle');
var Audio =  require('/audio/audio');
Audio.Scene = require('/audio/scene');
Audio.Tree = require('/audio/tree');

var Game = require('/game');
Game.init();