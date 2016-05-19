'use strict';
 
/**
 * Using Rails-like standard naming convention for endpoints.
 * GET		 /cells							->	list
 * POST		/cells							->	create
 * GET		 /cells/:id					->	show
 * PUT		 /cells/:id					->	update
 * DELETE	/cells/:id					->	destroy
 */

app.service('cells', [ '$q', '$resource', 'CacheFactory', function ($q, $resource, CacheFactory) {
	let _cache = CacheFactory('cells');

	var api = $resource('/1.0/cells/:id', { id: '@_id' }, { 
		list: { 
			method: 'GET', 
			isArray: true, 
			cache: true, 
		},
		create: { method: 'POST' }, // isn't this backwards with update?
		show: { 
			method: 'GET', 
			isArray: false, 
			cache: true, 
		},
		update: { method: 'PUT', },
		destroy: { method: 'DELETE' },
	});

	this.colorize = function (cell, count) {	
		if (!cell.color) {
			if (count === 1) {
				cell.color = '#fff';
			}
			else if (count < 16) {
				cell.color = colorize_by_type(cell);	
			}
			else {
				cell.color = colorize_by_distinctiveness(cell);
			}
		}
	};

	this.get = function (cellids) {
		let promises = [];
		for (let cellid of cellids) {
			promises.push(this.show(cellid, cellids.length));
		}

		return $q.all(promises);
	};

	this.show = function (cell_id, count) {
		let _this = this;

		return $q(function (resolve, reject) {
			let cell = _cache.get(cell_id.toString());

			if (cell) {
				cell.$promise.then(function () {
					_this.colorize(cell, count);
					_cache.put(cell.id.toString(), cell);

					resolve(cell);
				});
				return;
			}

			let unfufilled_cell = api.show({ id: cell_id }, function (cell) {
				_this.colorize(cell, count);
				_cache.put(cell.id.toString(), cell);

				resolve(cell);
			}, function () {
				reject(null);
			});

			_cache.put(cell_id.toString(), unfufilled_cell);
		});
	};

	this.list = function (callback) {
		return $q(function (resolve, reject) {
			api.list(function (cellinfos) {
				resolve(cellinfos);

				if (callback) {
					callback(cellinfos);
				}
			});
		});
	};

	this.uncolor = function () {
		_cache.keys().forEach(function (key) {
			let cell = _cache.get(key);
			cell.color = null;
			_cache.put(key, cell);
		});

		Object.keys(_color_types).forEach(function (key) {
			_color_types[key].index = 0;
		});
	};

	this.create = api.create;

	let _color_types = {
      ganglion: {
        index: 0,
        colors: [
         // blues
         '#9ecae1', '#6baed6','#4292c6','#2171b5',//'#084594',

         //purples
         '#9e9ac8','#807dba','#6a51a3'//,'#4a1486'
        ]
      },
      bipolar: {
        index: 0,
        colors: [
        // greens
        '#c7e9c0', '#a1d99b', '#74c476', '#41ab5d', '#238b45', '#005a32',
         
        // yellow-greens
        '#ffffcc','#c2e699','#78c679'

         // '#eff3ff', '#c6dbef', '#9ecae1', '#6baed6',
         // '#4292c6', '#2171b5', '#084594'
       ],
      },
      amacrine: {
        index: 0,
        colors: [ 
         // reds
         '#fcae91', '#fb6a4a', '#de2d26', '#a50f15',

         // oranges 
         '#fdbe85', '#fd8d3c', '#e6550d', '#a63603'
       ],
      }
    };

    function colorize_by_type (cell) {
      let assignment = { index: 0, colors: [ '#ff0' ] }; // booger green-yellow, indicates problem with data
      if (_color_types[cell.type]) {
        assignment = _color_types[cell.type];
      }

      let color = assignment.colors[ 
        assignment.index % assignment.colors.length 
      ];

      assignment.index++;

      return color;
    }

    let _id_index = 0;

    function colorize_by_distinctiveness (cell) {
		
		// From https://en.wikipedia.org/wiki/Help:Distinguishable_colors
		// candy colored

		var colors = [
			'#F0A3FF', '#0075DC', '#993F00', '#4C005C', '#005C31', '#2BCE48',
			'#FFCC99', '#808080', '#94FFB5', '#8F7C00', '#9DCC00', '#C20088',
			'#003380', '#FFA405', '#FFA8BB', '#FFA8BB', '#426600', '#FF0010',
			'#5EF1F2', '#00998F', '#740AFF', '#990000', '#FF5005', '#FFFF00'
		];

		// From distinguishable colors from matlab. Ugly as sin.

		// var colors = [
		//   0x00ff00, 0x0000ff, 0xff0000, 0xff1ab8, 0x00fff6, 0xffdb72,
		//   0x008cff, 0x007200, 0xffcaed, 0x3d0069, 0xa72b3d, 0x95ff95,
		//   0xb857ff, 0x725708, 0x348ca7, 0xdbff00, 0xff8c00, 0xafc19e,
		//   0x8c5783, 0xf69e83
		// ];

		let color = colors[ _id_index % colors.length ];

		_id_index++;

		return color;
	}
}]);