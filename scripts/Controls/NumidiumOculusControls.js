/**
 * @author possan / http://possan.se/
 *
 * Oculus headtracking control
 * - use together with the oculus-rest project to get headtracking
 *   coordinates from the rift: http://github.com/possan/oculus-rest
 */

THREE.NumidiumOculusControls = function ( object ) {
	var scope = this;
	this.object = object;
	this.target = new THREE.Vector3( 0, 0, 0 );

	//this.headquat = new THREE.Quaternion();
	this.pitch = 0, this.yaw = 0, this.roll = 0;
	
	this.freeze = true;	// freeze hmd by default, unfreeze when in oculus view

	this.loadAjaxJSON = function ( url, callback ) {
		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function () {
			if ( xhr.readyState === xhr.DONE ) {
				if ( xhr.status === 200 || xhr.status === 0 ) {
					if ( xhr.responseText ) {
						var json = JSON.parse( xhr.responseText );
						callback( json );
					}
					else {
						// we failed to get an orientation from oculus-rest; freeze our controls
						// and let kbam take over
						scope.freeze = true;						
					}
				}
			}
		};
		xhr.open( "GET", url, true );
		xhr.withCredentials = false;
		xhr.send( null );
	};

	this.gotCoordinates = function( r ) {
		//this.headquat.set(r.quat.x, r.quat.y, r.quat.z, r.quat.w);
		
		this.pitch = r.euler.p;
		this.yaw = r.euler.y;
		this.roll = r.euler.r;
		
		this.queuePoll();
	}

	this.pollOnce = function() {
		this.loadAjaxJSON('http://localhost:50000', bind(this, this.gotCoordinates));
	}

	this.queuePoll = function() {
		setTimeout(bind(this, this.pollOnce), 10);
	}

	this.update = function( delta ) {
		if ( this.freeze ) {
			// if no oculus head tracking, make sure camera isn't rolled
			this.object.parent.rotation.z = 0;
			return;
		}
		
		this.object.parent.rotation.z = this.roll;
		this.object.parent.parent.parent.rotation.y = this.yaw;
		this.object.parent.parent.rotation.x = this.pitch;
	};

	function bind( scope, fn ) {
		return function () {
			fn.apply( scope, arguments );
		};
	};

	this.connect = function() {
		this.queuePoll();
	};
};
