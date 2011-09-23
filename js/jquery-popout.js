/*!
 * jQuery-popOut vers. 1.0
 * developed by Luciano Mammino and Mangano Andrea, sponsored by ORYZONE (http://oryzone.com)
 * 
 * Released under MIT license (http://en.wikipedia.org/wiki/MIT_License)
 * 
 * Bug reports, suggestions, compliments? Use github: https://github.com/Oryzone/jQuery-popOut
 */


// initializes the Oryzone namespace if needed
if(typeof(Oryzone)=="undefined")
    Oryzone = {};

// constructor
Oryzone.Popout = function(el, options)
{
    if(el)
    {
        this.init(el, options);
    }
};

(function($){
    
    // Adds destroyed event, raised when an element is removed from the DOM
    // from javascript MVC (http://javascriptmvc.com/)
    if(!$.event.special["destroyed"])
    {
        $.event.special["destroyed"] = {
            remove: function( handleObj){
                //call the handler
                if(handleObj.removed || handleObj.handler.removed) return;
                var event = $.Event( "destroyed" );
                event.preventDefault();
                event.stopPropagation(); 
                handleObj.removed = true;
                handleObj.handler.call( this, event )
            },
            setup : function(handleObj){}
        }
        var oldClean = $.cleanData
        $.cleanData= function( elems ) {
            for ( var i = 0, elem; (elem = elems[i]) != null; i++ ) {
                $.event.remove( elem, 'destroyed' );
            }
            oldClean(elems)
        }
    }
    
    // the set of default options
    var defaults =
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
    var geo2dir = 
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
    var cTabPosition = 
    {
        'left' : {
            'top'   : {'x': "+0",
                       'y': "+0"},
            'center': {'x': "+0",
                       'y': "+ch/2"},
            'bottom': {'x': "+0",
                       'y': "+ch"}
        },
        'center': {
            'top'   : {'x': "+cw/2",
                       'y': "+0"},
            'center': {'x': "+cw/2",
                       'y': "+ch/2"},
            'bottom': {'x': "+cw/2",
                       'y': "+ch"}
        },
        'right': {
            'top'   : {'x': "+cw",
                       'y': "+0"},
            'center': {'x': "+cw",
                       'y': "+ch/2"},
            'bottom': {'x': "+cw",
                       'y': "+ch"}
        }
    };


    // formulas table used to calculate of the popout box offset
    var cTabAnchor = 
    {
        'left' : {
            'top'   : {'x': "+0",
                       'y': "+0"},
            'center': {'x': "+0",
                       'y': "-ph/2"},
            'bottom': {'x': "+0",
                       'y': "-ph"}
        },
        'center': {
            'top'   : {'x': "-pw/2",
                       'y': "+0"},
            'center': {'x': "-pw/2",
                       'y': "-ph/2"},
            'bottom': {'x': "-pw/2",
                       'y': "-ph"}
        },
        'right': {
            'top'   : {'x': "-pw",
                       'y': "+0"},
            'center': {'x': "-pw",
                       'y': "-ph/2"},
            'bottom': {'x': "-pw",
                       'y': "-ph"}
        }
    };
    
    
    // formulas table used to calculate distance
    var cTabDistance =
    {
        'left' : {
            'top'   : {'x': "-dx",
                       'y': "-dy"},
            'center': {'x': "-dx",
                       'y': "+0"},
            'bottom': {'x': "-dx",
                       'y': "+dy"}
        },
        'center': {
            'top'   : {'x': "+0",
                       'y': "-dy"},
            'center': {'x': "+0",
                       'y': "+0"},
            'bottom': {'x': "+0",
                       'y': "+dy"}
        },
        'right': {
            'top'   : {'x': "+dx",
                       'y': "-dy"},
            'center': {'x': "+dx",
                       'y': "+0"},
            'bottom': {'x': "+dx",
                       'y': "+dy"}
        }
    };

    // normalizes a position reference by converting it to a 2 coordinate relative reference
    // E.g. converts NW (North-West) to ["top", "left"]
    var normalizeRef = function(ref)
    {
        if('string' == typeof ref)
        {
            ref = ref.toUpperCase();

            if(geo2dir[ref] != null)
                    return geo2dir[ref];
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


    // normalizes a distance by converting it (from a number or a string) to an
    // array of 2 values that represents respectively the x and y distances. (top, left distances)
    var normalizeDistance = function(distance)
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
    
    
    // calculates the final position of a popout content
    var calculateFinalPosition = function(cw, ch, pw, ph, dx, dy, 
                                            pos_x, pos_y, anch_x, anch_y)
    {
        return [
            eval(
                cTabPosition[pos_x][pos_y]['x'] + 
                cTabAnchor[anch_x][anch_y]['x'] +
                cTabDistance[pos_x][pos_y]['x']
            ),
            eval(
                cTabPosition[pos_x][pos_y]['y'] + 
                cTabAnchor[anch_x][anch_y]['y'] +
                cTabDistance[pos_x][pos_y]['y']
            )
        ];
    };
    
    // gets the popout instance attached to a DOM element (if any)
    var getInstance = function(el)
    {
        el = $(el);
        return el.data('oryzone_popout');
    }
    
    // jQuery plugin initialization
    $.fn.popout = function(options)
    {  
        var args = $.makeArray(arguments),
            after = args.slice(1);
        
        return this.each( function()
        {    
             if((instance = getInstance(this)))
             {
                 if (typeof options == "string")
                 {
                     instance[options].apply(instance, after);
                 }
                 else
                 {
                     instance.update(options);
                 }
             }             
             else
             {
                new Oryzone.Popout($(this), options);
             }
        });	
    };
    
    // retrieves the first instance of the popout attached to the list of elements
    // retrieved by a selector (if any)
    $.fn.popoutInstance = function()
    {
        return getInstance(this);
    }
    
    
    // utility function that creates a background clickable glass pane
    var createGlassPane = function()
    {
        this.glassPane = $('<div class="popout-glassPane"/>').css({
            position    : "absolute",
            "z-index"   : this.options['z-index'] - 1,
            width       : "100%",
            height      : "100%",
            top         : 0,
            left        : 0,
            margin      : 0,
            padding     : 0
        }).click(function(){
            this.close();
        }).appendTo($('body'));
    };

    // destroys the glasspane
    var destroyGlassPane = function()
    {
        if(this.glassPane)
        {
            this.glassPane.remove();
            this.glassPane = undefined;
        }
    };
    
    // on button click handler
    var onButtonClick = function(event)
    {
        event.preventDefault();
        this.toggle();
    };
    
    // on close button click handler
    var onCloseButtonClick = function(event)
    {
        event.preventDefault();
        this.close();
    };
    
    // on container mouseover handler
    var onMouseOver = function(event)
    {
        if(this.options.openOnHover && !this.isOpen())
            this.open();

        if(this.isOpen() && this.options.closeOnHoverOut)
            this.cancelDelayedClose();
    };
    
    // on mouseout container handler
    var onMouseOut = function(event)
    {
        if(this.isOpen && this.options.closeOnHoverOut)
            this.delayedClose();
    };
    
    // defines the Popout prototype
    $.extend(Oryzone.Popout.prototype, {
        
        // the name of the instance
        name: "oryzone_popout",
        
        // the current version
        version: 1.0,
        
        // Initializes the object
        init: function(el, options)
        {
            // initializes a set of variables that should not be modified at runtime
            this._private = {
                timeout : null,
                defaults: 
                {
                    container : {},
                    content : {}
                }
            };
            
            // save this instance in jQuery data
            el.data(this.name, this);

            // merges the provided options with the default ones
            this.options = $.extend({}, defaults, options);
            
            // sets the current container
            this.container = el;
            this._private.defaults.container.position = this.container.css("position");
            this.container.css("position", "relative");
            
            // sets the content
            this.content = this.container.find(this.options.content);
        
            this._private.defaults.content = {
                position  : this.content.css("position"),
                "z-index" : this.content.css("z-index"),
                top       : this.content.css("top"),
                left      : this.content.css("left"),
                display   : this.content.css("display")
            };
        
            this.content.css({"position" : this.options.contentPosition,
                              "z-index"  : this.options['z-index'],
                              "top"      : 0});
                          
            // throws an exception if cannot find the content element
            if(this.content.size() == 0)
                throw "CannotFindContentException: the selector '" + this.options.content + 
                      "' was not able to find any element";
            
            //sets the button 
            this.button = this.container.find(this.options.button);

            //sets the close button
            this.closeButton = this.container.find(this.options.closeButton);
            
            //reads the data attached to the container
            var data = this.container.data("popout");
            if(!data)
            {
                //tries to normalize attached data
                data = {
                    distance : this.container.data().popoutDistance,
                    position : this.container.data().popoutPosition,
                    anchor   : this.container.data().popoutAnchor
                };
            }
            
            //parsing options
            if(this.options.distance == "data")
                this.options.distance = (data && data.distance) ? data.distance : this.options.defaultDistance;

            if(this.options.anchor == "data")
                this.options.anchor = (data && data.anchor) ? data.anchor : this.options.defaultAnchor;

            if(this.options.position == "data")
                this.options.position = (data && data.position) ? data.position : this.options.defaultPosition;

            //normalizes distance and references
            this.options.distance = normalizeDistance(this.options.distance);
            this.options.anchor = normalizeRef(this.options.anchor);
            this.options.position = normalizeRef(this.options.position);
            
            //calls the bind method to attach all the listeners
            this.bind();
        },
        
        // attaches all the listeners
        bind : function()
        {
            //prepares event handlers
            this.onButtonClick = $.proxy(onButtonClick, this);
            this.onCloseButtonClick = $.proxy(onCloseButtonClick, this);
            this.onMouseOver = $.proxy(onMouseOver, this);
            this.onMouseOut = $.proxy(onMouseOut, this);
            
            //binds events to handlers
            this.container.bind("destroyed", $.proxy(this.teardown, this));
            
            this.button.bind("click", this.onButtonClick);
            
            if( this.options.useCloseButton && this.closeButton.size() > 0 )
            {
                if(this.options.openOnClick)
                {
                    this.closeButton.bind("click", this.onCloseButtonClick);
                }
            }
            
            this.container.bind("mouseover", this.onMouseOver);
            this.container.bind("mouseout", this.onMouseOut);
        },
        
        // unattaches all the listener
        unbind : function()
        {
            this.button.unbind("click", this.onButtonClick);
            this.closeButton.unbind("click", this.onCloseButtonClick);
            this.container.unbind("mouseover", this.onMouseOver);
            this.container.unbind("mouseout", this.onMouseOut);
            this.container.unbind("destroyed", this.teardown);
        },
        
        // updates the plugin to be conform to a new set of options
        update : function(options)
        {
            this.destroy();
            this.init(this.container, options);
        },
        
        // destroys the instance
        destroy : function()
        {
            this.teardown();
        },
        
        // removes all the functionalities of the plugin
        teardown : function()
        {
            // removes the attached data
            this.container.removeData(this.name);
            
            // restores the old container position
            this.container.css(this._private.defaults.container);
            this.content.css(this._private.defaults.content);
            
            // removes the open class
            this.content.removeClass(this.options.openClass);
            
            // unbinds all the handlers
            this.unbind();
            
            // nullify all references
            this.button = undefined;
            this.closeButton = undefined;
            this.content = undefined;
        },
        
        // checks if the current popout is opened
        isOpen : function()
        {
            return this.content.hasClass(this.options.openClass);
        },

        // opens the popout element
        open : function()
        {
            pos = calculateFinalPosition(
                    this.button.outerWidth(), 
                    this.button.outerHeight(),
                    this.content.outerWidth(), 
                    this.content.outerHeight(),
                    this.options.distance[0],
                    this.options.distance[1],
                    this.options.position[0],
                    this.options.position[1],
                    this.options.anchor[0],
                    this.options.anchor[1]
            );

            if(this.options.closeOnClickOut)
                $.proxy(createGlassPane, this)();

            this.content.addClass(this.options.openClass).css({
                left    : pos[0] + "px",
                top     : pos[1] + "px",
                display : this.options.displayOn
            });

            return this;
        },

        // closes the popout element
        close : function()
        {            
            $.proxy(destroyGlassPane, this)();
            this.cancelDelayedClose();    
            this.content.removeClass(this.options.openClass)
                        .css('display', this.options.displayOff);
            return this;
        },

        // open the popout if closed and closes it otherwise
        toggle : function()
        {
            if(this.isOpen())
                this.close();
            else
                this.open();

            return this;
        },

        // closes the popout after `delay` millisecs
        delayedClose : function(delay)
        {
            if(delay)
            {
                if("number" != typeof delay)
                    throw "InvalidArgumentException: '" + delay + "' is not a valid delay";
            }
            else
            {
                delay = this.options.closeDelay;
            }

            this.cancelDelayedClose();
            
            var self = this;
            this._private.timeout = setTimeout(function(){self.close()}, delay);

            return this;
        },

        // cancel the delay close timeout (avoid closing the popout)
        cancelDelayedClose : function()
        {            
            if(this._private.timeout)
                clearTimeout(this._private.timeout);

            return this;
        }
        
    });
     
})(jQuery);