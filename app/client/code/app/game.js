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

// Reusable geo and mat objects

var turtleMaterial = new THREE.MeshLambertMaterial();
var turtleGeometry = new THREE.CubeGeometry(1.5, 1, 0.25);
var normalizationMatrix = new THREE.Matrix4();
normalizationMatrix.rotateX(Math.PI / 2);
normalizationMatrix.translate(new THREE.Vector3(0, -0.5, 0));
turtleGeometry.applyMatrix(normalizationMatrix);
turtleGeometry.computeBoundingSphere();



//var arrow = new THREE.ArrowHelper(new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, 0 ));

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

				var ray = lookAndShoot(this.controls);
				var intersects = ray.intersectObjects(this.playsects, true);
				if(intersects.length > 0){
					if(intersects[0].object.constructor === Struct.Segment){
						var branch = appendDrops(new THREE.Vector3(0,0,0), intersects[0].face.normal.clone().subSelf(new THREE.Vector3(Math.random()*0.2-0.4, Math.random()*0.2-0.4, Math.random()*0.2-0.4)));
						intersects[0].object.add(branch);	
						branch.sound.play({buffer: this.collected, loop:false, building:true});
						this.collected = [];
					} else {
						if(intersects[0].distance <= 50){
							var branch = appendDrops(intersects[0].point, intersects[0].face.normal.clone().subSelf(new THREE.Vector3(Math.random()*0.2-0.4, Math.random()*1-2, Math.random()*0.2-0.4)));
							addToScene(branch);
							addToPlaysects(branch);
							branch.sound.play({buffer: this.collected, loop:true, building:true});
							this.collected = [];
						}
						
					}
				} 
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
		TWEEN.update();	

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
	this.controls = setupControls(this.camera);
	this.scene = setupScene();
	this.scene.add(this.controls.getYaw());
	this.audio = setupAudio();
	this.stats = setupStats(container);
	setupFloor(this);
	//this.scene.add(arrow);

	if (this.audio){
		var samples = ["/sounds/flickburn.WAV", "/sounds/G1.wav", "/sounds/E2.wav"];
		var freeSamples = ["19659", "45584", "15985"]
		this.audio.buffers.loadFreesound(freeSamples, function(buffers){
			for(var i = 0; i < buffers.length; ++i){
				var test = new Struct.Tree();
				var testsound = new self.audio.Sound3D();
				test.add(testsound);
			
				var turtle = new Turtle(new THREE.Vector3(Math.random()*20-40, Math.random()*10-20, Math.random()*5-10), new THREE.Vector3(Math.random()*1-2, Math.random()*1, Math.random()*1-2), new THREE.Vector3(0, 1, 0), turtleMaterial, turtleGeometry, .1, self.playsects);

				test.add(turtle);	

				test.sound = testsound;
				test.turtle = turtle;
				
				addToScene(test);
				addToPlaysects(test);
			
				test.sound.play({buffer: buffers[i], sampleStart:0, sampleDuration:0, loop:true, building:true});
				
			}	
		});
	}
}

var stateMan = new StateManager(defaultState, document);


////
////

function setupRenderer(width, height, container) {
	var renderer = new THREE.WebGLRenderer( { alpha:true, antialias: true } );
	renderer.setSize( width, height );
	renderer.setClearColorHex(  0x121212, 1);
	renderer.shadowMapEnabled = true;
	renderer.shadowMapSoft = true;
	renderer.gammaInput = true;
	renderer.gammaOutput = true;
	renderer.physicallyBasedShading = true;
	container.appendChild(renderer.domElement);
	return renderer;
}

