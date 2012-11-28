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
			new THREE.MeshLambertMaterial({ color: 0xcccccc, ambient: 0x96cde6 }) 
		]
	};

	this.reusable.material[1].opacity = 0.1;
	this.reusable.material[1].transparent = true;
	this.reusable.material[1].receiveShadow = true;

	this.normalizationMatrix = new THREE.Matrix4();
	this.normalizationMatrix.rotateX(Math.PI / 2);
	this.normalizationMatrix.translate(new THREE.Vector3(0, -0.5, 0));
	this.reusable.geometry[1].applyMatrix(this.normalizationMatrix);
	this.reusable.geometry[2].applyMatrix(this.normalizationMatrix);
	this.reusable.geometry[1].computeBoundingSphere();
	this.reusable.geometry[2].computeBoundingSphere();

	this.fog = new THREE.FogExp2( 0x000000, 0.0005 );

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
	this.populateWith(this.generateClouds());
}

Level.Zero.prototype = new Level();

Level.Zero.prototype.updateClouds = function(){

}

Level.Zero.prototype.generateClouds = function(){
	var self = this;
	var geometry = new THREE.Geometry();
	

	function addBlock(i) {

		geometry.vertices.push(new THREE.Vector3(  (Math.cos(i/Math.PI*i)*10000),  (Math.sin(i) * 10000), (Math.sin(i/Math.PI*i)*10000)));
		
		var index = i+1;
		if(index % 3 === 0){
			geometry.faces.push( new THREE.Face3( i, i-1, i-2) );
		}
	}

	for(var i = 0; i < 1000; ++i){
		addBlock(i)
	}

	geometry.computeFaceNormals();
	geometry.computeVertexNormals();
	geometry.mergeVertices();
	geometry.dynamic = true;
	geometry.dirtyVertices = true;
	THREE.GeometryUtils.normalizeUVs(geometry);
	var clouds = new THREE.Mesh(geometry, self.reusable.material[1]);
	clouds.rotation.y = - 90 * Math.PI / 180;
	clouds.position.y = - 10000;
	clouds.collideWithPlayer = false;
	clouds.collideWithDynamic = false;
	var startTime =  Date.now();
	clouds.update = setInterval(function(){
		var time =  Date.now();
		var past = time - startTime;
		//console.log(past, clouds.geometry)
		clouds.rotation.y += 0.001;
		
		for(var i = 0; i < clouds.geometry.vertices.length; ++i){
			var index = i+1;
			var change =  Math.sin(Math.log(past)) *   i / 100;
		
			if(index % 3 === 0){
				clouds.geometry.vertices[ i ].z += change;
				clouds.geometry.vertices[ i-1 ].z +=  change;
				clouds.geometry.vertices[ i-2 ].z +=  change;
				clouds.geometry.vertices[ i ].x +=  change;
				clouds.geometry.vertices[ i-1 ].x +=  change;
				clouds.geometry.vertices[ i-2 ].x +=  change;
				clouds.geometry.vertices[ i ].y +=  Math.cos(change*i);
				clouds.geometry.vertices[ i-1 ].y +=  Math.cos(change*i);
				clouds.geometry.vertices[ i-2 ].y +=  Math.cos(change*i);
				
			}
			
		}
		clouds.geometry.verticesNeedUpdate = true;
		clouds.geometry.normalsNeedUpdate = true;
	}, 25);
	//clouds.material.wireframe = true;
	
	return clouds;
};






