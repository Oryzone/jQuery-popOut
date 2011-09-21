(function($){  
    
    $.fn.popout = function(options)
    {  
        return this.each(function()
        {
             new Popout($(this), options);
        });	
    };
    
    
    $.fn.popoutInstance = function()
    {
        var instance = undefined;
        if(this.data('popout') && (instance = this.data('popout').instance))
            return instance;
        
        return undefined;
    }
    
    
    
    var Popout = function(container, options)
    {
        var self = this;
        var timeout = null;

        var calculateFinalPosition = function(cw, ch, pw, ph, dx, dy)
        {
            return [
                eval(
                    Popout.cTabPosition[self.options.position[0]][self.options.position[1]]['x'] + 
                    Popout.cTabAnchor[self.options.anchor[0]][self.options.anchor[1]]['x'] +
                    "+dx"
                ),
                eval(
                    Popout.cTabPosition[self.options.position[0]][self.options.position[1]]['y'] + 
                    Popout.cTabAnchor[self.options.anchor[0]][self.options.anchor[1]]['y'] +
                    "+dy"
                )
            ];
        };

        // merges the provided options with the default ones
        self.options = $.extend({}, Popout.defaults, options);   


        // initializes the instance
        var init = function()
        {  
            self.container = container;  // the current element
            self.container.css("position", "relative");

            //reads the data attached to the container
            self.data = self.container.data("popout");
            if(!self.data)
            {
                //tries to normalize attached data
                self.data = {
                    distance : self.container.data().popoutDistance,
                    position : self.container.data().popoutPosition,
                    anchor : self.container.data().popoutAnchor
                };
            }

            //parsing options
            if(self.options.distance == "data")
                self.options.distance = (self.data && self.data.distance) ? self.data.distance : self.options.defaultDistance;

            if(self.options.anchor == "data")
                self.options.anchor = (self.data && self.data.anchor) ? self.data.anchor : self.options.defaultAnchor;

            if(self.options.position == "data")
                self.options.position = (self.data && self.data.position) ? self.data.position : self.options.defaultPosition;

            //normalizes distance and references
            self.options.distance = Popout.normalizeDistance(self.options.distance);
            self.options.anchor = Popout.normalizeRef(self.options.anchor);
            self.options.position = Popout.normalizeRef(self.options.position);


            self.content = self.container.find(self.options.content)
                                         .css({ "position" : self.options.contentPosition,
                                                "z-index"  : self.options['z-index'],
                                                "top"      : 0});;                                                                           
            if(self.content.size() == 0)
                throw "CannotFindContentException: the selector '" + self.options.content + "' was not able to find any element";

            self.button = self.container.find(self.options.button);

            self.closeButton = self.container.find(self.options.closeButton);

            if( self.options.useCloseButton && self.closeButton.size() > 0 )
            {
                if(self.options.openOnClick)
                {
                    self.closeButton.click(function()
                    {
                        self.close();
                    });
                }
            }
            
            
            var createGlassPane = function()
            {
                self.glassPane = $('<div class="popout-glassPane"/>').css({
                    position    : "absolute",
                    "z-index"   : self.options['z-index'] - 1,
                    width       : "100%",
                    height      : "100%",
                    top         : 0,
                    left        : 0,
                    margin      : 0,
                    padding     : 0
                }).click(function(){
                    self.close();
                }).appendTo($('body'));
            };
            
            var destroyGlassPane = function()
            {
                if(self.glassPane)
                {
                    self.glassPane.remove();
                    self.glassPane = undefined;
                }
            };


            self.isOpen = function()
            {
                return self.content.hasClass(self.options.openClass);
            };


            self.open = function()
            {
                pos = calculateFinalPosition(
                        self.button.outerWidth(), 
                        self.button.outerHeight(),
                        self.content.outerWidth(), 
                        self.content.outerHeight(),
                        self.options.distance[0],
                        self.options.distance[1]
                      );

                if(self.options.closeOnClickOut)
                    createGlassPane();

                self.content.addClass(self.options.openClass).css({
                    left    : pos[0] + "px",
                    top     : pos[1] + "px",
                    display : self.options.displayOn
                });
            };


            self.close = function()
            {
                destroyGlassPane();
                self.cancelDelayedClose();    
		self.content.removeClass(self.options.openClass)
                            .css('display', self.options.displayOff);
            };


            self.toggle = function()
            {
                if(self.isOpen())
                        self.close();
                else
                        self.open();
            };


            self.delayedClose = function(delay)
            {
                if(delay)
                {
                    if("number" != typeof delay)
                        throw "InvalidArgumentException: '" + delay + "' is not a valid delay";
                }
                else
                {
                    delay = self.options.closeDelay;
                }
                    
                self.cancelDelayedClose();
                timeout = setTimeout(
                    function(){
                        self.close();
                    }, delay
                );
            };

            self.cancelDelayedClose = function()
            {
                if(timeout)
                    clearTimeout(timeout);
            };


            self.button.click( function(){
                self.toggle();
                return false;
            });


            self.container.hover(
                function()
                {
                    if(self.options.openOnHover && !self.isOpen())
                        self.open();
                    
                    if(self.isOpen() && self.options.closeOnHoverOut)
                        self.cancelDelayedClose();
                },
                function()
                {
                    if(self.isOpen && self.options.closeOnHoverOut)
                        self.delayedClose();
                }
            );

            //adds the current instance to the container DOM element data
            self.container.data('popout', {'instance' : self });

        };
        
        
        self.destroy = function()
        {
            //TODO
        };
        
        
        // automatically calls the init method at initialization
        init();

    };
    

    // the set of the default options
    Popout.defaults =
    {
        'button'            : '.popout-button',
        'content'           : '.popout-content',
        'closeButton'       : '.popout-close', 
        'openClass'         : 'popout-open',
        'openOnHover'       : false,
        'openOnClick'       : true,
        'closeOnHoverOut'   : true,
        'closeOnClickOut'   : false,
        'closeDelay'        : 500,
        'useCloseButton'    : true,
        'z-index'           : 9999,
        'contentPosition'   : 'absolute',
        'displayOn'         : 'block',
        'displayOff'        : 'none',
        'position'          : 'data',
        'anchor'            : 'data',
        'distance'          : 'data',
        'defaultPosition'   : 'SW',
        'defaultAnchor'     : 'NW',
        'defaultDistance'   : 0 
    };


    // table used to convert shortcut relative position from geographic to directional
    Popout.geo2dir = 
    {
        'NW' : ['left'  , 'top'],
        'N'  : ['center', 'top'],
        'NE' : ['right' , 'top'],
        'W'  : ['left'  , 'center'],
        'C'  : ['center', 'center'],
        'E'  : ['right' , 'center'],
        'SW' : ['left'  , 'bottom'],
        'S'  : ['center', 'bottom'],
        'SE' : ['right' , 'bottom']
    };


    // formulas table used to calculate of the popout box position
    Popout.cTabPosition = 
    {
        'left' : {
            'top'   : { 'x': "+0",
                        'y': "+0" },
            'center': { 'x': "+0",
                        'y': "+ch/2" },
            'bottom': { 'x': "+0",
                        'y': "+ch" }
        },
        'center': {
            'top'   : { 'x': "+cw/2",
                        'y': "+0" },
            'center': { 'x': "+cw/2",
                        'y': "+ch/2" },
            'bottom': { 'x': "+cw/2",
                        'y': "+ch" }
        },
        'right': {
            'top'   : { 'x': "+cw",
                        'y': "+0" },
            'center': { 'x': "+cw",
                        'y': "+ch/2" },
            'bottom': { 'x': "+cw",
                        'y': "+ch" }
        }
    };


    // formulas table used to calculate of the popout box offset
    Popout.cTabAnchor = 
    {
        'left' : {
            'top'   : { 'x': "+0",
                        'y': "+0" },
            'center': { 'x': "+0",
                        'y': "-ph/2" },
            'bottom': { 'x': "+0",
                        'y': "-ph" }
        },
        'center': {
            'top'   : { 'x': "-pw/2",
                        'y': "+0" },
            'center': { 'x': "-pw/2",
                        'y': "-ph/2" },
            'bottom': { 'x': "-pw/2",
                        'y': "-ph" }
        },
        'right': {
            'top'   : { 'x': "-pw",
                        'y': "+0" },
            'center': { 'x': "-pw",
                        'y': "-ph/2" },
            'bottom': { 'x': "-pw",
                        'y': "-ph" }
        }
    };


    Popout.normalizeRef = function(ref)
    {
        if('string' == typeof ref)
        {
            ref = ref.toUpperCase();

            if(Popout.geo2dir[ref] != null)
                    return Popout.geo2dir[ref];
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
                    ref[1] == 'top'     ||
                    ref[1] == 'center'	||
                    ref[1] == 'bottom'
                ))
            {
                return ref;
            }
        }

        throw "InvalidArgumentException: '" + ref + "' is not a valid reference";
    };


    
    Popout.normalizeDistance = function(distance)
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

        throw "InvalidArgumentException: '" + distance + "' is not a valid distance";
    }
     
})(jQuery);