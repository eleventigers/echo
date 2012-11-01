// Loaded?
var loaded = false;

// DOM elements for the game
var container = document.createElement('div');
				document.body.appendChild(container);
var stats;

// Dimmensions for the Three renderer nad camera
var MARGIN = 100, SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;

// Three renderer options
var SHADOW_MAP_WIDTH = 2048, SHADOW_MAP_HEIGHT = 2048, FLOOR = -550, NEAR = 5, FAR = 50000;

// Global objects
var renderer, camera, scene, controls, projector, plane, collideWith = new THREE.Object3D(), ray, vector, helper;

// Track mouse
var mouse = new THREE.Vector2(), offset = new THREE.Vector3(), INTERSECTED, SELECTED, SHIFT = false, MOUSEDOWN = false, MOUSEDOWNx = 0;

// Global clock
var time = Date.now();

// Audio
var audio, sound, turtle;

// Pointer lock

var blocker = document.getElementById( 'blocker' );
var instructions = document.getElementById( 'instructions' );
var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;

//Physics
// Physijs.scripts.worker = "/physijs/physijs_worker.js";
// Physijs.scripts.ammo = "/physijs/ammo.js";
// var box;


exports.init = function() {
	setupRenderer();
	setupScene();
	setupControls();
	setupStats();
	animate();	

}

function setupRenderer() {

	renderer = new THREE.WebGLRenderer( { clearColor: 0xBCD2EE, clearAlpha: 1, antialias: true } );
	renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );
	renderer.autoClear = false;
	renderer.shadowMapEnabled = true;
	renderer.shadowMapSoft = true;
	renderer.physicallyBasedShading = false;
	container.appendChild(renderer.domElement);
	window.addEventListener( 'resize', onWindowResize, false );

}

function setupScene(){

	scene = new THREE.Scene();
	scene.fog = new THREE.FogExp2( 0xBCD2EE, 0.0001 );

	camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000 );

	helper = new THREE.ArrowHelper(new THREE.Vector3(), camera.position);
	scene.add(helper);

	var light = new THREE.DirectionalLight( 0xffffff, 1.5 );
	light.position.set( 1, 1, 1 );
	scene.add( light );

	var light = new THREE.DirectionalLight( 0xffffff );
	light.position.set( -1, - 0.5, -1 );
	scene.add( light );

	audio = new Audio.Scene();
	audio.attach(camera);

	audio.loadBuffers(["/sounds/nike_addiction_0.6.mp3"], function(status, buffers){
		if (status == 'success'){
    		test(buffers);
		}
	});

	scene.add(collideWith);
	console.log(collideWith);

	

	function test(buffers){	

		sound = new Audio.Tree({scene:audio, stream: buffers[0], loop: false});

		var material = new THREE.MeshLambertMaterial({color: 0xFF0000,ambient: 0xFF0000});
		var turtleGeometry = new THREE.CubeGeometry(1, 1, 1);
		var normalizationMatrix = new THREE.Matrix4();
			normalizationMatrix.rotateX(Math.PI / 2);
				normalizationMatrix.translate(new THREE.Vector3(0, -0.5, 0));
			turtleGeometry.applyMatrix(normalizationMatrix);
			turtleGeometry.computeBoundingSphere();	
		var dir = new THREE.Vector3(0,1,0);
		turtle = new Turtle(new THREE.Vector3(0, 0, -10), dir, new THREE.Vector3(0, 0, 1), material, turtleGeometry, .1);
		turtle.yaw(90);

		sound.play();

    	// // floor

		geometry = new THREE.PlaneGeometry( 2000, 2000, 100, 100 );
		geometry.applyMatrix( new THREE.Matrix4().makeRotationX( - Math.PI / 2 ) );
		material = new THREE.MeshPhongMaterial( { color: 0xffffff } );
		mesh = new THREE.Mesh( geometry, material );
		mesh.position.y = -20;
		collideWith.add(mesh);

		loaded = true;
	
	}
	





}

function setupControls() {

	if(havePointerLock){
		var element = document.body;
		var pointerlockchange = function ( event ) {
			
			if ( document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element ) {
				controls.enabled = true;
				blocker.style.display = 'none';
			} else {
				controls.enabled = false;
				blocker.style.display = '-webkit-box';
				blocker.style.display = '-moz-box';
				blocker.style.display = 'box';
				instructions.style.display = '';
			}

		}

		var pointerlockerror = function ( event ) {
			instructions.style.display = '';
		}

		// Hook pointer lock state change events
		document.addEventListener( 'pointerlockchange', pointerlockchange, false );
		document.addEventListener( 'mozpointerlockchange', pointerlockchange, false );
		document.addEventListener( 'webkitpointerlockchange', pointerlockchange, false );
		document.addEventListener( 'pointerlockerror', pointerlockerror, false );
		document.addEventListener( 'mozpointerlockerror', pointerlockerror, false );
		document.addEventListener( 'webkitpointerlockerror', pointerlockerror, false );

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

	controls = new PointerLockControls( camera );
	scene.add( controls.getObject());
	

	} else {
		instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';

	}

}

function setupStats() {
	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.top = '0px';
	stats.domElement.style.zIndex = 100;
	container.appendChild( stats.domElement );
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}

function detectCollision(objects) {

	function collide(objects, axis, origin, radius){

		var ax, obj, coll, rad, origin, intersects, distance, test;
		(axis) ? ax = axis : ax = false;
		
		(objects.hasOwnProperty("children")) ? obj = objects : obj = false;
		(origin.hasOwnProperty("getObject")) ? coll = origin : coll = false;
		(radius) ? rad = radius : rad = 20;


		if (ax && obj && coll){

			ray = new THREE.Ray();

			ray.direction = ax.clone();
			ray.origin = coll.getObject().position.clone();
			ray.origin.addSelf(ax.clone().multiplyScalar(rad / 2));
			helper.setDirection(ray.direction.clone());
			helper.position = ray.origin.clone();
			intersects = ray.intersectObjects(obj.children);

			if (intersects.length > 0) {
				var distance = intersects[ 0 ].distance;
				if (distance >= 0 && distance <= rad) {
					coll.pointUpdate(intersects[0].point, ax);
					coll.touchObject(true, ax);
				} else {

					coll.touchObject(false, ax);
				}
			} else {

				coll.touchObject(false, ax);
			}

		}
		
	}

	collide(objects, new THREE.Vector3(0, -1, 0), controls);
	collide(objects, new THREE.Vector3(0, 1, 0), controls);
	collide(objects, new THREE.Vector3(0, 0, -1), controls);
	collide(objects, new THREE.Vector3(0, 0, 1), controls);
	
}


function animate() {
	requestAnimationFrame(animate);
	render();
}

function render() {
	if (loaded) {
		detectCollision(collideWith);
		controls.update( Date.now() - time);
		stats.update();
		audio.update();
		renderer.render( scene, camera );
		time = Date.now();
		if (sound) sound.build(turtle, function(mesh){ if (mesh) collideWith.add(mesh);});
		// var rot = controls.getObject().rotation.clone();
		// console.log(rot.x, rot.y, rot.z); 
	}		
}

