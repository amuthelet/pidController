// Extending three.js quat implementation with getDir

THREE.Quaternion.prototype.getDirection = function(oDir, oUp, oRight) {

	var s = 2.0;
	var xs = this.x * s  ,  ys = this.y * s , zs = this.z * s;
	var wy = this.w * ys;
	var xz = this.x * zs;
	var xx = this.x * xs;  
	var yy = this.y * ys;  
	var yz = this.y * zs;
	var wx = this.w * xs;    
	var xy = this.x * ys; 
	var wz = this.w * zs;
	var zz = this.z * zs;

	oDir.x = xz + wy;
	oDir.y = yz - wx;
	oDir.z = 1.0 - (xx + yy);

	oRight.x = 1.0 - (yy + zz);
	oRight.y = xy + wz;
	oRight.z = xz - wy;

	oUp.x = xy - wz;
	oUp.y = 1.0 - (xx + zz);
	oUp.z = yz + wx;

	return this;
}


THREE.Quaternion.prototype.setFromDirection = function(iDir, iUp, iRight) {

	var m = new THREE.Matrix4();
	m.makeRotationFromDirection(iDir, iUp, iRight);
	this.setFromRotationMatrix( m );

	return this;
}