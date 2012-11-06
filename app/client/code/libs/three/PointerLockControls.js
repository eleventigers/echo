var PointerLockControls = function ( camera ) {

	var scope = this;

	var pitchObject = new THREE.Object3D();
	pitchObject.add( camera );

	var cubeGeometry = new THREE.CubeGeometry(10,10,10,1,1,1);
	var wireMaterial = new THREE.MeshBasicMaterial( { color: 0xff0000, wireframe:false, opacity:0 } );
	var yawObject = new THREE.Mesh( cubeGeometry, wireMaterial );

	yawObject.position.y = 0;
	yawObject.add( pitchObject );

	var moveForward = false;
	var moveBackward = false;
	var moveLeft = false;
	var moveRight = false;
	var inAir = 0;
	var airSmooth = 5;
	var stepsZ = 0;
	var stepsX = 0;
	var isOnObject = false;
	var belowObject = false;
	var frontObject = false;
	var backObject = false;
	var leftObject = false;
	var rightObject = false;
	var floor = new THREE.Vector3(0, 0, 0);
	var ceiling = new THREE.Vector3(0, 0, 0);
	var front = new THREE.Vector3(0, 0, 0);
	var back = new THREE.Vector3(0, 0, 0);
	var left = new THREE.Vector3(0, 0, 0);
	var right = new THREE.Vector3(0, 0, 0);

	var velocity = new THREE.Vector3();

	var PI_2 = Math.PI / 2;

	var touchUpdate = function ( boolean, direction ) {
		switch(direction){
			case "up": 
				belowObject = boolean;
				break;
			case "down":
				isOnObject = boolean;
				(!boolean) ? ++inAir : inAir = 0;
				break;
			case "front":
				frontObject = boolean;
				break;
			case "back":
				backObject = boolean;
				break;
			case "left":
				leftObject = boolean;
				break;
			case "right":
				rightObject = boolean;
				break;
		}		
	};

	var pointUpdate = function(point, direction){
		switch(direction){
			case "up": 
				ceiling = point;
				break;
			case "down":
				floor = point;
				break;
			case "front":
				front = point;
				break;
			case "back":
				back = point;
				break;
			case "left":
				left = point;
				break;
			case "right":
				right = point;
				break;
		}
	};

	var sign = function(number){
		return number > 0 ? 1 : number == 0 ? 0 : -1;
	};

	this.enabled = false;

	this.onMouseMove = function ( prevX, prevY, x, y, prevMoveX, prevMoveY, moveX, moveY ) {
		if ( scope.enabled === false ) return;	
		yawObject.rotation.y -= moveX * 0.002;
		pitchObject.rotation.x -= moveY * 0.002;
		pitchObject.rotation.x = Math.max( - PI_2, Math.min( PI_2, pitchObject.rotation.x ) );

	};

	this.onKeyDown = function ( keyCode ) {
		switch ( keyCode ) {
			case 38: // up
			case 87: // w
				moveForward = true;
				break;
			case 37: // left
			case 65: // a
				moveLeft = true; 
				break;
			case 40: // down
			case 83: // s
				moveBackward = true;
				break;
			case 39: // right
			case 68: // d
				moveRight = true;
				break;
			case 32: // space
				//jump depends on how fast this is running
				if ( inAir === 0 ) velocity.y += yawObject.boundRadius/2 - 1 + (velocity.z*velocity.z/2);
				break;
		}
	};

	this.onKeyUp = function ( keyCode ) {
		switch( keyCode ) {
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

	this.getObject = function () {
		return yawObject;
	};

	this.collUpdate = function(collisions) {
		for (key in collisions){
			if (collisions.hasOwnProperty(key)){
				touchUpdate(collisions[key].touch, key);
				pointUpdate(collisions[key].point, key);
			}
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
			yawObject.position.y = floor.y+yawObject.boundRadius;
			velocity.y = Math.max( 0, velocity.y );
		}

		if (belowObject){
			if(!isOnObject && velocity.y > 0) {
				yawObject.position.y = ceiling.y-yawObject.boundRadius; 
				//to make it more natural shake the object on head bump 
				velocity.x += Math.random()*3-1;
				velocity.z += Math.random()*3-1;
				pitchObject.rotation.x += Math.random()*0.1;
			}
			if (velocity.y > 0) velocity.y = 0;
			velocity.y -= 0.25 * delta; 
		}

		//sprint initially increses accelaration or decreases it when stopping
		if (moveForward) velocity.z -= 0.12 * delta + stepsZ * 0.001;		
		if ( moveBackward) velocity.z += 0.12 * delta + stepsZ * 0.001;

		if ( moveLeft ) velocity.x -= 0.12 * delta + stepsX * 0.001;
		if ( moveRight ) velocity.x += 0.12 * delta + stepsX * 0.001;

		if (velocity.z*velocity.z >= 0.1) {
			if (stepsZ < 100) ++stepsZ;
		} else {
			if (stepsZ > 0) --stepsZ;
		} 

		if (velocity.x*velocity.x >= 0.1) {
			if (stepsX < 100) ++stepsX;
		} else {
			if (stepsX > 0) --stepsX;
		} 	

		if (frontObject && front.distanceToSquared(yawObject.position) < yawObject.boundRadius) {
			(moveForward) ? velocity.z = 0 : velocity.z = 0.1*delta;
		}

		if (moveBackward && backObject && back.distanceToSquared(yawObject.position) < yawObject.boundRadius) {
			(moveBackward) ? velocity.z = 0 : velocity.z = -0.1*delta;
		}

		if (leftObject && left.distanceToSquared(yawObject.position) < yawObject.boundRadius ) {
			(moveLeft) ? velocity.x = 0 : velocity.x = 0.1*delta;
			
		}
		if (moveRight && rightObject && right.distanceToSquared(yawObject.position) < yawObject.boundRadius ) {
			(moveRight) ? velocity.x = 0 : velocity.x = -0.1*delta;
		}

		yawObject.translateX( velocity.x );
		yawObject.translateY( velocity.y ); 
		yawObject.translateZ( velocity.z );

	};

};