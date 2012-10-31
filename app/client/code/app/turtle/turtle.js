/**
 * @author prAk https://github.com/progma
 * @mod jokubas@tailwinded.com
 */


Turtle = function(position, direction, up, material, geometry, width){
	
	this.position = position;
	this.direction = direction;
	//console.log(this.direction);
	this.up = up;
	this.material = material;
	this.geometry = geometry;
	this.width = width;
	this.direction.normalize();
	this.up.normalize();
	this.droppings = [];
	this.drawing = true;
	this.stack = [];

}

Turtle.prototype.constructor = Turtle;

Turtle.prototype.go = function(distance){
	var newPosition;
    newPosition = new THREE.Vector3();
    newPosition.add(this.position, this.direction.clone().multiplyScalar(distance));
    if (this.drawing) {
    	this.droppings.push({
          from: this.position,
          to: newPosition,
          material: this.material,
          geometry: this.geometry,
          width: this.width
        });
    }

    return this.position = newPosition;
};
Turtle.prototype.drop = function(distance){
	var newPosition, distance, mesh, bottomRadius, topRadius, height, shearFactor, turtleTransform;
    newPosition = new THREE.Vector3();
    newPosition.add(this.position, this.direction.clone().multiplyScalar(distance));
    if (this.drawing) {
        distance = this.position.distanceTo(newPosition);
		mesh = new THREE.Mesh(this.geometry, this.material);
		bottomRadius = this.width;
		topRadius = this.width;
		height = distance;
		shearFactor = (topRadius - bottomRadius) / height;
		turtleTransform = new THREE.Matrix4();
		turtleTransform.translate(this.position);
		turtleTransform.lookAt(this.position, newPosition, this.getPerpVec(newPosition.clone().subSelf(this.position)));
		turtleTransform.multiplySelf(new THREE.Matrix4(1, shearFactor, 0, 0, 0, 1, 0, 0, 0, shearFactor, 1, 0, 0, 0, 0, 1));
		turtleTransform.scale(new THREE.Vector3(bottomRadius, bottomRadius, height));
		mesh.applyMatrix(turtleTransform);
    }
    this.position = newPosition;
    return mesh;
};
Turtle.prototype.yaw = function(angle) {
	var rotation;
	rotation = new THREE.Matrix4().makeRotationAxis(this.up, this.deg2rad(angle));
	rotation.multiplyVector3(this.direction);
	return this.direction.normalize();
};
Turtle.prototype.pitch = function(angle) {
	var right, rotation;
	right = new THREE.Vector3().cross(this.direction, this.up).normalize();
	rotation = new THREE.Matrix4().makeRotationAxis(right, this.deg2rad(angle));
	rotation.multiplyVector3(this.direction);
	this.direction.normalize();
	rotation.multiplyVector3(this.up);
	return this.up.normalize();
};
Turtle.prototype.roll = function(angle) {
	var rotation;
	rotation = new THREE.Matrix4().makeRotationAxis(this.direction, this.deg2rad(angle));
	rotation.multiplyVector3(this.up);
	return this.up.normalize();
};
Turtle.prototype.penUp = function() {
  	return this.drawing = false;
};
Turtle.prototype.penDown = function() {
  	return this.drawing = true;
};
Turtle.prototype.setWidth = function(width) {
  	this.width = width;
};
Turtle.prototype.setMaterial = function(material) {
  	this.material = material;
};
Turtle.prototype.setColor = function(hex) {
	var hexInt = parseInt(hex);
  	return this.setMaterial(new THREE.MeshLambertMaterial({
    	color: hexInt,
    	ambient: hexInt
  	}));
};
Turtle.prototype.retrieveMeshes = function() {
	var bottomRadius, distance, from, height, material, mesh, shearFactor, to, topRadius, turtleTransform, width, _i, _len, _ref, _ref2, _results;
	_ref = this.droppings;
	_results = [];
	for (_i = 0, _len = _ref.length; _i < _len; _i++) {
		_ref2 = _ref[_i], from = _ref2.from, to = _ref2.to, material = _ref2.material, geometry = _ref2.geometry, width = _ref2.width;
		distance = from.distanceTo(to);
		mesh = new THREE.Mesh(geometry, material);
		bottomRadius = width;
		topRadius = width;
		height = distance;
		shearFactor = (topRadius - bottomRadius) / height;
		turtleTransform = new THREE.Matrix4();
		turtleTransform.translate(from);
		turtleTransform.lookAt(from, to, this.getPerpVec(to.clone().subSelf(from)));
		turtleTransform.multiplySelf(new THREE.Matrix4(1, shearFactor, 0, 0, 0, 1, 0, 0, 0, shearFactor, 1, 0, 0, 0, 0, 1));
		turtleTransform.scale(new THREE.Vector3(bottomRadius, bottomRadius, height));
		mesh.applyMatrix(turtleTransform);
		_results.push(mesh);
	}
	return _results;
};



Turtle.prototype.push = function(){
	this.stack.push({position: this.position, direction : this.direction, up : this.up, material : this.material, geometry : this.geometry, width : this.width, drawing : this.drawing});
	return this;
}

Turtle.prototype.pop = function(){
	var state = this.stack.pop();
	this.position = state.position;
	this.direction = state.direction;
	this.up = state.up;
	this.material = state.material;
	this.geometry = state.geometry;
	this.width = state.width;
	this.drawing = state.drawing;
	return this;
}

Turtle.prototype.deg2rad = function(degrees) {
    return degrees / 360 * 2 * Math.PI;
};

Turtle.prototype.getPerpVec = function(vec) {
    if (vec.z === 0) {
      return new THREE.Vector3(0, 0, 1);
    } else if (vec.y === 0) {
      return new THREE.Vector3(0, 1, 0);
    } else {
      return new THREE.Vector3(0, 1, -(vec.y / vec.z));
    }
};

