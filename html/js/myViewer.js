if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var container, stats;

var camera, cameraLookAt, cameraOrbit, cameraOrtho, scene, sceneBG, sceneRTT, renderer, objects;
var composerScene, composer1, composer2, composer3, composer4, processorChain;
var effectFXAA;
var win = window;
var width = win.innerWidth || 2;
var height = win.innerHeight || 2;
var viewportHeight;
var viewportWidth;

var mouse = new THREE.Vector2();
var objects = [], plane;
var projector;
var video, texture;

var halfWidth = width / 2;
var halfHeight = height / 2;

var materialColor, material2D, quadBG, quadMask, renderScene, quadRTT;

var rtParameters;

var delta = 0.01;

var controls;
var pointLight01, pointLight02, pointLight03;
var dae, skin;

var loader = new THREE.ColladaLoader();

var controlerRoll, controlerTilt, controlerYaw;
var currentRoll=0.0, currentTilt=0.0, currentYaw=0.0;
var tiltLimit=false, rollLimit=false;

var weightForce;
var motorForce;

var g = 9.81; 
var weight = 2.0;
var weightForce = new THREE.Vector3(0,-weight*g,0);
var weightForceRep = new THREE.Vector3(0,0,0);
var motorForce = new THREE.Vector3(0,1.0,0);
var motorForceRep = new THREE.Vector3(0,0,0);

var radioRoll=0.0, radioTilt=0.0, radioYaw=0.0; radioThrottle=0.0;
var radioYawTouched = false;
var radioTiltTouched = false;
var isIncreasingTilt = false;
var isDecreasingTilt = false;
var isIncreasingYaw = false;
var isDecreasingYaw = false;

var root;
var targetQuat = new THREE.Quaternion();

var pointLight01, pointLight02, pointLight03;

var joystick;

function launchWebGL()
{
	log("Loading models ..."+width+" "+height);

	height = height * 80.0 / 100.0;
	viewportWidth = width;
	viewportHeight = height + 80.0 / 100.0;

	loader.options.convertUpAxis = true;
	loader.load( './models/collada/quadroXL/QuadXL-noCamera.DAE', function ( collada ) {

		dae = collada.scene;
		skin = collada.skins[ 0 ];

		dae.scale.x = dae.scale.y = dae.scale.z = 10.0;
		dae.updateMatrix();

		init();
		animate();

	} );
}

// TODO: material replace seulement sur DAE et pas sur toute la scene

function processModel(scene)
{
	log("Processing model...");

	var material	= new THREE.MeshPhongMaterial({
	ambient		: 0xffffff,
	color		: 0xffffff,
	shininess	: 10, 
	specular	: 0xffffff,
	shading		: THREE.SmoothShading,
	});				

	var toIntersect = [];
	scene.traverse(function (child) 
	{
		if (child instanceof THREE.Mesh) {
			toIntersect.push(child);
			child.castShadow = true;
			child.receiveShadow = true;
			child.material = material;
			//log(child.name);
			objects.push(child);
			child.useQuaternion = true;
		}
		if( child.name == "Plane001-node" ){
			child.visible = false;
		}
		if( child.name == "digital_single_lens_camera-node") {
			child.castShadow = false;
			child.receiveShadow = false;    					
		}
		if( child.name == "Lens-node") {    					
			child.castShadow = false;
			child.receiveShadow = false;    					
		}
	});

}

function init_pid()
{
	controlerRoll = new PIDController(0.2, 0.01, 1.0);
	controlerTilt = new PIDController(0.2, 0.01, 1.0);
	controlerYaw = new PIDController(0.2, 0.01, 1.0);
	return;
}

