exports.init = function() {
	stateMan.setActiveAppState(defaultState);
	animate();	
}

// DOM elements for the game
var container = document.createElement('div');
				document.body.appendChild(container);
var stats;

// Dimmensions for the Three renderer
var SCREEN_WIDTH = window.innerWidth+1, SCREEN_HEIGHT = window.innerHeight;

// Global clock
var TIME = Date.now();

var GUI = (function(){

	var element = document.body;
	var blocker = document.getElementById( 'blocker' );
	var instructions = document.getElementById( 'instructions' );
	var collection = $('#collection p');
	var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;

	if(havePointerLock){
		instructions.addEventListener( 'click', function ( event ) {
			element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
			element.requestPointerLock();
		}, false );
	} else {
		instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';
	}	

	return {
		overlay: {
			enable: function(enabled){
				if(!enabled){
					blocker.style.display = 'none';
					instructions.style.display = 'none';
				} else {
					blocker.style.display = '-webkit-box';
					blocker.style.display = '-moz-box';
					blocker.style.display = 'box';
					instructions.style.display = '';
				}	
			}
		},
		collection: {
			points: 0,
			update: function(points){
				if(points != this.points){
					this.points = points;
					$(collection).html(points);
				}
					
			}
		}
	}

})();


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
	
			if(this.level.player.collected.length > 0){

				var ray = lookAndShoot(this.controls);
				var intersects = ray.intersectObjects(this.level.player.collideWith, true);
				if(intersects.length > 0){
					if(intersects[0].object.constructor === Struct.Segment){
						var obj = intersects[0].object;
						if (obj.parent){
							var l = obj.parent.children.length;
							if(obj === obj.parent.children[3] || obj === obj.parent.children[l-1]){
								obj.parent.turtle.position.copy(obj.position);
								obj.parent.turtle.direction.copy(intersects[0].face.normal.clone().subSelf(new THREE.Vector3(Math.random()*0.4-0.2, Math.random()*0.8, Math.random()*0.4-0.2)).normalize());
								obj.parent.sound.play({buffer: this.level.player.collected, loop:true, building:true});
								this.level.player.collected = [];	
							} else {
								var branch = this.spawner.build(new THREE.Vector3(0,0,0), intersects[0].face.normal.clone().subSelf(new THREE.Vector3(Math.random()*0.4-0.2, Math.random()*0.8, Math.random()*0.4-0.2)).normalize());
								intersects[0].object.add(branch);	
								branch.sound.play({buffer: this.level.player.collected, loop:false, building:true});
								this.level.player.collected = [];
							}
						}
						
					} else {
						if(intersects[0].distance <= 50){

							var branch = this.spawner.build(intersects[0].point, ray.direction.clone().negate().multiplySelf(new THREE.Vector3(-1, 1, -1)).normalize());
							console.log(branch)
							this.level.add(branch);
							this.level.player.collideWith.push(branch);
							branch.sound.play({buffer: this.level.player.collected, loop:true, building:true});
							this.level.player.collected = [];
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
		this.collisions = detectCollision(this.level.player.collideWith, this.controls);
		this.controls.collUpdate(this.collisions);
		this.controls.update(Date.now() - TIME);
		this.spawner.simulate();
		TWEEN.update();
		this.audio.listener.update(this.camera);
		this.stats.update();
		this.renderer.render( this.level, this.camera );
		GUI.collection.update(this.level.player.collected.length);
				
		if(this.stateManager.cursor.downLeft){

		} 
		if(this.stateManager.cursor.downRight){
			if(this.counter === 1) collectDrops();
		}

		TIME = Date.now();

		if(this.counter == 3) this.counter = 0;
	}

	
	
};
defaultState.onPointerLockChange = function(event) {
			
	if ( document.pointerLockElement === document.body || document.mozPointerLockElement === document.body || document.webkitPointerLockElement === document.body ) {
		this.running = true;
		this.audio.mixer.level(1);
		GUI.overlay.enable(false);
	} else {
		this.running = false;
		this.audio.mixer.level(0);
		GUI.overlay.enable(true);
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
	this.level = new Level.Zero({renderer: this.renderer});
	this.level.setPlayer(this.controls.getYaw());
	this.level.spawnPlayer();
	this.audio = setupAudio();
	this.audio.mixer.level(0);
	this.stats = setupStats(container);
	this.loader = new Util.Loader({state:this});
	this.spawner = new Sim.Spawner({state:self});

	var samples = ["/sounds/hmpback1.wav", "/sounds/flickburn.WAV", "/sounds/woodoverblade.wav"];
	var free = ["19659", "45584", "15985"]

	this.loader.load({sound:samples}, function(map, errors){
		self.spawner.setBuffers(map.sound.cache);

	});
		
	
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

function collectDrops(){

	var ray = lookAndShoot(stateMan.activeAppState.controls);
	ray.precision = 0.000001;
	var intersects = ray.intersectObjects(stateMan.activeAppState.level.player.collideWith, true);

	if (intersects.length > 0) {
		var first = intersects[ 0 ];
		var distance = first.distance;
		if (distance >= 0 && distance <= 1000) {
			if(first.object.collectable){
				first.object.pickUp(stateMan.activeAppState.controls.getYaw(), 500, function(pickings){
					for(var i = 0; i < pickings.length; ++i){
						pickings[i].collectable = false;
						stateMan.activeAppState.level.player.collected.push(pickings[i]);
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


