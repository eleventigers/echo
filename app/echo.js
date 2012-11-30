Echo = function(){

	// DOM elements for the game
	var container = document.createElement('div');
					document.body.appendChild(container);
	var stats;

	// Dimmensions for the Three renderer
	var SCREEN_WIDTH = window.innerWidth+1, SCREEN_HEIGHT = window.innerHeight+1;

	// Global clock
	var TIME = Date.now();
	var START = Date.now();

	var GUI = (function(){
		var body = document.body;
		var doc = document;
		var overlay = $('#overlay');
		var tagline = $('#tagline' );

		body.requestPointerLock = body.requestPointerLock || body.mozRequestPointerLock || body.webkitRequestPointerLock;
		doc.exitPointerLock = doc.exitPointerLock || doc.mozExitPointerLock || doc.webkitExitPointerLock;
	
		return {
			overlay: {
				fade: function(oncomplete){
					$('#overlay').fadeToggle(1000, function(){
						if(oncomplete) oncomplete();
					});
				},
				menu: {
					enable: function(enabled){
						if(!enabled){
							$("#menu").hide();
						} else {
							$("#menu").show();
						}
					},
					title: {
						enable: function(enabled){
							if(!enabled){
								$("#menu header").hide();
							} else {
								$("#menu header").show();
							}
						},
					},
					buttons: {
						enable: function(enabled){
							if(!enabled){
								$("#menu #buttons").hide();
							} else {
								$("#menu #buttons").show();
							}
						},
						restart: {
							enable: function(enabled){
								if(!enabled){
									$("#menu #buttons #restart").addClass("disabled");
									$("#menu #buttons #restart").removeClass("enabled");
								} else {
									$("#menu #buttons #restart").addClass("enabled");
									$("#menu #buttons #restart").removeClass("disabled");
								}
							}
						},
						play: {
							enable: function(enabled){
								if(!enabled){
									$("#menu #buttons #play").addClass("disabled");
									$("#menu #buttons #play").removeClass("enabled");
								} else {
									$("#menu #buttons #play").addClass("enabled");
									$("#menu #buttons #play").removeClass("disabled");
								}
							}
						}
					}
				},
				tagline: {
					enable: function(enabled){
						if(!enabled){
							$("#tagline").hide();
						} else {
							$("#tagline").show();
						}
					}
				}
			},
			collection: {
				points: 0,
				update: function(points){
					if(points != this.points){
						this.points = points;
						$("#collection p").html(points);
					}		
				},
				enable: function(enabled){
					if(!enabled){
						$("#collection").hide();
					} else {
						$("#collection").show();
					}
				}
			},
			pointer: {
				lock: function(enabled){
					if(enabled){
						body.requestPointerLock();
					} else {
						doc.exitPointerLock();
					}
					
				}
			},
			loader: {
				enable: function(enabled){
					if(!enabled){
						$("#loader").hide();
					} else {
						$("#loader").show();
					}
				},
				update: function(percent, text){
					$("#loader p").html(percent+"%: loading "+text);
				}
			}
		}

	})();

	var renderer = setupRenderer(SCREEN_WIDTH, SCREEN_HEIGHT, container);
	var camera = setupCamera();
	var controls = setupControls(camera);
	var trace = setupAudio();
	var loader = new Util.Loader({audio:trace});

	// APPLICATION LOAD STATE //

	var initState = new GameState();

	initState.onActivation = function() {

		GUI.loader.enable(true);
		var samples = [
		"sounds/echo_s10.mp3", 
		"sounds/echo_s11.mp3", 
		"sounds/echo_s12.mp3",
		"sounds/echo_s13.mp3",
		"sounds/echo_s14.mp3",
		"sounds/echo_s15.mp3",
		"sounds/echo_s16.mp3",
		"sounds/echo_s17.mp3",
		"sounds/echo_s18.mp3",
		"sounds/echo_s19.mp3",
		"sounds/echo_s20.mp3",
		"sounds/echo_s21.mp3",
		"sounds/echo_s22.mp3",
		"sounds/echo_s23.mp3",
		"sounds/echo_s24.mp3",
		"sounds/echo_s25.mp3",
		"sounds/echo_s26.mp3",
		"sounds/echo_s27.mp3"
		];
		loader.load(
			{sound:samples}, 
			function(map, errors){
				GUI.loader.enable(false);
				GUI.overlay.menu.buttons.enable(true);
				GUI.overlay.tagline.enable(true);
			}, 
			function(file, toload, total){
				GUI.loader.update(100-Math.round(toload/total*100), file);
			});
	};

	initState.onMouseDown = function(event){
		if (event.toElement.id){
			var id = event.toElement.id;
			if(id === "play"){
				this.stateManager.setActiveAppState(defaultState);
				GUI.overlay.menu.buttons.restart.enable(true);
				GUI.pointer.lock(true);
			}
		}
	}


	// MAIN GAME STATE //

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
		event.preventDefault();

		if (event.toElement.id){
			var id = event.toElement.id;
			if(id === "play"){
				GUI.pointer.lock(true);		
			}
			if(id === "restart"){
				this.restart();
			}
		}

		if(this.running){	
			
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
									obj.parent.turtle.direction.copy(intersects[0].face.normal.clone());
									obj.parent.turtle.setWidth(.5);
									obj.parent.sound.play({buffer: this.level.player.collected, loop:true, building:true});
									this.level.player.collected = [];	
								} else {
									var branch = this.spawner.build(new THREE.Vector3(0,0,0), intersects[0].face.normal.clone().subSelf(new THREE.Vector3(Math.random()*0.4-0.2, Math.random()*0.3, Math.random()*0.4-0.2)).normalize(), .5);
									intersects[0].object.add(branch);	
									branch.sound.play({buffer: this.level.player.collected, loop:false, building:true});
									this.level.player.collected = [];
								}
							}		
						} else {
							if(intersects[0].distance <= 100){
								var branch = this.spawner.build(intersects[0].point, ray.direction.clone().negate().multiplySelf(new THREE.Vector3(-1, 1, -1)).normalize(), 10);
								this.level.populateWith(branch);
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
			camera.aspect = window.innerWidth / window.innerHeight;
			camera.updateProjectionMatrix();
			renderer.setSize( window.innerWidth+1, window.innerHeight+1 );			
	};

	initState.onResize = defaultState.onResize;

	defaultState.onRestart = function(){
		var self = this;
		this.level.reset(function(){
			self.level.setPlayer(self.controls.getYaw());
			self.level.spawnPlayer();
			GUI.pointer.lock(true);
			GUI.overlay.menu.buttons.play.enable(true);
		});
		START = Date.now();	
	};

	defaultState.onPause = function(){
		var self = this;
		this.running = false;
		this.audio.mixer.level(0);
		GUI.overlay.fade(function(){
			self.controls.lock(true);
			GUI.collection.enable(false);
		});
	};

	defaultState.onResume = function(){
		this.running = true;
		this.controls.lock(false);
		this.audio.mixer.level(1);
		GUI.overlay.fade(function(){
			GUI.collection.enable(true);
		});
	};

	defaultState.onFail = function(){
		this.running = false;
		GUI.overlay.menu.buttons.play.enable(false);
		GUI.pointer.lock(false);
	};

	defaultState.onRender = function(){
		if (this.running){
			this.controls.collUpdate(detectCollision(this.level.player.collideWith, this.controls));
			this.controls.update(Date.now() - TIME);
			TWEEN.update();
			this.audio.listener.update(this.camera);
			this.level.update();
			GUI.collection.update(this.level.player.collected.length);
			
			if(this.stateManager.cursor.downRight){
				if(TIME % 3 === 0) collectDrops(this);
			}

			if(TIME % 9 === 0) {
				var fail = this.level.testConditions("failures");
				if(fail.length > 0){
					if(fail[0] || fail[1]) this.fail();
				}
				var reach = this.level.testConditions("objectives");
				if(reach.length > 0 && reach[0]){
					var l = this.level.children.length;
					for(var i = 0; i < l; ++i){
						if(this.level.children[i].constructor === Struct.Tree){
							var rootChild = this.level.children[i].children[3];
							var who = {position:this.level.exit.point};
							var self = this;
							if(rootChild && rootChild.pickUp) rootChild.pickUp(who, 2000, function(pickings){
								for(var j = 0; j < pickings.length; ++j){
									pickings[j].collectable = false;
									self.level.player.allCollected.push(pickings[j]);
								}	
								if(i === l) theEnd(self);
							});
						}
					}			
				}
			}

			if(TIME - START > 5000){
				this.spawner.simulate();
			}

			this.renderer.render( this.level, this.camera );

			TIME = Date.now();
		}		
	};
	defaultState.onPointerLockChange = function(event) {			
		if ( document.pointerLockElement === document.body || document.mozPointerLockElement === document.body || document.webkitPointerLockElement === document.body ) {

			this.resume();
			
		} else {

			this.pause();
		}	
	};
	defaultState.onPointerLockError = function(event) {
		
	};

	defaultState.onActivation = function() {
		START = Date.now();
		this.renderer = renderer;
		this.camera = camera;
		this.controls = controls;
		this.audio = trace;
		this.audio.mixer.level(0);
		this.loader = loader;
		this.level = new Level.Zero({state: this});
		this.spawner = new Sim.Spawner({state:this, buffers:loader.get("sound")});
		this.level.setPlayer(this.controls.getYaw());
		this.level.spawnPlayer();
		animate();
	};

	var stateMan = new StateManager(initState, document);

	////
	
	////

	function setupRenderer(width, height, container) {
		var renderer = new THREE.WebGLRenderer( { alpha:false, antialias: true } );
		renderer.setSize( width, height );
		renderer.setClearColorHex(  0x111111, 1);
		renderer.shadowMapEnabled = true;
		renderer.shadowMapSoft = true;
		renderer.stencil = false;
		// renderer.gammaInput = true;
		// renderer.gammaOutput = true;
		renderer.physicallyBasedShading = true;
		container.appendChild(renderer.domElement);
		return renderer;
	}

	function setupAudio(listener){
		return new Trace();
	}

	function setupCamera(){
		return new THREE.PerspectiveCamera( 110, window.innerWidth / window.innerHeight, 1, 300000 );
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

	function collectDrops(state){

		var ray = lookAndShoot(state.controls);
		ray.precision = 0.000001;
		var intersects = ray.intersectObjects(state.level.player.collideWith, true);

		if (intersects.length > 0) {
			var first = intersects[ 0 ];
			var distance = first.distance;
			if (distance >= 0 && distance <= 1000) {
				if(first.object.collectable){
					first.object.pickUp(state.controls.getYaw(), 500, function(pickings){
						for(var i = 0; i < pickings.length; ++i){
							pickings[i].collectable = false;
							state.level.player.collected.push(pickings[i]);
							state.level.player.allCollected.push(pickings[i]);
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
		stateMan.activeAppState.render();
	}

	function theEnd(state){
		if(state.level.complete) return;
		state.level.complete = true;
		var tree = state.spawner.build(state.level.exit.point, new THREE.Vector3(0,1,0), 1);
		state.level.populateWith(tree);
		tree.sound.play({buffer: state.level.player.allCollected, loop:true, building:true});
	}	

	stateMan.setActiveAppState(initState);	
				

};

define("app/game", [], function () {return Echo});
	