function init() {

	log("Init...");
	init_pid();
	container = document.createElement( 'div' );
	var parentDoc = document.getElementById("webgl");
	parentDoc.appendChild( container );

	scene = new THREE.Scene();

	cameraLookAt = new THREE.PerspectiveCamera( 45, viewportWidth / viewportHeight, 1, 2000 );
	cameraLookAt.position.set( 9, 2, -9 );

	cameraOrbit = new THREE.PerspectiveCamera( 45, viewportWidth / viewportHeight, 1, 2000 );
	cameraOrbit.position.set( 7, 2, 7 );

	cameraOrtho = new THREE.OrthographicCamera( -halfWidth, halfWidth, halfHeight, -halfHeight, -10000, 10000 );
	cameraOrtho.position.z = 100;

	var dummy = new THREE.Object3D();
	dummy.name = "ROOT";
	dummy.useQuaternion = true;
	root = dummy;
	scene.add(dummy);

	createLights(scene);
	root.add( dae );
	processModel(scene);

	//weightForceRep = create_line( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, -1, 0 ), 0x000000 );
	//motorForceRep = create_line( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 1, 0 ), 0xffffff );

	createSkyBox(scene, "textures/cube/Park2/", ".jpg", new THREE.Vector3(500.0,550.0,500.0));
	
	projector = new THREE.Projector();

	renderer = new THREE.WebGLRenderer({
		antialias		: false,	// to get smoother output
		preserveDrawingBuffer	: false,	// to allow screenshot
		alpha : true,
		transparency: true,
	});
//	renderer = new THREE.CanvasRenderer();
	renderer.setSize( width, height );
	renderer.setClearColorHex( 0x727272, 1 );
	renderer.autoClear = false;
	container.appendChild( renderer.domElement );

	renderer.shadowMapEnabled = true;
	renderer.shadowMapSoft = true;
	renderer.shadowMapBias = 0.001;
	renderer.gammaInput = true;
	renderer.gammaOutput = true;

	// Ground
	createPlane(scene, new THREE.Vector3(0,-3.0, 0), 
		new THREE.Vector3(-1.57079633,0,0),
		new THREE.Vector3(10000.0,10000.0,10000.0)
	);

	controls = new THREE.OrbitControls( cameraOrbit );
	//controls.addEventListener( 'change', renderer );

	var shaderBleach = THREE.BleachBypassShader;
	var effectBleach = new THREE.ShaderPass( shaderBleach );
	effectBleach.uniforms[ "opacity" ].value = 0.95;

	var shaderSepia = THREE.SepiaShader;
	var effectSepia = new THREE.ShaderPass( shaderSepia );
	effectSepia.uniforms[ "amount" ].value = 0.9;

	var shaderVignette = THREE.VignetteShader;
	var effectVignette = new THREE.ShaderPass( shaderVignette );
	effectVignette.uniforms[ "offset" ].value = 0.95;
	effectVignette.uniforms[ "darkness" ].value = 1.6;

	var shaderCopy = THREE.CopyShader;	
	var effectCopy = new THREE.ShaderPass( shaderCopy );

	var effectBloom = new THREE.BloomPass( 0.2 );
	var effectFilmBW = new THREE.FilmPass( 0.25, 0.3, 1024, false );

	var effectHBlur = new THREE.ShaderPass( THREE.HorizontalBlurShader );
	effectHBlur.uniforms[ 'h' ].value = 0.3 / ( width / 2 );

	var effectVBlur = new THREE.ShaderPass( THREE.VerticalBlurShader );
	effectVBlur.uniforms[ 'v' ].value = 0.3 / ( height / 2 );

	var effectColorify1 = new THREE.ShaderPass( THREE.ColorifyShader );
	effectColorify1.uniforms[ 'color' ].value.setRGB( 1, 0.8, 0.8 );
	var effectColorify2 = new THREE.ShaderPass( THREE.ColorifyShader );
	effectColorify2.uniforms[ 'color' ].value.setRGB( 1, 0.75, 0.5 );

	var clearMask = new THREE.ClearMaskPass();

	var renderMask = new THREE.MaskPass( scene, cameraLookAt );
	var renderMaskInverse = new THREE.MaskPass( scene, cameraLookAt );
	renderMaskInverse.inverse = true;

	rtParameters = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, stencilBuffer: true };

	var rtWidth  = width;
	var rtHeight = height;

	processorChain = new THREE.EffectComposer( renderer, new THREE.WebGLRenderTarget( rtWidth, rtHeight, rtParameters ) );

	sceneRTT = new THREE.Scene();
	var renderBackground = new THREE.RenderPass( sceneBG, cameraOrtho );
	var renderModel = new THREE.RenderPass( scene, cameraLookAt );

	effectFXAA = new THREE.ShaderPass( THREE.FXAAShader );
	effectFXAA.uniforms[ 'resolution' ].value.set( 1 / width, 1 / height );
	effectFXAA.renderToScreen = true;

	brightnessContrast = new THREE.ShaderPass(THREE.BrightnessContrastShader);
	brightnessContrast.uniforms[ 'brightness' ].value = -0.15;
	brightnessContrast.uniforms[ 'contrast' ].value = 0.6;

	hueSaturation = new THREE.ShaderPass(THREE.HueSaturationShader);
	hueSaturation.uniforms[ 'hue' ].value = 0.0;
	hueSaturation.uniforms[ 'saturation' ].value = -0.65;

