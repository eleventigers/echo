
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

	var d = 10;

	var ls = new jjs.Lsystem({ 
              "+": function() {  },
              "-": function() {  },
              "&": function() {  },
              "^": function() {  },
              "l": function() {  },
              "r": function() {  },
              "|": function() {  },
              "F": function() {  }
             }, 
             [ {id: "F"} ], 
             [ 
               { p: [ {id: "F"} ], 
                 s: [ {p: 0.33, f: function() { return [{id:"F"},[{id:"+"},{id:"F"}], 
                                             {id:"F"},[{id:"-"},{id:"F"}],{id:"F"}];} },
                      {p: 0.33, f: function() { return [{id:"F"},[{id:"+"},{id:"F"}],{id:"F"}];} },
                      {p: 0.34, f: function() { return [{id:"F"},[{id:"-"},{id:"F"}],{id:"F"}];} }
                    ] }
             ]
    );
	
	var material = new THREE.MeshLambertMaterial({
      color: 0xFF0000,
      ambient: 0xFF0000
    });

    var turtleGeometry = new THREE.CubeGeometry(1, 1, 1);
    var normalizationMatrix = new THREE.Matrix4();
    normalizationMatrix.rotateX(Math.PI / 2);
    normalizationMatrix.translate(new THREE.Vector3(0, -0.5, 0));
    turtleGeometry.applyMatrix(normalizationMatrix);

	var turtle = new Turtle(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1), material, turtleGeometry, 5);


	for (var i = 0; i < 50; i++)
	{
	  turtle.go(20);
	  turtle.pitch(20);
	  turtle.roll(10);
	}

	var meshes = turtle.retrieveMeshes();
    for (var _i = 0, _len = meshes.length; _i < _len; _i++) {
      scene.add(meshes[_i]);
    }

	console.log(turtle);


	// floor

	geometry = new THREE.PlaneGeometry( 2000, 2000, 100, 100 );
	geometry.applyMatrix( new THREE.Matrix4().makeRotationX( - Math.PI / 2 ) );


	material = new THREE.MeshPhongMaterial( { color: 0xffffff } );

	mesh = new THREE.Mesh( geometry, material );
	scene.add( mesh );

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