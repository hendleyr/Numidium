var NUMIDIUM = {};
var clock = new THREE.Clock();
var time = Date.now();

NUMIDIUM.ViewController = function () {
	if ( window.innerWidth === 0 ) { window.innerWidth = parent.innerWidth; window.innerHeight = parent.innerHeight; }
	this.sceneGraph = new THREE.Octree( {
		// uncomment below to see the octree (may kill the fps)
		// scene: scene,
		// when undeferred = true, objects are inserted immediately
		// instead of being deferred until next octree.update() call
		// this may decrease performance as it forces a matrix update
		undeferred: true,
		// set the max depth of tree
		depthMax: Infinity,
		// max number of objects before nodes split or merge
		objectsThreshold: 128,
		// percent between 0 and 1 that nodes will overlap each other
		// helps insert objects that lie over more than one node
		overlapPct: 0.25
	} );

	var camera, viewAngle, aspectRatio, nearClip, farClip;
	var renderer, anaglyphRenderer, oculusRenderer, effectComposer, colorRenderTarget;
	var directionalLight = new THREE.DirectionalLight( 0xfefdbc, 0.5 );
	var kbamControls, oculusControls, gamepadControls;
	var	isAnaglyph = false, isOculus = false;
	this.directionalLight = function () { return directionalLight; }
	
	var depthPassPlugin, depthRenderTarget, ssaoEffectPass;
	var depthMaterial;
	
	init = function () {
		viewAngle = 45;
		aspectRatio = window.innerWidth / window.innerHeight;
		nearClip = 2;//test
		farClip = 200;//test
		camera = new THREE.PerspectiveCamera(viewAngle, aspectRatio, nearClip, farClip);
		scene.add( camera );
		
		// if ( Detector.webgl ) {
			renderer = new THREE.WebGLRenderer();
		// }
		// else {
			// renderer = new THREE.CanvasRenderer();
		// }
		
		// RENDER TARGETS		
		depthRenderTarget = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat } );
		colorRenderTarget = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat } );
		
		// RENDERER
		renderer.setSize( window.innerWidth, window.innerHeight );
		var depthShader = THREE.ShaderLib[ "depthRGBA" ];
		var depthUniforms = THREE.UniformsUtils.clone( depthShader.uniforms );

		depthMaterial = new THREE.ShaderMaterial( { fragmentShader: depthShader.fragmentShader, vertexShader: depthShader.vertexShader, uniforms: depthUniforms } );
		depthMaterial.blending = THREE.NoBlending;
		//effectComposer = new THREE.EffectComposer( renderer, colorRenderTarget );
		effectComposer = new THREE.EffectComposer( renderer );
		effectComposer.addPass( new THREE.RenderPass( scene, camera ) );

		ssaoEffectPass = new THREE.ShaderPass( THREE.SSAOShader );

		ssaoEffectPass.uniforms[ 'tDepth' ].texture = depthRenderTarget;
		ssaoEffectPass.uniforms[ 'size' ].value.set( window.innerWidth, window.innerHeight );
		ssaoEffectPass.uniforms[ 'cameraNear' ].value = camera.near;
		ssaoEffectPass.uniforms[ 'cameraFar' ].value = camera.far;
		ssaoEffectPass.uniforms[ 'aoClamp' ].value = 0.0;
		// ssaoEffectPass.uniforms[ 'lumInfluence' ].value = 0.0;
		ssaoEffectPass.renderToScreen = true;
		ssaoEffectPass.uniforms[ 'onlyAO' ].value = 1;//testing
		
		effectComposer.addPass( ssaoEffectPass );

		oculusRenderer = new THREE.NumidiumOculusRiftEffect( renderer, camera, { worldFactor: 1 } );
		anaglyphRenderer = new THREE.AnaglyphEffect( renderer, window.innerWidth, window.innerHeight );

		// LIGHTS
		directionalLight.position.set( -1500, 1100, 1200 );
		directionalLight.shadowDarkness = 0.5;
		scene.add( directionalLight );
		
		// VIEW CONTROLS
		document.addEventListener( 'keydown', onKeyDown, false );
		window.addEventListener( 'resize', onWindowResize, false );
		
		// CONTROLS
		oculusControls = new THREE.NumidiumOculusControls( camera );
		kbamControls = new NUMIDIUM.NumidiumControls( camera );
		kbamControls.sceneGraph = this.sceneGraph;
		kbamControls.getObject().position.set( 591.2682999279975, -150.51886730958248, -524.7649342454138 );
		scene.add( kbamControls.getObject() );
		pointerLockAttach();
	};
	
	this.getKbamControls = function () {
		return kbamControls;
	};
	this.getOculusControls = function () {
		return oculusControls;
	}		
	this.getCamera = function () {
		return camera;
	};	
	this.getRenderer = function () {
		if (isAnaglyph) {
			return anaglyphRenderer;
		}
		else if (isOculus) {
			return oculusRenderer;
		}
		else {
			return renderer;
		}
	};
	
	this.viewToggleAnaglyph = function() {
		viewToggleAnaglyph();
	}
	
	function viewToggleAnaglyph() {
		isAnaglyph = true;
		isOculus = false;
		oculusControls.freeze = true;
        onWindowResize();
	}
	
	this.viewToggleNormal = function() {
		viewToggleNormal();
	}
	
	function viewToggleNormal() {
		isAnaglyph = false;
		isOculus = false;
		oculusControls.freeze = true;
        onWindowResize();
	}

	this.viewToggleOculus = function() {
		viewToggleOculus();
	}
	
	function viewToggleOculus() {
		isAnaglyph = false;
		isOculus = true;
		oculusControls.connect();	// send a GET to http://localhost:50000/
		oculusControls.freeze = false;
        onWindowResize();
	}
	
	this.render = function () {
		if ( isAnaglyph ) {
			anaglyphRenderer.render( scene, camera );
		}
		else if (isOculus) {
			oculusRenderer.render( scene, camera );
		}
		else {
			scene.overrideMaterial = depthMaterial;
			renderer.render( scene, camera, depthRenderTarget );
			// scene.overrideMaterial = null;
			effectComposer.render();			
		}
	};
	
	this.update = function () {
		this.sceneGraph.update();
		
		oculusControls.update( clock.getDelta(), kbamControls.getGamepadRotate() );
		kbamControls.update( Date.now() - time ); //TODO: tweak values so clock delta can be used instead
	};
	
	onWindowResize = function () {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();

		renderer.setSize( window.innerWidth, window.innerHeight );
		anaglyphRenderer.setSize( window.innerWidth, window.innerHeight );
		oculusRenderer.setSize( window.innerWidth, window.innerHeight );
		
		depthRenderTarget = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat } );
		colorRenderTarget = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat } );

		effectComposer.reset( colorRenderTarget );

		ssaoEffectPass.uniforms[ 'size' ].value.set( window.innerWidth, window.innerHeight );
		ssaoEffectPass.uniforms[ 'tDepth' ].texture = depthRenderTarget;
		
	};
	
	onKeyDown = function ( event ) {
		console.log(event.keyCode);
		switch (event.keyCode) {
			case 49:	//1
				// ssaoEffectPass.enabled = !ssaoEffectPass.enabled;	//TODO: on/off switch for SSAO
				break;
			case 73:	//i
				viewToggleAnaglyph();
				break;
			case 79:	//o
				viewToggleOculus();
				break;
			case 80:	//p
				viewToggleNormal();
				break;
		}
	};
	
	var pointerLockAttach = function () {
		var blocker = document.getElementById( 'blocker' );
		var instructions = document.getElementById( 'instructions' );

		// http://www.html5rocks.com/en/tutorials/pointerlock/intro/

		var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;

		if ( havePointerLock ) {
			var element = document.body;

			var pointerlockchange = function ( event ) {
				if ( document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element ) {
					kbamControls.enabled = true;

					blocker.style.display = 'none';
				} else {
					kbamControls.enabled = false;

					blocker.style.display = '-webkit-box';
					blocker.style.display = '-moz-box';
					blocker.style.display = 'box';

					instructions.style.display = '';
				}
			}

			var pointerlockerror = function ( event ) {
				instructions.style.display = '';
			}

			// Hook pointer lock state change events
			document.addEventListener( 'pointerlockchange', pointerlockchange, false );
			document.addEventListener( 'mozpointerlockchange', pointerlockchange, false );
			document.addEventListener( 'webkitpointerlockchange', pointerlockchange, false );

			document.addEventListener( 'pointerlockerror', pointerlockerror, false );
			document.addEventListener( 'mozpointerlockerror', pointerlockerror, false );
			document.addEventListener( 'webkitpointerlockerror', pointerlockerror, false );

			instructions.addEventListener( 'click', function ( event ) {
				instructions.style.display = 'none';

				// Ask the browser to lock the pointer
				element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;

				if ( /Firefox/i.test( navigator.userAgent ) ) {
					var fullscreenchange = function ( event ) {
						if ( document.fullscreenElement === element || document.mozFullscreenElement === element || document.mozFullScreenElement === element ) {
							document.removeEventListener( 'fullscreenchange', fullscreenchange );
							document.removeEventListener( 'mozfullscreenchange', fullscreenchange );

							element.requestPointerLock();
						}
					}

					document.addEventListener( 'fullscreenchange', fullscreenchange, false );
					document.addEventListener( 'mozfullscreenchange', fullscreenchange, false );

					element.requestFullscreen = element.requestFullscreen || element.mozRequestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen;

					element.requestFullscreen();

				} else {
					element.requestPointerLock();
				}

			}, false );
		} else {
			instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';
		}
	};
	
	init();
};