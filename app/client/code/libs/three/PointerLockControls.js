var PointerLockControls = function ( camera ) {

	var scope = this;

	var pitchObject = new THREE.Object3D();
	pitchObject.add( camera );

	var yawObject = new THREE.Object3D();

	yawObject.position.y = 0;
	yawObject.add( pitchObject );

	var moveForward = false;
	var moveBackward = false;
	var moveLeft = false;
	var moveRight = false;

	var isOnObject = false;
	var belowObject = false;
	var frontObject = false;
	var backObject = false;
	var inAir = 0;
	var airSmooth = 5;
	var floor = new THREE.Vector3(0, 0, 0);
	var ceiling = new THREE.Vector3(0, 0, 0);
	var front = new THREE.Vector3(0, 0, 0);
	var back = new THREE.Vector3(0, 0, 0);

	var velocity = new THREE.Vector3();

	var PI_2 = Math.PI / 2;

	var onMouseMove = function ( event ) {

		if ( scope.enabled === false ) return;

		var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
		var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
		
		yawObject.rotation.y -= movementX * 0.002;
		pitchObject.rotation.x -= movementY * 0.002;

		pitchObject.rotation.x = Math.max( - PI_2, Math.min( PI_2, pitchObject.rotation.x ) );

	};

	var onKeyDown = function ( event ) {

		switch ( event.keyCode ) {

			case 38: // up
			case 87: // w
				moveForward = true;
				break;

			case 37: // left
			case 65: // a
				moveLeft = true; break;

			case 40: // down
			case 83: // s
				moveBackward = true;
				break;

			case 39: // right
			case 68: // d
				moveRight = true;
				break;

			case 32: // space
				if ( inAir === 0 ) velocity.y += 10;
				break;

		}

	};

	var onKeyUp = function ( event ) {

		switch( event.keyCode ) {

			case 38: // up
			case 87: // w
				moveForward = false;
				break;

			case 37: // left
			case 65: // a
				moveLeft = false;
				break;

			case 40: // down
			case 83: // a
				moveBackward = false;
				break;

			case 39: // right
			case 68: // d
				moveRight = false;
				break;

		}

	};

	var sign = function(number){
		return number > 0 ? 1 : number == 0 ? 0 : -1;
	};

	document.addEventListener( 'mousemove', onMouseMove, false );
	document.addEventListener( 'keydown', onKeyDown, false );
	document.addEventListener( 'keyup', onKeyUp, false );

	this.enabled = false;

	this.getObject = function () {
		return yawObject;
	};

	this.touchObject = function ( boolean, axis ) {
		
		if (sign(axis.x) === 1 ){

		} 

		if (sign(axis.x) === -1 ){

		} 

		if (sign(axis.y) === 1 ){
			belowObject = boolean;
		} 

		if (sign(axis.y) === -1 ){
			isOnObject = boolean;
			(!boolean) ? ++inAir : inAir = 0;
		} 

		if (sign(axis.z) === 1 ){
			if (boolean) console.log("front", boolean);
			frontObject = boolean;
		} 

		if (sign(axis.z) === -1 ){
			if (boolean) console.log("back", boolean);
			backObject = boolean;
		}
		

		
	};


	this.pointUpdate = function(point, axis){

		if (sign(axis.x) === 1 ){

		} 

		if (sign(axis.x) === -1 ){

		} 

		if (sign(axis.y) === 1 ){
			ceiling = point;
		} 

		if (sign(axis.y) === -1 ){
			floor = point;
		} 

		if (sign(axis.z) === 1 ){

		} 

		if (sign(axis.z) === -1 ){

		}	
	
	};

	this.update = function ( delta ) {

		if ( scope.enabled === false ) return;

		delta *= 0.1;

		velocity.x += ( - velocity.x ) * 0.08 * delta;
		velocity.z += ( - velocity.z ) * 0.08 * delta;

		if(!isOnObject && inAir > airSmooth){
			velocity.y -= 0.25 * delta; 
		} 		
		if (isOnObject){
			yawObject.position.y = floor.y+21;
			velocity.y = Math.max( 0, velocity.y );
		}

		if (belowObject ){
			if(!isOnObject && velocity.y > 0) {
				yawObject.position.y = ceiling.y-21; 
				velocity.x += Math.random()*3-1;
				velocity.z += Math.random()*3-1;
			}
			if (velocity.y > 0) velocity.y = 0;
			velocity.y -= 0.25 * delta; 
		}

		if ( moveForward ) velocity.z -= 0.12 * delta;
		if ( moveBackward ) velocity.z += 0.12 * delta;

		if ( moveLeft ) velocity.x -= 0.12 * delta;
		if ( moveRight ) velocity.x += 0.12 * delta;
	

		yawObject.translateX( velocity.x );
		yawObject.translateY( velocity.y ); 
		yawObject.translateZ( velocity.z );
	

	};

};