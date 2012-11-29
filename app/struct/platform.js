Struct.Platform = function (x, y, z) {
	THREE.Mesh.call(this);

	var x = x || 100;
	var y = y || 100;
	var z = z || 50000;

	this.geometry = new THREE.CubeGeometry( x, y, z );
	this.geometry.materials[0] = this.solidMat;		 
	this.geometry.materials[1] = this.wireMat;

	for (var i = 0; i < this.geometry.faces.length; ++i){
		this.geometry.faces[i].materialIndex = (i === 4 || i === 5) ? 0 : 1;
	}
	this.material =  new THREE.MeshFaceMaterial();

	this.geometry.applyMatrix( new THREE.Matrix4().makeRotationX( - Math.PI / 2 ) );
	this.geometry.computeBoundingSphere();
	this.geometry.computeVertexNormals();
	this.geometry.computeFaceNormals();
	this.updateMatrixWorld();
	this.receiveShadow = true;	

	this.collideWithPlayer = true;
	this.collideWithDynamic = true;
}

Struct.Platform.prototype = new THREE.Mesh();

Struct.Platform.prototype.solidMat = new THREE.MeshBasicMaterial( { color: 0xcccccc, wireframe: false} );
Struct.Platform.prototype.wireMat = new THREE.MeshBasicMaterial( { color: 0x222222, wireframe: true} );

define(['app/struct/struct', 'libs/three/three'], function(){return Struct.Platform});
