if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var Game = require('/game');
var Turtle = require('/turtle/turtle');
var Audio =  require('/audio/audio');
Audio.Scene = require('/audio/scene');
Audio.Tree = require('/audio/tree');

Game.init();