//	renderModel.clear = false;

//  processorChain.addPass( renderBackground );
	processorChain.addPass( renderModel );
//	processorChain.addPass( effectHBlur );
//	processorChain.addPass( effectVBlur );
	
//	processorChain.addPass( effectBloom );
	processorChain.addPass( effectFilmBW );
//	processorChain.addPass( effectColorify1 );
//	processorChain.addPass( effectColorify2 );
	processorChain.addPass( effectBleach );
//	processorChain.addPass( effectVignette );
	processorChain.addPass(brightnessContrast);
	processorChain.addPass(hueSaturation);
	processorChain.addPass( effectFXAA );		
/*
	var texture = THREE.ImageUtils.loadTexture( "textures/mikrokopter/FlamencoNacelle01.png" );
	texture.minFilter = THREE.LinearFilter;
	texture.magFilter = THREE.LinearFilter;
	texture.format = THREE.RGBFormat;
	texture.generateMipmaps = true;

	createTexturedPlane(scene, new THREE.Vector3(-4,1.5, -3), 
		new THREE.Vector3(0,0.8,0),
		new THREE.Vector3(5.0,4.0,1.0),
		texture
	);

	var texture2 = THREE.ImageUtils.loadTexture( "textures/mikrokopter/FlamencoNacelle02.png" );
	texture.minFilter = THREE.LinearFilter;
	texture.magFilter = THREE.LinearFilter;
	texture.format = THREE.RGBFormat;
	texture.generateMipmaps = true;

	createTexturedPlane(scene, new THREE.Vector3(4,1.5, -3), 
		new THREE.Vector3(0,-0.8,0),
		new THREE.Vector3(5.0,4.0,1.0),
		texture2
	);
*/
/*	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.top = '0px';
	container.appendChild( stats.domElement );
*/
	win.addEventListener( 'resize', onwinResize, false );

	renderer.domElement.addEventListener( 'mousemove', onDocumentMouseMove, false );
	renderer.domElement.addEventListener( 'mousedown', onDocumentMouseDown, false );
	renderer.domElement.addEventListener( 'mouseup', onDocumentMouseUp, false );
	onwinResize();

}

function onwinResize() {
    viewportWidth = win.innerWidth;
    viewportHeight = win.innerHeight;
	cameraLookAt.aspect = viewportWidth / viewportHeight;
	cameraLookAt.updateProjectionMatrix();

	cameraOrtho.left = -halfWidth;
	cameraOrtho.right = halfWidth;
	cameraOrtho.top = halfHeight;
	cameraOrtho.bottom = -halfHeight;

	cameraOrtho.updateProjectionMatrix();

	renderer.setSize( viewportWidth, viewportHeight );
	processorChain.reset( new THREE.WebGLRenderTarget( viewportWidth, viewportHeight, rtParameters ) );
	effectFXAA.uniforms[ 'resolution' ].value.set( 1 /  viewportWidth, 1 /  viewportHeight );

}


