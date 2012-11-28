Struct.Platform = function () {
	THREE.Mesh.call(this);

	this.geometry = new THREE.CubeGeometry( 100, 100, 50000);
	this.material =  new THREE.MeshBasicMaterial( { color: 0xcccccc, wireframe: false} );

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