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

var arrow = new THREE.ArrowHelper(new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, 0 ));

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
defaultState.onMouseDown = function(event, x, y){
	if(this.running){
		
		event.preventDefault();
		
		if(event.button === 0){
			if(this.collected.length > 0){

				var origin = this.controls.getObject().position.clone().addSelf(new THREE.Vector3(0,0,this.controls.getObject().boundRadius+10));
				var vertices = this.controls.getObject().geometry.vertices;
				var localVertex =  vertices[3].clone().addSelf(vertices[4].clone());	
				var globalVertex = this.controls.getObject().matrix.multiplyVector3(localVertex);
				var direction = globalVertex.subSelf(origin).normalize();
				

				var material = new THREE.MeshLambertMaterial({color: 0xFF0000,ambient: 0xFF0000});
				var turtleGeometry = new THREE.CubeGeometry(1, 1, 1);
				var normalizationMatrix = new THREE.Matrix4();
				normalizationMatrix.rotateX(Math.PI / 2);
				normalizationMatrix.translate(new THREE.Vector3(0, -0.5, 0));
				turtleGeometry.applyMatrix(normalizationMatrix);
				turtleGeometry.computeBoundingSphere();	
				var turtle = new Turtle(origin, direction, new THREE.Vector3(0, 1, 0), material, turtleGeometry, .1, this.scene.children);
				var tree = new Struct.Tree();
				var sound = new this.audio.Sound3D();

				tree.add(sound);
				tree.add(turtle);
				tree.sound = sound;
				tree.turtle = turtle;

				this.scene.add(tree);
				tree.sound.play(this.collected);
				this.collected = [];	
			}		
			
		}	
		
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
		var colls = detectCollision(this.scene.children, this.controls, 20);
		this.collisions = colls[0];
		this.optCollisions = colls[1];
		this.controls.collUpdate(this.collisions);
		this.controls.update(Date.now() - TIME);
		this.stats.update();
		this.audio.listener.update(this.camera);
		this.renderer.render( this.scene, this.camera );
		if(this.stateManager.cursor.downLeft){

		} 
		if(this.stateManager.cursor.downRight){

			collectSounds(this);

		}
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

	var self = this;

	this.testSound;

	this.renderer = setupRenderer(SCREEN_WIDTH, SCREEN_HEIGHT, container);
	this.camera = setupCamera();
	this.scene = setupScene();
	this.controls = setupControls(this.camera);
	this.scene.add(this.controls.getObject());
	this.audio = setupAudio();
	this.stats = setupStats(container);
	this.scene.add(arrow);

	if (this.audio){
		var samples = ["/sounds/flickburn.WAV", "/sounds/G1.WAV", "/sounds/Scrape1.WAV"];
		this.audio.buffers.loadFreesound(["4456", "21994"], false, function(buffers){

			var test = new Struct.Tree();
			var testsound = new self.audio.Sound3D();
			test.add(testsound);

			
			var material = new THREE.MeshLambertMaterial({color: 0xFF0000,ambient: 0xFF0000});
			var turtleGeometry = new THREE.CubeGeometry(1, 1, 1);
			var normalizationMatrix = new THREE.Matrix4();
			normalizationMatrix.rotateX(Math.PI / 2);
			normalizationMatrix.translate(new THREE.Vector3(0, -0.5, 0));
			turtleGeometry.applyMatrix(normalizationMatrix);
			turtleGeometry.computeBoundingSphere();	
			var turtle = new Turtle(new THREE.Vector3(0, 10, 0), new THREE.Vector3(Math.random()*1, 0, Math.random()*1), new THREE.Vector3(0, 1, 0), material, turtleGeometry, .1, self.scene.children);

			test.add(turtle);	
			self.scene.add(test);

			test.sound = testsound;
			test.turtle = turtle;
			
			test.sound.play({sample:self.audio.buffers.get("21994"), sampleStart:0, sampleDuration:0});
			
		});
	}
}

var stateMan = new StateManager(defaultState, document);

////
////

function setupRenderer(width, height, container) {
	var renderer = new THREE.WebGLRenderer( { clearColor: 0x000000, clearAlpha:1, alpha:true, antialias: true } );
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
	scene.fog = new THREE.FogExp2( 0xFFFFFF, 0.005 );

	// Lights

	var ambient = new THREE.AmbientLight( 0x333333 );
	scene.add( ambient );

	var light = new THREE.SpotLight( 0xF0F0F0 );
	light.position.set( 0, 5000, 1000 );
	light.dynamic = true;

	scene.add( light );

	// Floor

	var geometry = new THREE.PlaneGeometry( 2000, 2000, 100, 100 );
	geometry.applyMatrix( new THREE.Matrix4().makeRotationX( - Math.PI / 2 ) );
	var material = new THREE.MeshPhongMaterial( { color: 0xffffff } );
	var mesh = new THREE.Mesh( geometry, material );
	mesh.position.y = 0;
	scene.add(mesh);

	return scene;
}

function setupAudio(listener){
	return new Trace();
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

function collectSounds(state){

	var pos = state.controls.getObject().position.clone();
	var rots = state.controls.getRotation();
	var vertices = state.controls.getObject().geometry.vertices;
	var localVertex =  vertices[3].clone().addSelf(vertices[4].clone());	
	var globalVertex = state.controls.getObject().matrix.multiplyVector3(localVertex);
	var directionVector = globalVertex.subSelf( state.controls.getObject().position );

	var ray = new THREE.Ray( pos, directionVector.normalize().setY(rots[1].clone().x), 0, 1000 );

	var intersects = ray.intersectObjects(state.scene.children, false);

	console.log(intersects);

	arrow.position = pos;
	arrow.setDirection(directionVector);

	// var colls = state.optCollisions;

	// if (colls.down || colls.front || colls.up || colls.left || colls.right){
	// 	var obj = colls.front.object || colls.down.object || colls.up.object || colls.left.object || colls.right.object;
	// 	if(obj.collectable){
	// 		var pick = obj.pickUp();
	// 		pick.collectable = false;
	// 		state.collected.push(pick);
	// 	}
	// }	

}


function detectCollision(collidees, collider, optRad) {

	return collide(collidees, collider, optRad);

	function collide(objects, origin, optRad){
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
			var optCollisions = Object.create(collisions);
			for (key in directions){
				(directions[key].length > 1) ? localVertex =  vertices[directions[key][0]].clone().addSelf(vertices[directions[key][1]].clone()) : localVertex = vertices[directions[key][0]].clone();	
				globalVertex = coll.getObject().matrix.multiplyVector3(localVertex);
				directionVector = globalVertex.subSelf( coll.getObject().position );
				ray = new THREE.Ray( coll.getObject().position.clone(), directionVector.clone().normalize(), 0, 1000 );
				intersects = ray.intersectObjects(obj, true);
				if (intersects.length > 0) {
					distance = intersects[ 0 ].distance;
					if (distance >= 0 && distance <= rad) {
						collisions[key] = intersects[ 0 ];				
					} else {						
						collisions[key] = false;
					}
					if (optRad){
						if (distance >= 0 && distance <= optRad) {
							optCollisions[key] = intersects[ 0 ];				
						} else {						
							optCollisions[key] = false;
						}
					}			
				} else {
					collisions[key] = false;
					if(optRad) optCollisions[key] = false;
					++falseCount;
				}		
			}					
		}
		return (falseCount !== 6) ? [collisions, optCollisions] : false;	
	}
}

function animate() {
	requestAnimationFrame(animate);
	stateMan.onRender();
}


