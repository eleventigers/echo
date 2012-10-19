Tree = function (side, position) {

	THREE.Mesh.call( this );	

	this.geometry = new THREE.CubeGeometry(side, side, side);
	var color = '0x'+Math.floor(Math.random()*16777215).toString(16);
	this.material = new THREE.MeshBasicMaterial({color: color});

	this.castShadow = true;
	this.receiveShadow  = false;
	this.geometry.computeBoundingSphere();
	this.geometry.dynamic = true;
	this.geometry.__dirtyVertices = true;
	this.geometry.__dirtyNormals = true;

	this.position.set( position.x, position.y, position.z);
	this.rotation.y = Math.PI/2;

	this.prevMesh = new THREE.Mesh(this.geometry);

}

Tree.prototype = new THREE.Mesh();
Tree.prototype.constructor = Tree;

Tree.prototype.grow = function(){

		var oldBSP = new ThreeBSP(this);

		var addMesh = new THREE.Mesh(this.prevMesh.geometry);
		addMesh.scale.x -= 0.1;
		addMesh.position = this.prevMesh.position.clone();
		addMesh.position.addSelf({x:5, y:5, z:5});
		this.prevMesh = addMesh;

		var addBSP = new ThreeBSP( addMesh );

		var newBSP = oldBSP.union( addBSP );
		var newGeom = newBSP.toGeometry();

	    newGeom.computeBoundingSphere();

	    this.geometry = newGeom;


	    console.log(addMesh);
		
} 
