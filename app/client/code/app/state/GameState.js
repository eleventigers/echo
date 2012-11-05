GameState = function () {

	// Function on fired on every iteration of the game loop
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

	// Called when this state is set active
	this.onActivation = null;

	// Custom controls object
	this.controls = null;

	// WebGL renderer
	this.renderer = null;

	// Web Audio context
	this.audio = null;

	// Standard stats
	this.stats = null;
}

GameState.prototype.constructor = GameState;

GameState.prototype.SetStateManager = function (state_manager) {
	this.stateManager = state_manager;
};