var t = 0;
var clock = new THREE.Clock();

function animate() {

	var delta = clock.getDelta();
	requestAnimationFrame( animate );
	if ( t > 1 ) t = 0;

	controls.update();
	render();
//	stats.update();
}

function radioControl_init()
{

}

function radioControl_update()
{

}
var counter = 0;
function render() {

	var timer = Date.now() * 0.0005;
	{
		var perSecond = 1; // clock.getDelta() * 50000.0;

		var noise = (Math.cos( clock.elapsedTime*2.0) * 0.1 * Math.random() * $( "#ui-sliderNoise" ).slider("option", "value")) * perSecond;
		var wind = ($( "#ui-sliderWind" ).slider("option", "value")) * perSecond;

		var angleLimit = 1.6;

		//////////// ROTATION ///////////////
		// Tilt
		var targetTilt = $( "#ui-sliderRoll" ).slider("option", "value");
		controlerTilt.Execute(currentTilt, radioTilt, clock.getDelta());
		var rotationAngleTilt = controlerTilt.outputCommand * 0.0007 + noise ;
/*		if( ((currentTilt + rotationAngleTilt) > angleLimit) || ((currentTilt + rotationAngleTilt) < -angleLimit) )
		{
			rotationAngleTilt = 0.0;
			tiltLimit = true;
		}
		else 
			tiltLimit = false;
*/
		var root_axisX = new THREE.Vector3( 1, 0, 0);
		var quaternionX = new THREE.Quaternion();
		quaternionX.setFromAxisAngle( root_axisX, rotationAngleTilt );
		root.quaternion.multiply(quaternionX);
		currentTilt += rotationAngleTilt;

		// Yaw
		controlerYaw.Execute(currentYaw, radioYaw, clock.getDelta());
		var rotationAngleYaw = controlerYaw.outputCommand * 0.0007 + noise;
	
		var root_axisY = new THREE.Vector3( 0, 1, 0);
		var quaternionY = new THREE.Quaternion();
		quaternionY.setFromAxisAngle( root_axisY, rotationAngleYaw );
		root.quaternion.multiply(quaternionY);
		currentYaw += rotationAngleYaw;

		// Roll
		var targetRoll = $( "#ui-sliderRoll" ).slider("option", "value");
		controlerRoll.Execute(currentRoll, targetRoll, clock.getDelta());
		var rotationAngleRoll = (controlerRoll.outputCommand * 0.0007) + wind + noise + (joystick.deltaX() / 500.0)*perSecond;
/*		if( ((currentRoll + rotationAngleRoll) > angleLimit) || ((currentRoll + rotationAngleTilt) < -angleLimit))
		{
			rotationAngleRoll = 0.0;
			rollLimit = true;
		}
		else
			rollLimit = false;
*/		
		var root_axisZ = new THREE.Vector3( 0, 0, 1);
		var quaternionZ = new THREE.Quaternion();
		quaternionZ.setFromAxisAngle( root_axisZ, rotationAngleRoll );
		root.quaternion.multiply(quaternionZ);
		currentRoll += rotationAngleRoll;

		/////////////// Position ////////////
		var currentPosition = root.position.clone();
		var newPosition;

		var speed = $( "#ui-sliderSpeed" ).slider("option", "value");
		var allForces = new THREE.Vector3( 0, 0, 0 );

		// Weight
		var weightForceDiff = weightForce.clone();
		weightForceDiff.multiplyScalar( 0.02 );
		allForces.add( weightForceDiff );

		// MotorForce
		motorForce = root_axisY.clone(); 
		motorForce.applyQuaternion(root.quaternion);
		radioThrottle = -joystick.deltaY() * 0.005;

		if( radioThrottle < 0.0 )
				radioThrottle = 0.0;

		allForces.add( motorForce.multiplyScalar( radioThrottle ));

		// Update pos
		newPosition = currentPosition.clone();
		newPosition.add(allForces);

		if( newPosition.y < -1.0)
			newPosition.y = -1.0;
		
		root.position = newPosition;

		cameraLookAt.lookAt(newPosition);
		pointLight01.position = newPosition.clone().add(new THREE.Vector3(-6,6,-2));
		pointLight02.position = newPosition.clone().add(new THREE.Vector3(6,1,-2));
		pointLight03.position = newPosition.clone().add(new THREE.Vector3(0,2,6));
		pointLight01.target.position = newPosition.clone();
		pointLight02.target.position = newPosition.clone();
		pointLight03.target.position = newPosition.clone();

		// Visual rep of forces
	//			update_line(weightForceRep, new THREE.Vector3( newPosition.x, newPosition.y, newPosition.z ), weightForce);
	//			update_line(motorForceRep, new THREE.Vector3( newPosition.x, newPosition.y, newPosition.z ), motorForce);

		//renderer.render(scene, camera);
	}

	renderer.clear();
	processorChain.render(delta);
}

