Level.Zero = function(properties){
	this.renderer = properties.renderer || false;
	var self = this;
	Level.call(this);

	this.player = {
		mesh: {
			position: new THREE.Vector3()
		},
		collideWith: [],
		collected: []
	};

	this.entry = {
		point: new THREE.Vector3(0,0,0),
		radius: 25
	};
	this.exit = {
		point: new THREE.Vector3(0,0,0),
		radius: 25
	};

	this.reusable = {
		geometry:[
			new THREE.SphereGeometry(200, 20),
			new THREE.CubeGeometry(0.75, 1.5, 0.025),
			new THREE.CubeGeometry(1, 1, 1)
		],
		material:[
			new THREE.MeshLambertMaterial({ color: 0xffffff, ambient: 0xffffff }), 
		]
	};

	this.normalizationMatrix = new THREE.Matrix4();
	this.normalizationMatrix.rotateX(Math.PI / 2);
	this.normalizationMatrix.translate(new THREE.Vector3(0, -0.5, 0));
	this.reusable.geometry[1].applyMatrix(this.normalizationMatrix);
	this.reusable.geometry[2].applyMatrix(this.normalizationMatrix);
	this.reusable.geometry[1].computeBoundingSphere();
	this.reusable.geometry[2].computeBoundingSphere();

	this.fog = new THREE.FogExp2( 0x121212, 0.0005 );

	this.static = {
		objects: [
			new THREE.Mesh(this.reusable.geometry[0], this.reusable.material[0]),
			new Struct.Platform(),
			new THREE.DirectionalLight( 0x757575, 1 ),
			new THREE.AmbientLight( 0xf2f2f2 ),
			new THREE.SpotLight(0xffffff, 1 ),
			new THREE.SpotLight(0xffffff, 50 )
		]
	};

	this.static.objects[0].position.set(1000, 3500, 3000);
	this.static.objects[1].position.y = -2500;
	this.static.objects[2].position.set( 1000, 5000, 1000 );
	this.static.objects[2].castShadow = true;
	this.static.objects[2].shadowCameraNear = 50;
	this.static.objects[2].shadowCameraFar = 6000;
	this.static.objects[2].shadowDarkness = 0.3;
	this.static.objects[2].shadowMapWidth = 4096;
	this.static.objects[2].shadowMapHeight = 4096;
	this.static.objects[4].position = this.player.mesh.position;
	this.static.objects[4].target = this.static.objects[0];
	this.static.objects[4].castShadow = true;
	this.static.objects[5].position.set(0, 4500, 0);
	this.static.objects[5].target = this.static.objects[0];

	this.dynamic = {
		objects: [],
		collideWith: []
	};

	this.objectives[0] = function(){
		if(self.player.mesh.position.distanceTo(self.exit.point) <= self.exit.radius){
			return true;
		} else {
			return false;
		}
	};

	this.populateWith(this.static.objects);
	this.populateWith(this.generateTerrain());
}

Level.Zero.prototype = new Level();

Level.Zero.prototype.generateTerrain = function(){
	var self = this;
	var terrain = new THREE.Object3D();
	terrain.collideWithPlayer = true;
	terrain.collideWithDynamic = true;

	var currScale = new THREE.Vector3(1,1,1);
	var currPosition = new THREE.Vector3(0,-50,0);


	function addBlock(i) {

		var block = new THREE.Mesh(self.reusable.geometry[2], self.reusable.material[0]);
		block.scale = currScale.clone();
		block.position = currPosition.clone();
		terrain.add(block);
		currPosition.addSelf(new THREE.Vector3( i%(Math.random()*100-50), i%(Math.random()*100-50), i%(Math.random()*100-50)));
		currScale.addSelf(new THREE.Vector3(i % (Math.random()*10000), i*(Math.random()*100)%i, i % (Math.random()*10)));

	}

	for(var i = 0; i < 400; ++i){
		addBlock(i)
	}
	terrain.applyMatrix( new THREE.Matrix4().makeRotationX( Math.PI / 2  ) );
	return terrain;
};






