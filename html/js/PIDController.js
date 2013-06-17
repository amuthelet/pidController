function PIDController(Kp, Ki, Kd)
{
	this.error = 0.0;
	this.previousError = 0.0;
	this.integral = 0.0;
	this.derivative = 0.0;
	this.Kp = Kp;
	this.Ki = Ki;
	this.Kd = Kd;
	
	this.outputCommand = 1.0; 

	return;
}

PIDController.prototype.Execute = function(currentValue, targetValue, dt)
{
	if( dt == 0.0 )
		return;

	this.Kp = parseFloat($("#ui-txtP").html());
	this.Ki = parseFloat($("#ui-txtI").html());
	this.Kd = parseFloat($("#ui-txtD").html());

	this.error = targetValue - currentValue;
	this.integral = this.integral + this.error*dt;
	this.derivative = (this.error - this.previousError) / dt;
	this.outputCommand = this.Kp * this.error + this.Ki * this.integral + this.Kd * this.derivative;
	this.previousError = this.error;

	return;
}

function PIDVectorController(Kp, Ki, Kd)
{
	this.error = new THREE.Vector3();
	this.previousError = new THREE.Vector3();
	this.integral = new THREE.Vector3();
	this.derivative = new THREE.Vector3();
	this.Kp = Kp;
	this.Ki = Ki;
	this.Kd = Kd;
	
	this.outputCommand = new THREE.Vector3(); 

	return;
}

PIDVectorController.prototype.Execute = function(currentVector, targetVector, dt)
{
	if( dt == 0.0 )
		return;

	this.Kp = parseFloat($("#ui-txtP").html());
	this.Ki = parseFloat($("#ui-txtI").html());
	this.Kd = parseFloat($("#ui-txtD").html());

	this.error.subVectors( currentVector, targetVector );
	this.integral.addVectors( this.integral, this.error.clone().multiplyScalar(dt));
	this.derivative.subVectors(this.error, this.previousError);
	this.derivative.divideScalar( dt );

	this.outputCommand.addVectors(this.error.clone().multiplyScalar( this.Kp ), this.integral.clone().multiplyScalar( this.Ki ));
	this.outputCommand.add( this.derivative.clone().multiplyScalar( this.Kd ) );

	this.previousError = this.error.clone();

	return;
}