function createFlare(scene, position, color)
{
	log("Creating new flare...");

	// lens flares
	var textureFlare0 = THREE.ImageUtils.loadTexture( "textures/lensflare/lensflare0.png" );
	var textureFlare2 = THREE.ImageUtils.loadTexture( "textures/lensflare/lensflare2.png" );
	var textureFlare3 = THREE.ImageUtils.loadTexture( "textures/lensflare/lensflare3.png" );

	var flareColor = new THREE.Color( color );
	THREE.ColorUtils.adjustHSV( flareColor, 0, -0.5, 0.5 );

	var lensFlare = new THREE.LensFlare( textureFlare0, 700, 0.0, THREE.AdditiveBlending, flareColor );

	lensFlare.add( textureFlare2, 512, 0.0, THREE.AdditiveBlending );
	lensFlare.add( textureFlare2, 512, 0.0, THREE.AdditiveBlending );
	lensFlare.add( textureFlare2, 512, 0.0, THREE.AdditiveBlending );

	lensFlare.add( textureFlare3, 60, 0.6, THREE.AdditiveBlending );
	lensFlare.add( textureFlare3, 70, 0.7, THREE.AdditiveBlending );
	lensFlare.add( textureFlare3, 120, 0.9, THREE.AdditiveBlending );
	lensFlare.add( textureFlare3, 70, 1.0, THREE.AdditiveBlending );

	lensFlare.customUpdateCallback = lensFlareUpdateCallback;
	lensFlare.position = position;

	scene.add( lensFlare );
}

 function lensFlareUpdateCallback( object ) {

	var f, fl = object.lensFlares.length;
	var flare;
	var vecX = -object.positionScreen.x * 2;
	var vecY = -object.positionScreen.y * 2;


	for( f = 0; f < fl; f++ ) {

		   flare = object.lensFlares[ f ];

		   flare.x = object.positionScreen.x + vecX * flare.distance;
		   flare.y = object.positionScreen.y + vecY * flare.distance;

		   flare.rotation = 0;

	}

	object.lensFlares[ 2 ].y += 0.025;
	object.lensFlares[ 3 ].rotation = object.positionScreen.x * 0.5 + 45 * Math.PI / 180;

}

