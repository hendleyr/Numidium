var NUMIDIUM = {};
var clock = new THREE.Clock();
var time = Date.now();

NUMIDIUM.ViewController = function () {
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
	var renderer, anaglyphRenderer, oculusRenderer;
	var shadowMapQuality = 1, shadowQualityDistribution = [256, 512, 512, 512, 1024, 1024, 1024, 1024], directionalLight = new THREE.DirectionalLight( 0xfefdbc, 0.5 );
	var kbamControls, oculusControls, gamepadControls;
	var	isAnaglyph = false, isOculus = false;
	this.directionalLight = function () {return directionalLight;}
	
	init = function () {
		viewAngle = 45;
		aspectRatio = window.innerWidth / window.innerHeight;
		nearClip = 1;
		farClip = 10000;
		camera = new THREE.PerspectiveCamera(viewAngle, aspectRatio, nearClip, farClip);
		
		if ( Detector.webgl ) {
			renderer = new THREE.WebGLRenderer( {antialias:false} );
		}
		else {
			renderer = new THREE.CanvasRenderer();
		}
		
		// RENDERER
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.setClearColor( scene.fog.color, 1 );
		renderer.autoClear = false;
		renderer.shadowMapEnabled = true;
		renderer.shadowMapCascade = true;
		//renderer.shadowMapType = THREE.BasicShadowMap;	// best performance
		//renderer.shadowMapType = THREE.PCFShadowMap;
		renderer.shadowMapType = THREE.PCFSoftShadowMap;	// best quality
		
		oculusRenderer = new THREE.NumidiumOculusRiftEffect( renderer, camera, {worldFactor: 1} );
		anaglyphRenderer = new THREE.AnaglyphEffect(  renderer, window.innerWidth, window.innerHeight );

		// LIGHTS
		directionalLight.position.set( -1500, 1100, 1200 );
		directionalLight.castShadow = true;
		
		directionalLight.shadowCascadeCount = 8;
		directionalLight.shadowCascadeWidth = [256, 512, 512, 512, 1024, 1024, 1024, 1024];
		directionalLight.shadowCascadeHeight = [256, 512, 512, 512, 1024, 1024, 1024, 1024];
		directionalLight.shadowCascadeNearZ = [-0.1, 0.65, 0.70, 0.95, 0.96, 0.99, 0.999, 0.9999];
		directionalLight.shadowCascadeFarZ  = [0.65, 0.70, 0.95, 0.96, 0.99, 0.999, 0.9999, 1.00];
		directionalLight.shadowCascadeBias = [0.005, 0.005, 0.005, 0.005, 0.004, 0.0065, 0.0065, 0.0065];
		// directionalLight.shadowCascadeOffset.z = -100;
		directionalLight.shadowCascade = true;
		// directionalLight.shadowCameraVisible = true;
		directionalLight.shadowDarkness = 0.5;
		scene.add(directionalLight);
		
		// VIEW CONTROLS
		document.addEventListener( 'keydown', onKeyDown, false );
		window.addEventListener('resize', onWindowResize, false);
		
		// CONTROLS
		oculusControls = new THREE.NumidiumOculusControls(camera);
		kbamControls = new NUMIDIUM.NumidiumControls(camera);
		kbamControls.sceneGraph = this.sceneGraph;
		kbamControls.getObject().position.set(872,-82,-261);
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
	
	this.render = function (scene) {
		if (isAnaglyph) {
			anaglyphRenderer.render(scene, camera);
		}
		else if (isOculus) {
			oculusRenderer.render(scene, camera);
		}
		else {
			renderer.render(scene, camera);
		}
	};
	
	this.update = function () {
		this.sceneGraph.update();
		
		oculusControls.update(clock.getDelta(), kbamControls.getGamepadRotate());
		kbamControls.update( Date.now() - time ); //TODO: tweak values so clock delta can be used instead
	};
	
	onWindowResize = function () {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();

		renderer.setSize(window.innerWidth, window.innerHeight);
		anaglyphRenderer.setSize(window.innerWidth, window.innerHeight);
		oculusRenderer.setSize(window.innerWidth, window.innerHeight);
	};
	
	onKeyDown = function (event) {
		console.log(event.keyCode);
		switch (event.keyCode) {
			case 49:
				renderer.shadowMapType = THREE.BasicShadowMap;	// best performance
				break;
			case 50:
				renderer.shadowMapType = THREE.PCFShadowMap;
				break;
			case 51:
				renderer.shadowMapType = THREE.PCFSoftShadowMap;	// best quality
				break;
			// case 192:{	// ~
				//TODO: toggle shadow mapping 
				// var shadowToggle = !directionalLight.castShadow;
				
				// for(var i = 0; i < directionalLight.shadowCascadeArray.length; ++i) {
					// directionalLight.shadowCascadeArray[i].castShadow = shadowToggle;
					
					// if (!shadowToggle && directionalLight.shadowCascadeArray[i].shadowMap) {
						// directionalLight.shadowCascadeArray[i].shadowMap.dispose();
					// }
				// }
				
				// directionalLight.castShadow = shadowToggle;				
				// if (!shadowToggle && directionalLight.shadowMap) {
					// directionalLight.shadowMap.dispose();
				// }
				// break;
			// }
			case 189:	// -
				shadowMapQuality /= 2;
				shadowQualityDistribution = [256, 512, 512, 512, 1024, 1024, 1024, 1024];
				for(var i = 0; i < directionalLight.shadowCascadeArray.length; ++i) {
					directionalLight.shadowCascadeArray[i].shadowMap.width = shadowQualityDistribution[i] * shadowMapQuality;
					directionalLight.shadowCascadeArray[i].shadowMap.height = shadowQualityDistribution[i] * shadowMapQuality;
					// directionalLight.shadowCascadeArray[i].shadowMapHeight = shadowQualityDistribution[i] * shadowMapQuality;
					// directionalLight.shadowCascadeArray[i].shadowMapWidth = shadowQualityDistribution[i] * shadowMapQuality;
				}
				break;
			case 187:	// +
				shadowMapQuality *= 2;
				shadowQualityDistribution = [256, 512, 512, 512, 1024, 1024, 1024, 1024];
				for(var i = 0; i < directionalLight.shadowCascadeArray.length; ++i) {
					directionalLight.shadowCascadeArray[i].shadowMap.width = shadowQualityDistribution[i] * shadowMapQuality;
					directionalLight.shadowCascadeArray[i].shadowMap.height = shadowQualityDistribution[i] * shadowMapQuality;
				}
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