function setupScene(){

	var scene = new THREE.Scene();
	scene.fog = new THREE.FogExp2( 0x121212, 0.002 );
	//scene.fog.color.setHSV( 0.51, 0.6, 0.025 );

	// Lights
	var ambient = new THREE.AmbientLight( 0xf2f2f2 );
	//ambient.color.setHSV( 0.1, 0.5, 0.3 );
	scene.add( ambient );


	var light = new THREE.DirectionalLight( 0x757575, 1 );
	light.position.set( 1000, 5000, 1000 );
	// light.target = stateMan.activeAppState.controls.getYaw();
	light.castShadow = true;
	light.shadowCameraNear = 50;
	light.shadowCameraFar = 6000;
	light.shadowCameraFov = 75;
	//light.shadowCameraVisible = true;
	light.shadowDarkness = 0.3;
	light.shadowMapWidth = 4096;
	light.shadowMapHeight = 4096;

	scene.add( light );

	var geometry = new THREE.SphereGeometry(200, 20);
	var material = new THREE.MeshPhongMaterial({ color: 0xff0000 })
	var lightSphere = new THREE.Mesh(geometry, material);
	lightSphere.position.set(1000, 5000, 1000);
	scene.add(lightSphere);

	light = new THREE.SpotLight(0xffffff, 1 );
	light.target = lightSphere;
	light.position = stateMan.activeAppState.controls.getYaw().position;
	light.castShadow = true;
	scene.add(light);

	var otherLight = new THREE.SpotLight(0xffffff, 50 );
	
	otherLight.position.set(0, 4500, 0);
	otherLight.target = lightSphere;

	scene.add(otherLight);

	return scene;
}



function setupFloor(){
	var geometry = new THREE.CubeGeometry( 50, 50, 50);
	geometry.applyMatrix( new THREE.Matrix4().makeRotationX( - Math.PI / 2 ) );

	geometry.computeFaceNormals();
	geometry.computeVertexNormals();
	geometry.computeBoundingSphere();

	material = new THREE.MeshPhongMaterial( { color: 0xcccccc, wireframe: false} );
	var ground = new THREE.Mesh( geometry, material );
	ground.position.y = -50;
	ground.receiveShadow = true;

	addToScene(ground);
	addToPlaysects(ground);

	var another = ground.clone();
	another.position.z = -500;

	addToScene(another);
	addToPlaysects(another);
}


function setupAudio(listener){
	return new Trace();
}

function setupCamera(){
	return new THREE.PerspectiveCamera( 110, window.innerWidth / window.innerHeight, 1, 6000 );
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


function addToScene(object){
	stateMan.activeAppState.scene.add(object);		
}

function addToPlaysects(object){
	stateMan.activeAppState.playsects.push(object);
}



function appendDrops(origin, direction) {

	var turtle = new Turtle(origin, direction, new THREE.Vector3(0, 1, 0), turtleMaterial, turtleGeometry, .1, stateMan.activeAppState.playsects);
	var tree = new Struct.Tree();
	var sound = new stateMan.activeAppState.audio.Sound3D();
	tree.add(turtle);
	tree.turtle = turtle;
	tree.add(sound);
	tree.sound = sound;
	
	return tree;
}

function collectDrops(){

	var ray = lookAndShoot(stateMan.activeAppState.controls);
	ray.precision = 0.000001;
	var intersects = ray.intersectObjects(stateMan.activeAppState.playsects, true);

	if (intersects.length > 0) {
		var first = intersects[ 0 ];
		var distance = first.distance;
		if (distance >= 0 && distance <= 200) {
			if(first.object.collectable){
				first.object.pickUp(stateMan.activeAppState.controls.getYaw(), 500, function(pickings){
					for(var i = 0; i < pickings.length; ++i){
						pickings[i].collectable = false;
						stateMan.activeAppState.collected.push(pickings[i]);
					}	
				});		
			}
		}	
	} 

}

function lookAndShoot (controls){

	if (!controls) return;

	var bound = controls.getYaw().boundRadiusScale;
	var pos = controls.getYaw().position.clone();
	var pitch = controls.getPitch().rotation.clone();
	var vertices = controls.getYaw().geometry.vertices;
	var frontVertex =  vertices[3].clone().addSelf(vertices[4].clone());
	var globalVertex = controls.getYaw().matrixWorld.multiplyVector3(frontVertex);
	var directionVector = globalVertex.subSelf( pos );

	return new THREE.Ray( pos, directionVector.normalize().setY(pitch.x));

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


