/**
 * @author eleventigers / http://jokubasdargis.com/
 */

Sim.Spawner = function(properties){

	if (!properties) {
        properties = this.getDefaults();
    }

    this.state = properties.state || null;
    this.bounds = properties.bounds || this.defaults.bounds.value;
    this.time = properties.time || this.defaults.time.value;
    this.material = properties.material || this.defaults.material.value();
    this.geometry = properties.geometry || this.defaults.geometry.value();


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
			x: [-500, 500],
			y: [-500, 500],
			z: [-500, 500]
		}
	},
	time: {
		value: {
			min: 5000,
			max: 60000
		}
	},
	geometry: {
		value: function(){
			var turtleGeometry = new THREE.CubeGeometry(1.5, 1, 0.25);
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

Sim.Spawner.prototype.update = function(){

	if(!this.state) return;

};

Sim.Spawner.prototype.build = function(position, direction){

	var pos = (!position) ? new THREE.Vector3(0,0,0) : position;
	var dir = (!direction) ? new THREE.Vector3(Math.random()*1-2, Math.random()*1, Math.random()*1-2) : direction;
	var tree = new Struct.Tree();
	var sound = new this.state.audio.Sound3D();
	var turtle = new Turtle(pos, dir, new THREE.Vector3(0, 1, 0), this.material, this.geometry, .1, this.state.playsects);

	tree.add(sound);
	tree.add(turtle);	

	tree.sound = sound;
	tree.turtle = turtle;
	
	return tree;
};