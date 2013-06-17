THREE.Matrix4.prototype.makeRotationFromDirection = function(iDir, iUp, iRight) {

	this.set( iRight.x, iRight.y, iRight.z, 0,
		iUp.x, iUp.y, iUp.z, 0,
		iDir.x, iDir.y, iDir.z, 0,
		0,0,0,1);

	return this;
}