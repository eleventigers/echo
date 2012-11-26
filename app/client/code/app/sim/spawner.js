/**
 * @author eleventigers / http://jokubasdargis.com/
 */

Sim.Spawner = function(properties){

	if (!properties) {
        properties = this.getDefaults();
    }

    this.state = properties.state;
    this.bounds = properties.bounds || this.defaults.bounds.value;
    this.time = properties.time || this.defaults.time.value;
    this.material = properties.material || this.defaults.material.value();
    this.geometry = properties.geometry || this.defaults.geometry.value();
    this.buffers = properties.buffers;

    this.position = new THREE.Vector3();
    this.direction = new THREE.Vector3();

}

Sim.Spawner.prototype.constructor = Sim.Spawner;

Sim.Spawner.prototype.getDefaults = function(){
	var result = {};
    for (var key in this.defaults) {
        result[key] = this.defaults[key].value;
    }
    return result;
};
Sim.Spawner.prototype.defaults = {
	bounds: {
		value: { 
			x: [200, 200],
			y: [200, 200],
			z: [200, 200]
		}
	},
	time: {
		value: {
			min: 3000,
			max: 10000,
			last: 0,
			frame: 5000
		}
	},
	geometry: {
		value: function(){
			var turtleGeometry = new THREE.CubeGeometry(0.75, 1, 0.025);
			var normalizationMatrix = new THREE.Matrix4();
			normalizationMatrix.rotateX(Math.PI / 2);
			normalizationMatrix.translate(new THREE.Vector3(0, -0.5, 0));
			turtleGeometry.applyMatrix(normalizationMatrix);
			turtleGeometry.computeBoundingSphere();
			return turtleGeometry;
		}
	},
	material: {
		value : function(){	 
			return new THREE.MeshLambertMaterial();
		}
	}
};

Sim.Spawner.prototype.setBuffers = function(list){
	if(list) this.buffers = list;
};

Sim.Spawner.prototype.simulate = function(){
	if(this.state && this.buffers){
		var currTime = Date.now(); 
		if(currTime - this.time.last >= this.time.frame){
			this.time.last = currTime;
			this.time.frame = Math.max(this.time.min, Math.floor(Math.random()*this.time.max));
			this.position.x = (Math.random()*this.bounds.x[0]-(this.bounds.x[1]/2));
			this.position.y = (Math.random()*this.bounds.y[0]-(this.bounds.y[1]/2));
			this.position.z = (Math.random()*this.bounds.z[0]-(this.bounds.z[1]/2));
			this.direction.x = (Math.random()*2-1);
			this.direction.y = (Math.random()*2-1);
			this.direction.z = (Math.random()*2-1);
			var newTree = this.build(this.position, this.direction);
			this.state.scene.add(newTree);
			this.state.playsects.push(newTree);
			var buff = Math.floor(Math.random()*this.buffers.length);
			newTree.sound.play({buffer: this.buffers[buff], loop: false, building: true, suicide: true});
		}
	}
};

Sim.Spawner.prototype.build = function(position, direction){

	var pos = (!position) ? new THREE.Vector3(0,0,0) : position;
	var dir = (!direction) ? new THREE.Vector3(Math.random()*2-1, Math.random()*1, Math.random()*2-1) : direction;
	var tree = new Struct.Tree();
	var sound = new this.state.audio.Sound3D();
	var turtle = new Turtle(pos.clone(), dir.clone(), new THREE.Vector3(0, 1, 0), this.material, this.geometry, .1, this.state.playsects);

	tree.add(sound);
	tree.add(turtle);	

	tree.sound = sound;
	tree.turtle = turtle;
	
	return tree;
};

Sim.Spawner.prototype.toString = function() {
	return "Sim.Spawner"
}