/**
 * @author mrdoob / http://mrdoob.com/
 * @author marklundin / http://mark-lundin.com/
 * @author alteredq / http://alteredqualia.com/
 * @edited by Thomas Grelecki, Derek Ison, Richard Hendley, Ger Her
 */

NUMIDIUM.AnaglyphEffect = function ( renderer, width, height ) {

	var eyeRight = new THREE.Matrix4();
	var eyeLeft = new THREE.Matrix4();
	var focalLength = 125;
	var _aspect, _near, _far, _fov;

	var _cameraL = new THREE.PerspectiveCamera();
	_cameraL.matrixAutoUpdate = false;

	var _cameraR = new THREE.PerspectiveCamera();
	_cameraR.matrixAutoUpdate = false;

	var _camera = new THREE.OrthographicCamera( -1, 1, 1, - 1, 0, 1 );

	var _scene = new THREE.Scene();

	var _params = { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat };

	if ( width === undefined ) width = 512;
	if ( height === undefined ) height = 512;

	var _renderTargetL = new THREE.WebGLRenderTarget( width, height, _params );
	var _renderTargetR = new THREE.WebGLRenderTarget( width, height, _params );
	var _material = new THREE.ShaderMaterial( {

		uniforms: {

			"mapLeft": { type: "t", value: _renderTargetL },
			"mapRight": { type: "t", value: _renderTargetR }

		},

		vertexShader: [

			"varying vec2 vUv;",

			"void main() {",

			"	vUv = vec2( uv.x, uv.y );",
			"	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

			"}"

		].join("\n"),

		fragmentShader: [

			"uniform sampler2D mapLeft;",
			"uniform sampler2D mapRight;",
			"varying vec2 vUv;",

			"void main() {",

			"	vec4 colorL, colorR;",
			"	vec2 uv = vUv;",

			"	colorL = texture2D( mapLeft, uv );",
			"	colorR = texture2D( mapRight, uv );",

				// http://3dtv.at/Knowhow/AnaglyphComparison_en.aspx

			"	gl_FragColor = vec4( colorL.g * 0.7 + colorL.b * 0.3, colorR.g, colorR.b, colorL.a + colorR.a ) * 1.1;",

			"}"

		].join("\n")

	} );
	
	//SSAO effect
	var _depthTargetL = new THREE.WebGLRenderTarget( width, height, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat } );
	var _depthTargetR = new THREE.WebGLRenderTarget( width, height, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat } );
	
	var _ssaoL = new THREE.ShaderPass( THREE.SSAOShader );
	_ssaoL.uniforms[ 'tDepth' ].value = _depthTargetL;
	_ssaoL.uniforms[ 'size' ].value.set( width, height );
	_ssaoL.uniforms[ 'cameraNear' ].value = camera.near;
	_ssaoL.uniforms[ 'cameraFar' ].value = camera.far;
	_ssaoL.uniforms[ 'aoClamp' ].value = 0.5;
	_ssaoL.renderToScreen = false;
	
	var _ssaoR = new THREE.ShaderPass( THREE.SSAOShader );
	_ssaoR.uniforms[ 'tDepth' ].value = _depthTargetR;
	_ssaoR.uniforms[ 'size' ].value.set( width, height );
	_ssaoR.uniforms[ 'cameraNear' ].value = camera.near;
	_ssaoR.uniforms[ 'cameraFar' ].value = camera.far;
	_ssaoR.uniforms[ 'aoClamp' ].value = 0.5;
	_ssaoR.renderToScreen = true;
	
	var _anaglyphPass = new THREE.ShaderPass( _material );
	_anaglyphPass.renderToScreen = true;

	var _eC = new THREE.EffectComposer( renderer );
	_eC.addPass( new THREE.RenderPass( _scene, _camera ) );
	_eC.addPass( _ssaoL );
	_eC.addPass( _ssaoR );
	//_eC.addPass( _anaglyphPass );

	var mesh = new THREE.Mesh( new THREE.PlaneGeometry( 2, 2 ), _material );
	_scene.add( mesh );

	this.setSize = function ( width, height ) {

		if ( _renderTargetL ) _renderTargetL.dispose();
		if ( _renderTargetR ) _renderTargetR.dispose();
		if ( _depthTargetL ) _depthTargetL.dispose();
		if ( _depthTargetR ) _depthTargetR.dispose();
		
		_renderTargetL = new THREE.WebGLRenderTarget( width, height, _params );
		_renderTargetR = new THREE.WebGLRenderTarget( width, height, _params );
		_depthTargetL = new THREE.WebGLRenderTarget( width, height, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat } );
		_depthTargetR = new THREE.WebGLRenderTarget( width, height, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat } );

		_material.uniforms[ "mapLeft" ].value = _renderTargetL;
		_material.uniforms[ "mapRight" ].value = _renderTargetR;
		_ssaoL.uniforms[ 'tDepth' ].value = _depthTargetL;
		_ssaoR.uniforms[ 'tDepth' ].value = _depthTargetR;

		renderer.setSize( width, height );

	};

	/*
	 * Renderer now uses an asymmetric perspective projection
	 * (http://paulbourke.net/miscellaneous/stereographics/stereorender/).
	 *
	 * Each camera is offset by the eye seperation and its projection matrix is
	 * also skewed asymetrically back to converge on the same projection plane.
	 * Added a focal length parameter to, this is where the parallax is equal to 0.
	 */

	this.render = function ( scene, camera ) {
		var isShadowMappingEnabled = renderer.shadowMapAutoUpdate;
		renderer.shadowMapAutoUpdate = false;//disable updating shadow maps while in anaglyph rendering

		scene.updateMatrixWorld();

		if ( camera.parent === undefined ) camera.updateMatrixWorld();

		var hasCameraChanged = ( _aspect !== camera.aspect ) || ( _near !== camera.near ) || ( _far !== camera.far ) || ( _fov !== camera.fov );

		if ( hasCameraChanged ) {

			_aspect = camera.aspect;
			_near = camera.near;
			_far = camera.far;
			_fov = camera.fov;

			var projectionMatrix = camera.projectionMatrix.clone();
			var eyeSep = focalLength / 30 * 0.5;
			var eyeSepOnProjection = eyeSep * _near / focalLength;
			var ymax = _near * Math.tan( THREE.Math.degToRad( _fov * 0.5 ) );
			var xmin, xmax;

			// translate xOffset

			eyeRight.elements[12] = eyeSep;
			eyeLeft.elements[12] = -eyeSep;

			// for left eye

			xmin = -ymax * _aspect + eyeSepOnProjection;
			xmax = ymax * _aspect + eyeSepOnProjection;

			projectionMatrix.elements[0] = 2 * _near / ( xmax - xmin );
			projectionMatrix.elements[8] = ( xmax + xmin ) / ( xmax - xmin );

			_cameraL.projectionMatrix.copy( projectionMatrix );

			// for right eye

			xmin = -ymax * _aspect - eyeSepOnProjection;
			xmax = ymax * _aspect - eyeSepOnProjection;

			projectionMatrix.elements[0] = 2 * _near / ( xmax - xmin );
			projectionMatrix.elements[8] = ( xmax + xmin ) / ( xmax - xmin );

			_cameraR.projectionMatrix.copy( projectionMatrix );

		}
		
		if ( isShadowMappingEnabled ) {
			renderer.shadowMapPlugin.update( scene, camera );//update only with 'real' camera values; autoupdate disabled while in anaglyph
		}
		
		_cameraL.matrixWorld.copy( camera.matrixWorld ).multiply( eyeLeft );
		_cameraL.position.copy( camera.position );
		_cameraL.near = camera.near;
		_cameraL.far = camera.far;

		//
		if( aoSupported && aoEnabled ) {
			scene.overrideMaterial = depthMaterial;
			renderer.render( scene, _cameraL, _depthTargetL, true );
			scene.overrideMaterial = null;
		}
		
		renderer.render( scene, _cameraL, _renderTargetL, true );

		_cameraR.matrixWorld.copy( camera.matrixWorld ).multiply( eyeRight );
		_cameraR.position.copy( camera.position );
		_cameraR.near = camera.near;
		_cameraR.far = camera.far;

		//
		if( aoSupported && aoEnabled ) {
			scene.overrideMaterial = depthMaterial;
			renderer.render( scene, _cameraR, _depthTargetR, true );
			scene.overrideMaterial = null;
		}
		
		renderer.render( scene, _cameraR, _renderTargetR, true );

		if( aoSupported && aoEnabled ) {
			_eC.render();
		}
		else {
			renderer.render( _scene, _camera );
		}
		renderer.shadowMapAutoUpdate = isShadowMappingEnabled;//restore original setting for renderer shadow mapping
	};

	this.dispose = function() {
		if ( _renderTargetL ) _renderTargetL.dispose();
		if ( _renderTargetR ) _renderTargetR.dispose();
		if ( _depthTargetL ) _depthTargetL.dispose();
		if ( _depthTargetR ) _depthTargetR.dispose();
	}

};
