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

				var tree = deployDrops(this);
				this.scene.add(tree);
				this.playsects.push(tree);
				tree.sound.play(this.collected, true);
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
		++this.counter;
		this.collisions = detectCollision(this.playsects, this.controls);
		this.controls.collUpdate(this.collisions);
		this.controls.update(Date.now() - TIME);
		this.stats.update();
		this.audio.listener.update(this.camera);
		this.renderer.render( this.scene, this.camera );

		if(this.stateManager.cursor.downLeft){

		} 
		if(this.stateManager.cursor.downRight){
			if(this.counter === 1) collectDrops(this);
		}

		TIME = Date.now();

		if(this.counter == 3) this.counter = 0;
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

	this.renderer = setupRenderer(SCREEN_WIDTH, SCREEN_HEIGHT, container);
	this.camera = setupCamera();
	this.scene = setupScene(this);
	this.controls = setupControls(this.camera);
	this.scene.add(this.controls.getYaw());
	this.audio = setupAudio();
	this.stats = setupStats(container);
	this.scene.add(arrow);

	if (this.audio){
		var samples = ["/sounds/SpokeWindmill.WAV", "/sounds/G1.WAV", "/sounds/Scrape1.WAV", "/sounds/bow2.WAV"];
		var freeSamples = ["3156", "11242", "3859"]
		this.audio.buffers.loadFreesound(freeSamples, function(buffers){
			for(var i = 0; i < buffers.length; ++i){
				var test = new Struct.Tree();
				var testsound = new self.audio.Sound3D({loop:true});
				test.add(testsound);
				var randColor = parseInt('0x'+Math.floor(Math.random()*16777215).toString(16), 16);
				var material = new THREE.MeshLambertMaterial({color: randColor,ambient: randColor});
				var geometry = new THREE.CubeGeometry(1, 1, 1);
			
				var turtle = new Turtle(new THREE.Vector3(0, 10, 0), new THREE.Vector3(Math.random()*1, 0, Math.random()*1), new THREE.Vector3(0, 1, 0), material, geometry, .1, self.playsects);

				test.add(turtle);	
				self.scene.add(test);

				test.sound = testsound;
				test.turtle = turtle;

				self.playsects.push(test);
			
				test.sound.play({sample: buffers[i], sampleStart:0, sampleDuration:0}, true);
			}	
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

function setupScene(state){

	var scene = new THREE.Scene();
	scene.fog = new THREE.FogExp2( 0xFFFFFF, 0.005 );

	// Lights

	var ambient = new THREE.AmbientLight( 0x333333 );
	scene.add( ambient );

	var light = new THREE.SpotLight( 0xF0F0F0 );
	light.position.set( 0, 5000, 1000 );
	light.dynamic = true;

	scene.add( light );

	//
	var geometry = new THREE.PlaneGeometry( 2000, 2000, 100, 100 );
	geometry.applyMatrix( new THREE.Matrix4().makeRotationX( - Math.PI / 2 ) );
	var material = new THREE.MeshPhongMaterial( { color: 0xffffff, opacity: 0.2 } );
	var mesh = new THREE.Mesh( geometry, material );
	mesh.position.y = 0;
	scene.add(mesh);
	state.playsects.push(mesh);
	
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

function deployDrops(state) {
	var ray = lookAndShoot(state.controls);
	var randColor = parseInt('0x'+Math.floor(Math.random()*16777215).toString(16), 16);
	var material = new THREE.MeshLambertMaterial({color: randColor,ambient: randColor});
	var geometry = new THREE.CubeGeometry(1, 1, 1);
	var normalizationMatrix = new THREE.Matrix4();
	normalizationMatrix.rotateX(Math.PI / 2);
	normalizationMatrix.translate(new THREE.Vector3(0, -0.5, 0));
	geometry.applyMatrix(normalizationMatrix);
	geometry.computeBoundingSphere();	
	var turtle = new Turtle(ray.origin, ray.direction, new THREE.Vector3(0, 1, 0), material, geometry, .1, state.playsects);
	var tree = new Struct.Tree();
	var sound = new state.audio.Sound3D({building:true, loop:true});
	tree.add(turtle);
	tree.turtle = turtle;
	tree.add(sound);
	tree.sound = sound;
	return tree;
}

function collectDrops(state){

	var ray = lookAndShoot(state.controls);
	var intersects = ray.intersectObjects(state.scene.children, true);

	if (intersects.length > 0) {
		var first = intersects[ 0 ];
		var distance = first.distance;
		if (distance >= 0 && distance <= 200) {
			if(first.object.collectable){
				var pick = first.object.pickUp();
				pick.collectable = false;
				state.collected.push(pick);
			}
		}	
	} 

	arrow.position = ray.origin;
	arrow.setDirection(ray.direction);

}

function lookAndShoot (controls, far){

	if (!controls) return;

	var bound = controls.getYaw().boundRadius;
	var pos = controls.getYaw().position.clone();
	//var posIn = pos.clone().subSelf(new THREE.Vector3(0,0,-20));

	var pitch = controls.getPitch().rotation.clone();
	var far = (!far) ? 1000 : far;
	var vertices = controls.getYaw().geometry.vertices;
	var frontVertex =  vertices[3].clone().addSelf(vertices[4].clone());
	
	var globalVertex = controls.getYaw().matrix.multiplyVector3(frontVertex);
	var directionVector = globalVertex.subSelf( pos );

	return new THREE.Ray( pos, directionVector.normalize().setY(pitch.x), 0, far );

}


function detectCollision(collidees, collider) {

	return collide(collidees, collider);

	function collide(objects, origin){
		var obj, coll, rad, localVertex, globalVertex, directionVector, intersects, distance, vertices, falseCount;

		(objects.length > 0) ? obj = objects : obj = false;
		(origin.hasOwnProperty("getYaw")) ? coll = origin : coll = false;

		if (obj && coll){
			vertices = coll.getYaw().geometry.vertices;
			rad = coll.getYaw().boundRadius+1;
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
				globalVertex = coll.getYaw().matrix.multiplyVector3(localVertex);
				directionVector = globalVertex.subSelf( coll.getYaw().position );
				ray = new THREE.Ray( coll.getYaw().position.clone(), directionVector.clone().normalize(), 0, 1000 );
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


