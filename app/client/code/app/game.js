exports.init = function() {
	stateMan.setActiveAppState(defaultState);
	animate();	
}

// DOM elements for the game
var container = document.createElement('div');
				document.body.appendChild(container);
var stats;

// Dimmensions for the Three renderer
var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;

// Global clock
var TIME = Date.now();

// Pointer lock
var element = document.body;
var blocker = document.getElementById( 'blocker' );
var instructions = document.getElementById( 'instructions' );
var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;
if(havePointerLock){
	instructions.addEventListener( 'click', function ( event ) {
		instructions.style.display = 'none';

		// Ask the browser to lock the pointer
		element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;

		if ( /Firefox/i.test( navigator.userAgent ) ) {

			var fullscreenchange = function ( event ) {

				if ( document.fullscreenElement === element || document.mozFullscreenElement === element || document.mozFullScreenElement === element ) {

					document.removeEventListener( 'fullscreenchange', fullscreenchange );
					document.removeEventListener( 'mozfullscreenchange', fullscreenchange );

					element.requestPointerLock();
				}

			}

			document.addEventListener( 'fullscreenchange', fullscreenchange, false );
			document.addEventListener( 'mozfullscreenchange', fullscreenchange, false );

			element.requestFullscreen = element.requestFullscreen || element.mozRequestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen;
			element.requestFullscreen();

		} else {

			element.requestPointerLock();

		}

	}, false );
} else {
	instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';

}	

// State managing

var defaultState = new GameState();

defaultState.onKeyDown = function(keyCode){
	if(this.controls){
		this.controls.onKeyDown(keyCode);
	}
	
};
defaultState.onKeyUp = function(keyCode){
	if(this.controls){
		this.controls.onKeyUp(keyCode);
	}
	
};
defaultState.onMouseMove = function(prevX, prevY, x, y, prevMoveX, prevMoveY, moveX, moveY){
	if(this.controls){
		this.controls.onMouseMove(prevX, prevY, x, y, prevMoveX, prevMoveY, moveX, moveY);
	}
};
defaultState.onMouseDown = function(x, y){
	if(this.running){
		event.preventDefault();

		var projector = new THREE.Projector();
		var vector = new THREE.Vector3( x, y, 0.5 );
		projector.unprojectVector( vector, this.camera );
		var direction = vector.subSelf( this.controls.getObject().position.clone() ).normalize();
		var origin = this.controls.getObject().position.clone();
		
		var tree = new THREE.Object3D();
		var sound = new Audio.Tree({scene:this.audio, stream: this.audio.bufferList["woodoverblade.wav"], loop: false, sampleStart: 0, sampleDuration: 0});
		tree.add(sound);
		tree.sound = sound;

		var material = new THREE.MeshLambertMaterial({color: 0xFF0000,ambient: 0xFF0000});
		var turtleGeometry = new THREE.CubeGeometry(1, 1, 1);
		var normalizationMatrix = new THREE.Matrix4();
		normalizationMatrix.rotateX(Math.PI / 2);
		normalizationMatrix.translate(new THREE.Vector3(0, -0.5, 0));
		turtleGeometry.applyMatrix(normalizationMatrix);
		turtleGeometry.computeBoundingSphere();	
		var turtle = new Turtle(origin, direction, new THREE.Vector3(0, 1, 0), material, turtleGeometry, .1, this.scene.children);

		tree.add(turtle);
		tree.turtle = turtle;

		this.scene.add(tree);

		console.log(tree);

		tree.sound.play({build:true});
	}
};
defaultState.onResize = function () {
	if(this.camera){
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();
	} 
	if(this.renderer){
		this.renderer.setSize( window.innerWidth, window.innerHeight );
	}		
};
defaultState.onRender = function(){
	if (this.running){
		this.controls.collUpdate(detectCollision(this.scene.children, this.controls));
		this.controls.update(Date.now() - TIME);
		this.stats.update();
		this.audio.update();
		this.renderer.render( this.scene, this.camera );
		TIME = Date.now();
	}	
};
defaultState.onPointerLockChange = function(event) {
			
	if ( document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element ) {
		this.running = true;
		blocker.style.display = 'none';
	} else {
		this.running = false;
		blocker.style.display = '-webkit-box';
		blocker.style.display = '-moz-box';
		blocker.style.display = 'box';
		instructions.style.display = '';
	}
	
};
defaultState.onPointerLockError = function(event) {
	instructions.style.display = '';
};
defaultState.onActivation = function() {
	this.renderer = setupRenderer(SCREEN_WIDTH, SCREEN_HEIGHT, container);
	this.scene = setupScene();
	this.camera = setupCamera();
	this.controls = setupControls(this.camera);
	this.scene.add(this.controls.getObject());
	this.audio = setupAudio(this.camera);
	this.stats = setupStats(container);

	if(this.audio){
		this.audio.loadBuffers(["/sounds/woodoverblade.wav"], function(status, buffers){
			if (status){
    			console.log(buffers);	
			}
		});
	}
}

