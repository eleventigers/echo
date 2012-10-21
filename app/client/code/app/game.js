
// DOM elements for the game
var container = document.createElement('div');
				document.body.appendChild(container);
var stats;

// Dimmensions for the Three renderer nad camera
var MARGIN = 100, SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;

// Three renderer options
var SHADOW_MAP_WIDTH = 2048, SHADOW_MAP_HEIGHT = 2048, FLOOR = -250, NEAR = 5, FAR = 50000;

// Global objects
var renderer, camera, scene, controls, projector, plane;

// Track mouse
var mouse = new THREE.Vector2(), offset = new THREE.Vector3(), INTERSECTED, SELECTED, SHIFT = false, MOUSEDOWN = false, MOUSEDOWNx = 0;

// Global clock
var time = Date.now();

// Freesound API access
var freesound = new Freesound('d34c2909acd242819a7f4ceba6a7c041', true);

// Pointer lock

var objects = [];
var ray;
var blocker = document.getElementById( 'blocker' );
var instructions = document.getElementById( 'instructions' );
var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;


exports.init = function() {
	setupRenderer();
	setupScene();
	setupControls();
	setupStats();
	animate();
	

}

function setupRenderer() {

	renderer = new THREE.WebGLRenderer( { clearColor: 0xBCD2EE, clearAlpha: 1, antialias: false } );
	renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );
	renderer.autoClear = false;
	renderer.shadowMapEnabled = true;
	renderer.shadowMapSoft = true;
	renderer.physicallyBasedShading = false;
	container.appendChild(renderer.domElement);
	window.addEventListener( 'resize', onWindowResize, false );

}

function setupScene(){

	camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000 );

	scene = new THREE.Scene();
	scene.fog = new THREE.FogExp2( 0xBCD2EE, 0.0001 );

	var light = new THREE.DirectionalLight( 0xffffff, 1.5 );
	light.position.set( 1, 1, 1 );
	scene.add( light );

	var light = new THREE.DirectionalLight( 0xffffff );
	light.position.set( -1, - 0.5, -1 );
	scene.add( light );

	ray = new THREE.Ray();
	ray.direction.set( 0, -1, 0 );

	// var tree = new Tree(10, camera.position);
	// scene.add(tree);
	// objects.push(tree);

	// for (var i = 0; i < 10; i++){
	// 	tree.grow();

	// }

	var prods = {
		
		A : function(params) {
			var p = this.pConv(params);
			
				if (p[1] <= 3){
					var x = p[0]*2;
					var y = p[0]+p[1];
					return ("A("+x+","+y+")");
				}
				if (p[1] > 3){
					var x = p[0];
					var y = p[0]/p[1];
					return ("B("+x+")A("+y+",0)");
				}
				else{
					return "A";
				}
			
			
		},
		B : function(params) {
			var p = this.pConv(params);
	
				if (p[0] < 1){
					return "C";
				}
				if (p[0] >= 1){
					var x = p[0]-1;
					return "B("+x+")";
				}
				else{
					return "B";
				}
			
		},
		pConv : function(params){
			var conv = [];
			for (var i = 0; i < params.length; i++){
				conv.push(parseInt(params[i]));
			}
			return conv;
		}
	}

	var l = new L(prods);
	var c = l.build("B(2)A(4, 4)", 100);


	console.log(c);

	

	// // floor

	// geometry = new THREE.PlaneGeometry( 2000, 2000, 100, 100 );
	// geometry.applyMatrix( new THREE.Matrix4().makeRotationX( - Math.PI / 2 ) );


	// material = new THREE.MeshPhongMaterial( { color: 0xffffff } );

	// mesh = new THREE.Mesh( geometry, material );
	// scene.add( mesh );

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
	scene.add( controls.getObject() );

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
	tree.grow();
}


function animate() {
	requestAnimationFrame(animate);
	render();
}

function render() {

	controls.isOnObject( false );

	ray.origin.copy( controls.getObject().position );
	ray.origin.y -= 10;

	var intersections = ray.intersectObjects( objects );

	if ( intersections.length > 0 ) {

		var distance = intersections[ 0 ].distance;

		if ( distance > 0 && distance < 10 ) {

			controls.isOnObject( true );

		}

	}

	controls.update( Date.now() - time);
	stats.update();
	renderer.render( scene, camera );
	time = Date.now();



	
}