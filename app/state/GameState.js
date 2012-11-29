GameState = function () {

	// Game running or paused
	this.running = false;

	// Function fired on every iteration of the game loop
	this.onLoop = null;

	// Function fired when asked to render state
	this.onRender = null;
	
	// Function fired when state is activated
	this.onActivation = null;

	// Function fired when key is pressed
	this.onKeyDown = null;

	// Function fired when key is released
	this.onKeyUp = null;

	// Function fired on mouse move (receives previous x, previous y, current x, current y)
	this.onMouseMove  = null;

	this.onMouseDown  = null;

	this.onMouseUp  = null;

	// Function fired on window resize
	this.onResize = null;

	// Fired on pointer lock change
	this.onPointerLockChange = null;

	// Fired on pointer lock error
	this.onPointerLockError = null;

	// Events on game pause
	this.onPause = null;

	// 
	this.onResume = null;

	// When game restarts
	this.onRestart = null;

	// When game player fails
	this.onFail = null;

	// Custom controls object
	this.controls = null;

	// THREE.js renderer
	this.renderer = null;

	// THREE.js scene
	this.level = null;

	// THREE.js camera
	this.camera = null;

	// Web Audio context
	this.audio = null;

	// Standard stats
	this.stats = null;

	// Called when this state is set active
	this.onActivation = null;

	// Spawner
	this.spawner = null;


}

GameState.prototype.constructor = GameState;

GameState.prototype.setStateManager = function (state_manager) {
	this.stateManager = state_manager;
};

GameState.prototype.loop = function () {
	
	if(typeof this.onLoop === 'function') this.onLoop();
}

GameState.prototype.render = function () {
	
	if(typeof this.onRender === 'function') this.onRender();
}

GameState.prototype.pause = function(){
	if(typeof this.onPause === 'function') this.onPause();
};

GameState.prototype.resume = function(){
	if(typeof this.onResume === 'function') this.onResume();
};

GameState.prototype.restart = function(){
	if(typeof this.onRestart === 'function') this.onRestart();
};

GameState.prototype.fail = function(){
	if(typeof this.onFail === 'function') this.onFail();
};