var stateMan = new StateManager(defaultState, document);

////
////

function setupRenderer(width, height, container) {
	var renderer = new THREE.WebGLRenderer( { clearColor: 0xBCD2EE, clearAlpha: 1, antialias: true } );
	renderer.setSize( width, height );
	renderer.autoClear = false;
	renderer.shadowMapEnabled = true;
	renderer.shadowMapSoft = true;
	renderer.physicallyBasedShading = false;
	container.appendChild(renderer.domElement);
	return renderer;
}

function setupScene(){

	var scene = new THREE.Scene();
	scene.fog = new THREE.FogExp2( 0xBCD2EE, 0.0001 );

	var light = new THREE.DirectionalLight( 0xffffff, 1.5 );
	light.position.set( 1, 1, 1 );
	scene.add( light );

	var anotherLight = new THREE.DirectionalLight( 0xffffff );
	anotherLight.position.set( -1, - 0.5, -1 );
	scene.add( anotherLight );

	// floor

	var geometry = new THREE.PlaneGeometry( 2000, 2000, 100, 100 );
	geometry.applyMatrix( new THREE.Matrix4().makeRotationX( - Math.PI / 2 ) );
	var material = new THREE.MeshPhongMaterial( { color: 0xffffff } );
	var mesh = new THREE.Mesh( geometry, material );
	mesh.position.y = -100;
	scene.add(mesh);

	return scene;
}

function setupAudio(listener){
	return new Audio.Scene(listener);
}

function setupCamera(){
	return new THREE.PerspectiveCamera( 110, window.innerWidth / window.innerHeight, 1, 2000 );
}

function setupControls(camera) {
	return new PointerLockControls(camera);
}

function setupStats(container) {
	var stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.top = '0px';
	stats.domElement.style.zIndex = 100;
	container.appendChild( stats.domElement );
	return stats;
}


// function rColl(collidees, collider, callback){
// 	if (collidees.hasOwnProperty("children")){
// 		if(collidees.children.length >= 0){
// 			var results = detectCollision(collidees.children, collider);
// 			if(results) callback(results);
// 			for (var i = 0; i < collidees.children.length; ++i){
// 				rColl(collidees.children[i], collider, callback);
// 			}
// 		} 	
// 	}	
// }

function detectCollision(collidees, collider) {

	return collide(collidees, collider);

	function collide(objects, origin){
		var obj, coll, rad, localVertex, globalVertex, directionVector, intersects, distance, vertices, falseCount;

		(objects.length > 0) ? obj = objects : obj = false;
		(origin.hasOwnProperty("getObject")) ? coll = origin : coll = false;

		if (obj && coll){
			vertices = coll.getObject().geometry.vertices;
			rad = coll.getObject().boundRadius+1;
			var directions = {
				"up": [4,1],
				"down": [6,2],
				"front": [3,4],
				"back": [7,0],
				"left": [5,6],
				"right": [1,2],
			};
			var collisions = {
				"up": {},
				"down": {},
				"front": {},
				"back": {},
				"left": {},
				"right": {},
			};
			for (key in directions){
				(directions[key].length > 1) ? localVertex =  vertices[directions[key][0]].clone().addSelf(vertices[directions[key][1]].clone()) : localVertex = vertices[directions[key][0]].clone();	
				globalVertex = coll.getObject().matrix.multiplyVector3(localVertex);
				directionVector = globalVertex.subSelf( coll.getObject().position );
				ray = new THREE.Ray( coll.getObject().position.clone(), directionVector.clone().normalize() );
				intersects = ray.intersectObjects(obj, true);
				if (intersects.length > 0) {
					distance = intersects[ 0 ].distance;
					if (distance >= 0 && distance <= rad) {
						collisions[key] = intersects[ 0 ];				
					} else {						
						collisions[key] = false;
					}
				} else {
					collisions[key] = false;
					++falseCount;
				}		
			}					
		}
		return (falseCount !== 6) ? collisions : false;	
	}
}

function animate() {
	requestAnimationFrame(animate);
	stateMan.onRender();
}


