/**
* TODO:
*  	 - Apertura all'hover o al click (a scelta)
*    - pulsante di chiusura del popout
*    - ignorare la generazione del popout se non vengono trovati il button e il content
*    - consentire un parametro "data" per "position", "anchor" e "distance" che prelevi i dati dall'attributo data [Done]
*    - animazioni open/close
*    - delay autoclose [Done]
*    - events
*  
*  BUGS:
*  	 - Broke if calls the plugin two times on the same element
*  
*  Improvements:
*  	 - cleanup and comment the code
*/

(function($){  
    
    
    Popout = function(container, options)
    {
        var self = this;

        // the set of the default options
        self.defaults = {
                'button'			: '.popout-button',
                'content'			: '.popout-content',
                'openClass'			: 'popout-open',
                'closeOnHoverOut'	: true,
				'closeDelay'		: 500,
                'z-index'			: 9999,
                'contentPosition'	: 'absolute',
                'displayOn'			: 'block',
                'displayOff'		: 'none',
                'position'			: 'data',
                'anchor'			: 'data',
                'distance'			: 'data',
                'defaultPosition'	: 'SW',
                'defaultAnchor'		: 'NW',
                'defaultDistance'	: 0 
        };

        // table used to convert shortcut relative position from geographic to directional
        self.geo2dir = {
                'NW' : ['left',		'top'],
                'N'  : ['center',	'top'],
                'NE' : ['right',	'top'],
                'W'  : ['left',		'center'],
                'C'  : ['center',	'center'],
                'E'  : ['right',	'center'],
                'SW' : ['left',		'bottom'],
                'S'  : ['center',	'bottom'],
                'SE' : ['right',	'bottom']
        };

        // formulas table used to calculate of the popout box position
        self.cTabPosition = {
                'left' : {
                        'top' 		: { 'x': "+0",
                                                'y': "+0" },
                        'center'	: { 'x': "+0",
                                                'y': "+ch/2" },
                        'bottom' 	: { 'x': "+0",
                                                'y': "+ch" }
                },
                'center': {
                        'top' 		: { 'x': "+cw/2",
                                                'y': "+0" },
                        'center'	: { 'x': "+cw/2",
                                                'y': "+ch/2" },
                        'bottom' 	: { 'x': "+cw/2",
                                                'y': "+ch" }
                },
                'right': {
                        'top' 		: { 'x': "+cw",
                                                'y': "+0" },
                        'center'	: { 'x': "+cw",
                                                'y': "+ch/2" },
                        'bottom' 	: { 'x': "+cw",
                                                'y': "+ch" }
                }
        };

        // formulas table used to calculate of the popout box offset
        self.cTabAnchor = {
                'left' : {
                        'top' 		: { 'x': "+0",
                                                'y': "+0" },
                        'center'	: { 'x': "+0",
                                                'y': "-ph/2" },
                        'bottom' 	: { 'x': "+0",
                                                'y': "-ph" }
                },
                'center': {
                        'top' 		: { 'x': "-pw/2",
                                                'y': "+0" },
                        'center'	: { 'x': "-pw/2",
                                                'y': "-ph/2" },
                        'bottom' 	: { 'x': "-pw/2",
                                                'y': "-ph" }
                },
                'right': {
                        'top' 		: { 'x': "-pw",
                                                'y': "+0" },
                        'center'	: { 'x': "-pw",
                                                'y': "-ph/2" },
                        'bottom' 	: { 'x': "-pw",
                                                'y': "-ph" }
                }
        }

        self.normalizeRef = function(ref)
        {
                if('string' == typeof ref)
                {
                        ref = ref.toUpperCase();

                        if(self.geo2dir[ref] != null)
                                return self.geo2dir[ref];

                        throw "InvalidArgumentException";
                }

                else if(ref instanceof Array && ref.length == 2)
                {
                        ref[0] = ref[0].toLowerCase();
                        ref[1] = ref[1].toLowerCase();

                        if ( (
                                        ref[0] == 'left' 	||
                                        ref[0] == 'center'	||
                                        ref[0] == 'right'
                                 )
                                 &&
                                (
                                        ref[1] == 'top'		||
                                        ref[1] == 'center'	||
                                        ref[1] == 'bottom'
                                ))
                        {
                                return ref;
                        }
                }

                throw "InvalidArgumentException";
        };

        self.normalizeDistance = function(distance)
        {
                if("number" == typeof distance ||
                   ("string" == typeof distance && parseInt(distance) != NaN)
                )
                {
                        return [parseInt(distance), parseInt(distance)];
                }
                else if(distance instanceof Array && distance.length == 2)
                {
                        if("number" == typeof parseInt(distance[0]) &&
                           "number" == typeof parseInt(distance[1]) )
                        return [parseInt(distance[0]), parseInt(distance[1])];
                }

                throw "InvalidArgumentException";
        }



        self.calculateFinalPosition = function(cw, ch, pw, ph, dx, dy)
        {
                return [
                                eval(
                                        self.cTabPosition[self.options.position[0]][self.options.position[1]]['x'] + 
                                        self.cTabAnchor[self.options.anchor[0]][self.options.anchor[1]]['x'] +
                                        "+dx"),
                                eval(
                                        self.cTabPosition[self.options.position[0]][self.options.position[1]]['y'] + 
                                        self.cTabAnchor[self.options.anchor[0]][self.options.anchor[1]]['y'] +
                                        "+dy")
                                ];
        };

        self.options = $.extend({}, self.defaults, options);   // merges the provided options with the default ones

        // executes the code on the selected elements
        var init = function()
        {  
            var obj = container;  // the current element
            obj.css("position", "relative");

            var data = obj.data("popout");
            if(!data)
            {
                    data = {
                            distance : obj.data().popoutDistance,
                            position : obj.data().popoutPosition,
                            anchor : obj.data().popoutAnchor
                    };
            }

            //parsing options
            if(self.options.distance == "data")
                    self.options.distance = (data && data.distance) ? data.distance : self.options.defaultDistance;

            if(self.options.anchor == "data")
                    self.options.anchor = (data && data.anchor) ? data.anchor : self.options.defaultAnchor;

            if(self.options.position == "data")
                    self.options.position = (data && data.position) ? data.position : self.options.defaultPosition;

            self.options.distance = self.normalizeDistance(self.options.distance);
            self.options.anchor = self.normalizeRef(self.options.anchor);
            self.options.position = self.normalizeRef(self.options.position);

            obj.popoutContent = obj.find(self.options.content)
                                                    .css({ "position" : self.options.contentPosition,
                                                           "z-index"  : self.options['z-index'],
                                                           "top"      : 0});

            obj.popoutButton = obj.find(self.options.button);

            obj.isPopoutOpen = function()
            {
                    return obj.popoutContent.hasClass(self.options.openClass);
            };

            obj.openPopout = function()
            {
                    pos = self.calculateFinalPosition( 
                                                        obj.popoutButton.outerWidth(), 
                                                        obj.popoutButton.outerHeight(),
                                                        obj.popoutContent.outerWidth(), 
                                                        obj.popoutContent.outerHeight(),
                                                        self.options.distance[0],
                                                        self.options.distance[1] );

                    obj.popoutContent.addClass(self.options.openClass).css({
                            left	: pos[0] + "px",
                            top 	: pos[1] + "px",
                            display	: self.options.displayOn
                    });
            };

            obj.closePopout = function()
            {
                obj.cancelDelayedClose();    
				obj.popoutContent.removeClass(self.options.openClass).css('display', self.options.displayOff);
            };

            obj.togglePopout = function()
            {
                    if(obj.isPopoutOpen())
                            obj.closePopout();
                    else
                            obj.openPopout();
            };

			obj.delayedClose = function()
			{
				obj.cancelDelayedClose();
				obj.timeout = setTimeout(function(){obj.closePopout();}, self.options.closeDelay);
			};
			
			obj.cancelDelayedClose = function()
			{
				if(obj.timeout)
					clearTimeout(obj.timeout);
			};

            obj.popoutButton.click( function(){
                    obj.togglePopout();
                    return false;
            });

            obj.hover(
                    function()
					{
						if(obj.isPopoutOpen() && self.options.closeOnHoverOut)
								obj.cancelDelayedClose();
					},
                    function()
					{
						if(obj.isPopoutOpen() && self.options.closeOnHoverOut)
								obj.delayedClose();
                    }
            );
        };
        
        init();

    };
    
    
    
	$.fn.popout = function(options)
    {  
            return this.each(function(){
                 new Popout($(this), options);
            });	
	};  
})(jQuery);