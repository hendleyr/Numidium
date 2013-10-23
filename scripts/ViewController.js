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
		objectsThreshold: 256,
		// percent between 0 and 1 that nodes will overlap each other
		// helps insert objects that lie over more than one node
		overlapPct: 0.25
	} );

	var camera, viewAngle, aspectRatio, nearClip, farClip;
	var renderer, anaglyphRenderer, oculusRenderer;
	var kbamControls, oculusControls, gamepadControls;
	var	isAnaglyph = false, isOculus = false;
	
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
		
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.setClearColor( scene.fog.color, 1 );
		renderer.autoClear = false;
		renderer.shadowMapEnabled = true;
		renderer.shadowMapType = THREE.PCFShadowMap;
		
		oculusRenderer = new THREE.NumidiumOculusRiftEffect( renderer, camera, {worldFactor: 1} );
		anaglyphRenderer = new THREE.AnaglyphEffect(  renderer, window.innerWidth, window.innerHeight );

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
		
		oculusControls.update(clock.getDelta());
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
		switch (event.keyCode) {
			case 73:	//i
				isAnaglyph = true;
				isOculus = false;
				oculusControls.freeze = true;
                onWindowResize();
				break;
			case 79:	//o
				isAnaglyph = false;
				isOculus = true;
				oculusControls.connect();	// send a GET to http://localhost:50000/
				oculusControls.freeze = false;
                onWindowResize();
				break;
			case 80:	//p
				isAnaglyph = false;
				isOculus = false;
				oculusControls.freeze = true;
                onWindowResize();
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