function createLights(scene)
{
	log("Creating lights...");

	var shadowMapResolution = 256;
	var fov = 70;
	// Lights
	// orange
	var color1 = new THREE.Color(0xca5825);
	pointLight01 = new THREE.SpotLight(color1.getHex(), 0.8);
	var pos1 = new THREE.Vector3(-5.0, 5.0, -2.0);
	pointLight01.position.set(pos1.x, pos1.y, pos1.z);
	pointLight01.target.position.set(0,0,0);
	pointLight01.shadowCameraNear = 1.0;
	pointLight01.shadowCameraFar = 500.0;
	pointLight01.castShadow = true;
	pointLight01.shadowDarkness = 0.2;
	pointLight01.shadowCameraVisible = false;
	pointLight01.shadowMapWidth = shadowMapResolution;
	pointLight01.shadowMapHeight = shadowMapResolution;
	pointLight01.shadowCameraFov = fov;
	scene.add(pointLight01);
	pointLight01Mesh = new THREE.Mesh( new THREE.SphereGeometry( 0.1, 8, 8 ), new THREE.MeshBasicMaterial( { color: color1 } ) );
	pointLight01Mesh.position.set(pos1.x, pos1.y, pos1.z);
//	scene.add( pointLight01Mesh );

	// blue
	var color2 = new THREE.Color(0x9cb3c8);
	pointLight02 = new THREE.SpotLight(color2.getHex(), 1.0);
	var pos2 = new THREE.Vector3(5.0,1.0,-2.0);
	pointLight02.position.set(pos2.x, pos2.y, pos2.z);
	pointLight02.target.position.set(0,0,0);
	pointLight02.shadowCameraNear = 1.0;
	pointLight02.shadowCameraFar = 500.0;
	pointLight02.castShadow = false;
	pointLight02.shadowDarkness = 0.3;
	pointLight02.shadowCameraVisible = false;
	pointLight02.shadowCameraFov = fov;

	pointLight02.shadowMapWidth = shadowMapResolution;
	pointLight02.shadowMapHeight = shadowMapResolution;
	scene.add(pointLight02);
	pointLight02Mesh = new THREE.Mesh( new THREE.SphereGeometry( 0.1, 8, 8 ), new THREE.MeshBasicMaterial( { color: color2 } ) );
	pointLight02Mesh.position.set(pos2.x, pos2.y, pos2.z);
//	scene.add( pointLight02Mesh );

	// white
	var color3 = new THREE.Color(0xadabab);
	pointLight03 = new THREE.SpotLight(color3.getHex(), 0.7);
	var pos3 = new THREE.Vector3(0.0,2.0,5.0);
	pointLight03.position.set(pos3.x, pos3.y, pos3.z);
	pointLight03.target.position.set(0,0,0);
	pointLight03.shadowCameraNear = 1.0;
	pointLight03.shadowCameraFar = 500.0;
	pointLight03.castShadow = true;
	pointLight03.shadowDarkness = 0.2;
	pointLight03.shadowCameraVisible = false;
	pointLight03.shadowCameraFov = fov;

	pointLight03.shadowMapWidth = shadowMapResolution;
	pointLight03.shadowMapHeight = shadowMapResolution;
	scene.add(pointLight03);
	pointLight03Mesh = new THREE.Mesh( new THREE.SphereGeometry( 0.1, 8, 8 ), new THREE.MeshBasicMaterial( { color: color3 } ) );
	pointLight03Mesh.position.set(pos3.x, pos3.y, pos3.z);
//	scene.add( pointLight03Mesh );

//	createFlare(scene, pointLight01.position, pointLight01.color);
//	createFlare(scene, pointLight02.position, pointLight02.color);
//	createFlare(scene, pointLight03.position, pointLight03.color);

	scene.add( new THREE.AmbientLight( 0x727272 ) );
}

function log(msg) {
    setTimeout(function() {
	throw new Error(msg);
	}, 0);
}

function change_uvs( geometry, unitx, unity, offsetx, offsety ) {

	var i, j, uv;

	for ( i = 0; i < geometry.faceVertexUvs[ 0 ].length; i++ ) {

		uv = geometry.faceVertexUvs[ 0 ][ i ];

		for ( j = 0; j < uv.length; j++ ) {

			uv[j].u = ( uv[j].u + offsetx ) * unitx;
			uv[j].v = ( uv[j].v + offsety ) * unity;

		}

	}

}

