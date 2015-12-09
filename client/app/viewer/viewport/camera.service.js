'use strict';

( function(app, THREE) {
// Returns a single instance of a camera.  Consumed by directive and controls.
app.factory('camera', function (scene) {

    var _this = this;

    this.createPerspective = function () { 

      // default values for camera
      var viewAngle = 45;
      var near = 0.1;
      var far = 1000000;

      this.perspectiveCam = new THREE.PerspectiveCamera(viewAngle, _this.aspectRatio, near, far);
      scene.add(this.perspectiveCam);

    };

    this.createOrthographic = function () {

      var height = 200000;
      var left = _this.aspectRatio * height/ -2;// Camera frustum left plane.
      var right = _this.aspectRatio * height / 2;// Camera frustum right plane.
      var top  = height / 2; // Camera frustum top plane.
      var bottom = height / -2;// Camera frustum bottom plane.
      var near = 0// Camera frustum near plane.
      var far = 1000000000;// Camera frustum far plane.

      this.orthographicCam = new THREE.OrthographicCamera( left, right, top, bottom, near, far );

      scene.add(this.orthographicCam);
      // var helper = new THREE.CameraHelper(this.orthographicCam);
      // scene.add(helper);
    };

    this.useOrtographic = function () {
      _this.controls.object = _this.orthographicCam;

       //Update the view size for the new camera.
      //This in need because there might have been a resize while using the other camera.
      _this.setViewSize( _this.width,_this.height);

      _this.controls.reset();
    };

    this.usePerspective = function () {
      
      _this.controls.object = _this.perspectiveCam;

       //Update the view size for the new camera.
      //This in need because there might have been a resize while using the other camera.
      _this.setViewSize( _this.width,_this.height);

      _this.controls.reset();
    };

    this.resetCurrentCamera = function() {
      //Update the view size for the new camera.
      //This in need because there might have been a resize while using the other camera.
      _this.setViewSize( _this.width,_this.height);

      _this.controls.reset();
    };

    this.setViewSize = function( width , height ) {
      _this.width = width;
      _this.height = height;


      if ( _this.controls.object instanceof THREE.OrthographicCamera ) {

        var factor = (width / height ) / _this.aspectRatio;

        _this.controls.object.left *= factor;
        _this.controls.object.right *= factor;

      }

      _this.aspectRatio = width / height;
      _this.controls.object.aspect =  _this.aspectRatio;
      _this.controls.object.updateProjectionMatrix();
      _this.controls.handleResize();
      _this.render();

    };

    this.animate = function() {
      requestAnimationFrame( _this.animate);
      _this.controls.update();
    };

    this.render = function() {
      _this.renderer.render(scene, _this.controls.object);
    };


    this.initController = function( renderer ) {
  		_this.renderer = renderer;
      _this.controls = new THREE.TrackballControls( _this.orthographicCam , renderer.domElement );
			_this.controls.addEventListener( 'change', _this.render );

      _this.animate();
    };

    //FIXME scale such that the bounding box cover the viewport
    this.lookBBoxFromTop = function( bbox ) {

      var center = bbox.center();
      // center.x = center.x + bbox.size().x / 2.0;

      _this.controls.target0 = center;
      _this.controls.position0.set( 0.0 , center.y , center.z );

      _this.controls.up0.set( 0 , 0, 1 );

      var height = bbox.size().z;
      var width = bbox.size().y;
      this.zoomOrtographicBBox(height , width);


    };


    this.lookBBoxFromSide = function ( bbox ) {
      
      var center = bbox.center();
      // center.z = center.z + bbox.size().z / 2.0;

      _this.controls.target0 = center;
      _this.controls.position0.set( center.x  , center.y, 0.0);

      _this.controls.up0.set( 1 , 0, 0 );

      var height = bbox.size().x;
      var width = bbox.size().y;
      this.zoomOrtographicBBox(height, width);

    }


    this.lookBBoxFromOblique = function ( bbox ) {

      _this.controls.target0 = bbox.center();
      _this.controls.position0.set( 0.0  , 0.0, 0.0 );
      _this.controls.up0.set( 1 , 0, 0 );
      _this.controls.reset();


      var height = bbox.size().z;
      var width = bbox.size().y;
      this.zoomOrtographicBBox(height, width);
    }

    this.zoomOrtographicBBox = function( height, width ) {

      height = Math.max( width / _this.aspectRatio, height)
      var zoomFactor = 1.2

      _this.controls.object.left  = 0.0 + _this.aspectRatio * height/ 2  * zoomFactor;// Camera frustum left plane.
      _this.controls.object.right = 0.0 - _this.aspectRatio * height/ 2 * zoomFactor;// Camera frustum right plane.
      _this.controls.object.top    = 0.0 - height / 2 * zoomFactor; // Camera frustum top plane.
      _this.controls.object.bottom = 0.0 + height / 2 * zoomFactor;// Camera frustum bottom plane.

      _this.controls.reset();
      _this.controls.orthoZoom = true;
      _this.controls.object.updateProjectionMatrix();
      _this.controls.update();
      _this.render();
    };
    

    _this.aspectRatio = window.innerWidth / window.innerHeight;
    _this.createPerspective();
    _this.createOrthographic();

    return this;
});

})(app, THREE);