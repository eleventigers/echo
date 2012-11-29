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
		point: new THREE.Vector3(-550,2,0),
		radius: 25
	};
	this.exit = {
		point: new THREE.Vector3(2000,8,-500),
		radius: 50
	};

	this.reusable = {
		geometry:[
			new THREE.SphereGeometry(200, 50),
			new THREE.CubeGeometry(0.75, 1, 0.25),
			new THREE.CubeGeometry(1, 1, 1)
		],
		material:[
			new THREE.MeshLambertMaterial({ color: 0xffffff, ambient: 0xffffff }),
			new THREE.MeshLambertMaterial({ color: 0x96cde6, ambient: 0x96cde6, wireframe:true, opacity : 0.05, transparent : true  }),
			new THREE.MeshBasicMaterial({ color: 0x000000, opacity:0.9, transparent : true })
		]
	};

	this.normalizationMatrix = new THREE.Matrix4();
	this.normalizationMatrix.rotateX(Math.PI / 2);
	this.normalizationMatrix.translate(new THREE.Vector3(0, -0.5, 0));
	this.reusable.geometry[1].applyMatrix(this.normalizationMatrix);
	this.reusable.geometry[2].applyMatrix(this.normalizationMatrix);
	this.reusable.geometry[1].computeBoundingSphere();
	this.reusable.geometry[2].computeBoundingSphere();

	this.fog = new THREE.FogExp2( 0x111111, 0.00009 );

	this.static = {
		objects: [
			new THREE.Mesh(this.reusable.geometry[0], this.reusable.material[0]),
			new Struct.Platform(100,100,50000),
			new THREE.DirectionalLight( 0x757575, .1 ),
			new THREE.AmbientLight( 0xf2f2f2 ),
			new THREE.SpotLight(0xffffff, 1 ),
			new THREE.SpotLight(0xffffff, 50 ),
			new Struct.Platform(100,100,50000),
			new Struct.Platform(),
			new Struct.Platform(100,90),
			new Struct.Platform(50,50),
			new Struct.Platform(90,100),
			new Struct.Platform(10000,10,1)

		]
	};

	this.static.objects[0].position.set(10000, 3500, 3000);
	this.static.objects[1].position.y = -25000;
	this.static.objects[2].position.set( 1000, 5000, 1000 );
	this.static.objects[2].castShadow = true;
	this.static.objects[2].shadowCameraNear = 50;
	this.static.objects[2].shadowCameraFar = 6000;
	this.static.objects[2].shadowDarkness = 0.3;
	this.static.objects[2].shadowMapWidth = 4096;
	this.static.objects[2].shadowMapHeight = 4096;
	this.static.objects[4].position = this.player.mesh.position.clone();
	this.static.objects[4].target = this.static.objects[0];
	this.static.objects[4].castShadow = true;
	this.static.objects[5].position.set(5000, 4500, -4000);
	this.static.objects[5].target = this.static.objects[0];
	this.static.objects[6].position.set(2000, -25000, -500);
	this.static.objects[7].position.set(200, -25080, -100);
	this.static.objects[8].position.set(700, -25050, 0);
	this.static.objects[9].position.set(1300, -25100, 300);
	this.static.objects[10].position.set(1700, -25050, 100);
	this.static.objects[11].position.set(-5050, -1, 0);

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

	this.failures = [
		function(){
			if(self.player.mesh.position.y  <= -20000){
				return true;
			} else {
				return false;
			}
		},
		function(){
			if(self.player.mesh.position.x  <= -2000){
				return true;
			} else {
				return false;
			}
		}
	]; 

	this.populateWith(this.static.objects);
	this.populateWith(this.generateClouds());
	this.populateWith(this.generateStars());
}

Level.Zero.prototype = new Level();

Level.Zero.prototype.reset = function(oncomplete){
if(!oncomplete) return;

this.player.collected = [];

for(var i = 0; i < this.children.length; ++i){
	if(this.children[i].constructor === Struct.Tree) {
		this.children[i].removeSelf();
	}
}

oncomplete();
};

Level.Zero.prototype.generateClouds = function(){
var self = this;
var geometry = new THREE.Geometry();
geometry.materials.push(this.reusable.material[1]);
geometry.materials.push(this.reusable.material[2]);

for(var i = 0; i < 1000; ++i) {
	geometry.vertices.push(new THREE.Vector3(  (Math.cos(i/Math.PI*Math.random())*100000) ,  (Math.sin(i) * Math.random()*100000), (Math.sin(i/Math.PI*Math.random())*100000)));
	var index = i+1;
	if(index % 3 === 0){
		geometry.faces.push( new THREE.Face3( i, i-1, i-2, undefined, undefined, Math.floor(Math.random()*2)));
	}
}

geometry.computeFaceNormals();
geometry.computeVertexNormals();
geometry.mergeVertices();
geometry.dynamic = true;
geometry.dirtyVertices = true;

var clouds = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial());

clouds.collideWithPlayer = false;
clouds.collideWithDynamic = false;

var startTime =  Date.now();
clouds.update = setInterval(function(){
	var time =  Date.now();
	var past = time - startTime;
	clouds.rotation.y += 0.0005;	
	for(var i = 0; i < clouds.geometry.vertices.length; ++i){
		var index = i+1;
		var change =  Math.sin(Math.log(past/i)) *   Math.sqrt(i) / 10;
		if(index % 3 === 0){
			clouds.geometry.vertices[ i ].z -= change;
			clouds.geometry.vertices[ i-1 ].z -=  change;
			clouds.geometry.vertices[ i-2 ].z -=  change;
			clouds.geometry.vertices[ i ].y +=  Math.cos(change*i);
			clouds.geometry.vertices[ i-1 ].y +=  Math.cos(change*i);
			clouds.geometry.vertices[ i-2 ].y +=  Math.cos(change*i);		
		}
		
	}
	clouds.geometry.verticesNeedUpdate = true;
}, 25);

clouds.applyMatrix(this.normalizationMatrix);
clouds.position.y = - 20000;

return clouds;
};

Level.Zero.prototype.generateStars = function(){

var geometry = new THREE.Geometry();

for ( i = 0; i < 5000; ++i ) {
	vector = new THREE.Vector3( Math.max(10000, Math.random()*10000-500), Math.random()*50000-5000, Math.random()*i*500 - Math.random()*i*1000-i*100 );
	geometry.vertices.push(  vector  );
}

var material = new THREE.ParticleBasicMaterial( { size: 30} );
var particles = new THREE.ParticleSystem( geometry, material );	

return particles;	
};

define(['app/lvl/level'], function (){ return Level.Zero }); 