function createTexturedPlane(scene, position, rotation, scale, texture)
{	
	log("Creating new textured plane ...");

	var material	= new THREE.MeshPhongMaterial({
	ambient		: 0xffffff,
	color		: 0xffffff,
	emissive 	: 0xffffff,
	shininess	: 10, 
	specular	: 0xffffff,
	shading		: THREE.SmoothShading,
	map 		: texture
	});		

	var geometry = new THREE.CubeGeometry(1, 1, 0.001, 1, 1, 1);
	var mesh = new THREE.Mesh( geometry, material );
	mesh.rotation = rotation;
	mesh.position = position;
	mesh.scale = scale;
	scene.add(mesh);
	
	mesh.castShadow = true;
	mesh.receiveShadow = false;
	mesh.name = "newTexturedPlaneMesh";

}

function createPlane(scene, position, rotation, scale)
{	
	log("Creating new plane ...");

	var materialPlane	= new THREE.MeshPhongMaterial({
	ambient		: 0xffffff,
	color		: 0xffffff,
	shininess	: 10, 
	specular	: 0xffffff,
	shading		: THREE.SmoothShading,
	transparent     : true,
	opacity          : 0.65,
	});		

	var geometry = new THREE.PlaneGeometry(1, 1);
	var mesh = new THREE.Mesh( geometry, materialPlane );
	mesh.rotation = rotation;
	mesh.position = position;
	mesh.scale = scale;
	scene.add(mesh);
	
	mesh.castShadow = true;
	mesh.receiveShadow = true;
	mesh.name = "newPlaneMesh";

}

function createSkyBox(scene, path, format, position)
{
	log("Creating new skyBox");
	var urls = [
		path + 'px' + format, path + 'nx' + format,
		path + 'py' + format, path + 'ny' + format,
		path + 'pz' + format, path + 'nz' + format
	];

	var textureCube = THREE.ImageUtils.loadTextureCube( urls, new THREE.CubeRefractionMapping() );

	var shader = THREE.ShaderLib[ "cube" ];
	shader.uniforms[ "tCube" ].value = textureCube;

	var material = new THREE.ShaderMaterial( {

		fragmentShader: shader.fragmentShader,
		vertexShader: shader.vertexShader,
		uniforms: shader.uniforms,
		depthWrite: false,
		side: THREE.BackSide

	} );

	mesh = new THREE.Mesh( new THREE.CubeGeometry( position.x, position.y, position.z), material );
	//mesh.receiveShadow = true;
	scene.add( mesh );

}

function create_line( startVertex, endVertex, iColor )
{
	var geom = new THREE.Geometry();
	geom.dynamic = true;
	geom.vertices = [
	    startVertex,
	    endVertex
	];
	var color
	var line = new THREE.Line(geom, new THREE.LineBasicMaterial({ color : iColor, linewidth:3} ));
	scene.add(line);

	return geom;
}

function update_line(line, startVertex, endVertex)
{
	line.vertices[0] = startVertex.clone();
	line.vertices[1] = endVertex.clone();
	line.verticesNeedUpdate = true;
}


function onDocumentMouseMove( event ) {

	event.preventDefault();

	mouse.x = ( event.clientX / win.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / win.innerHeight ) * 2 + 1;

}

function onDocumentMouseDown( event ) {

	event.preventDefault();

	var vector = new THREE.Vector3( mouse.x, mouse.y, 0.5 );
	projector.unprojectVector( vector, cameraLookAt );

	var ray = new THREE.Ray( cameraLookAt.position, vector.subSelf( cameraLookAt.position ).normalize() );

	var intersects = ray.intersectObjects( objects );

	if ( intersects.length > 0 ) {
		SELECTED = intersects[ 0 ].object;
		log("Object picked: "+SELECTED.name);
	}

}

function onDocumentMouseUp( event ) {
}

function increaseTilt() {
	radioTilt += 0.08; 
	radioTiltTouched = true;
	isIncreasingTilt = true;
}

function decreaseTilt() {

	radioTilt += -0.08; 
	radioTiltTouched = true;
	isDecreasingTilt = true;
}

function increaseYaw() {

	radioYaw += 0.08; 
	radioYawTouched = true;
	isIncreasingYaw = true;
}

function decreaseYaw() {

	radioYaw += -0.08; 
	radioYawTouched = true;
	isDecreasingYaw = true;
}

