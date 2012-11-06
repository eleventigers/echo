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

	// Custom controls object
	this.controls = null;

	// THREE.js renderer
	this.renderer = null;

	// THREE.js scene
	this.scene = null;

	// Web Audio context
	this.audio = null;

	// Standard stats
	this.stats = null;

	// Called when this state is set active
	this.onActivation = null;

}

GameState.prototype.constructor = GameState;

GameState.prototype.setStateManager = function (state_manager) {
	this.stateManager = state_manager;
};