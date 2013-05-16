function PIDController(Kp, Ki, Kd)
{
	this.error = 0.0;
	this.currentValue = 0.0;
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

