StateManager = function (init_state, canvas_object) {
	// The state manager must have some initial state
	this.activeAppState = init_state;

	// and a document element that it is to be bind to
	this.element = canvas_object;

	// Create an empty object, we will store key presses here 
	this.keysPressed = {};

	// Cursor state container
	this.cursor = {
		'prevX' : 0,	// Previous x coordinate
		'prevY' : 0,	// Previous y coordinate
		'x' : 0,		// Current x coordinate
		'y' : 0,		// Current y coordinate
		'prevMoveX' : 0,// Previous x movement
		'prevMoveY' : 0,// Previous y movement
		'moveX' : 0, 	// Current x movement
		'moveY' : 0,	// Current y movement	
		'downLeft' : false, // Is mouse left button pressed
		'downRight' : false	 // Is mouse right button pressed
	}

	// 'Self' for reference in events
	var self = this;


	/*

		EVENT HANDLING BEGIN

	*/


	// Key pressed
	this.element.addEventListener("keydown", function (event) {
		// For compatibility purposes we need to check whether we are dealing with 'charCode' or 'keyCode'
		var chCode = ('keyCode' in event) ? event.keyCode : event.charCode;
		// Record key press in map for reference
		self.keysPressed[chCode] = true;

		// We need to check if function exists
		if (typeof self.activeAppState.onKeyDown === 'function')
			self.activeAppState.onKeyDown(chCode);
	});

	// Key released
	this.element.addEventListener("keyup", function (event) {
		var chCode = ('keyCode' in event) ? event.keyCode :  event.charCode;
		self.keysPressed[chCode] = false;

		if (typeof self.activeAppState.onKeyUp === 'function')
			self.activeAppState.onKeyUp(chCode);
	});

	// Mouse moved
	this.element.addEventListener("mousemove", function (event) {

		var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
		var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
		var x = event.clientX;
		var y = event.clientY;

		if (typeof self.activeAppState.onMouseMove === 'function')
			self.activeAppState.onMouseMove(self.cursor.x, self.cursor.y, x, y, self.cursor.moveX, self.cursor.moveY, movementX, movementY);

		self.cursor.prevX = self.cursor.x;
		self.cursor.prevY = self.cursor.y;
		self.cursor.x = x;
		self.cursor.y = y;
		self.cursor.prevMoveX = self.cursor.moveX;
		self.cursor.prevMoveY = self.cursor.moveY;
		self.cursor.moveX = movementX;
		self.cursor.moveY = movementY;
	});

	// Mouse clicked (down)
	this.element.addEventListener("mousedown", function (event) {
		if (typeof self.activeAppState.onMouseDown === 'function')
			self.activeAppState.onMouseDown(event, self.cursor.x, self.cursor.y);
		if(event.button === 0) 
			self.cursor.downLeft = true;
		if(event.button === 2) 
			self.cursor.downRight = true;

	});

	// Mouse released (up)
	this.element.addEventListener("mouseup", function (event) {
		if (typeof self.activeAppState.onMouseUp === 'function')
			self.activeAppState.onMouseUp(event, self.cursor.x, self.cursor.y);
		if(event.button === 0) 
			self.cursor.downLeft = false;
		if(event.button === 2)
			self.cursor.downRight = false;
	});

	// Window resized
	window.addEventListener('resize', function() {
		if (typeof self.activeAppState.onResize === 'function')
			self.activeAppState.onResize();
	});

	// Hook pointer lock state change events
	this.element.addEventListener( 'pointerlockchange', function(event) {
		if (typeof self.activeAppState.onPointerLockChange === 'function')
			self.activeAppState.onPointerLockChange(event);
	}, false );
	this.element.addEventListener( 'mozpointerlockchange',  function(event) {
		if (typeof self.activeAppState.onPointerLockChange === 'function')
			self.activeAppState.onPointerLockChange(event);
	}, false );
	this.element.addEventListener( 'webkitpointerlockchange',  function(event) {
		if (typeof self.activeAppState.onPointerLockChange === 'function')
			self.activeAppState.onPointerLockChange(event);
	}, false );
	this.element.addEventListener( 'pointerlockerror', function(event) {
		if (typeof self.activeAppState.onPointerLockError === 'function')
			self.activeAppState.onPointerLockError(event);
	}, false );
	this.element.addEventListener( 'mozpointerlockerror', function(event) {
		if (typeof self.activeAppState.onPointerLockError === 'function')
			self.activeAppState.onPointerLockError(event);
	}, false );
	this.element.addEventListener( 'webkitpointerlockerror', function(event) {
		if (typeof self.activeAppState.onPointerLockError === 'function')
			self.activeAppState.onPointerLockError(event);
	}, false );

	/*

		EVENT HANDLING FINISH

	*/
}


StateManager.prototype.setActiveAppState = function (state) {
	if (typeof state != undefined) {
		this.activeAppState = state;
		if (typeof this.activeAppState.onActivation === 'function') 
			this.activeAppState.onActivation();
		// Reference self so that the state can access the state manager
		this.activeAppState.setStateManager(this);
	} else {
		console.log("ERROR: Trying to set a state that was undefined");
	}
};