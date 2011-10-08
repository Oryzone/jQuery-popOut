/**
 * jQuery eTruncate is a plugin that easily allows you to create popout elements
 * such as dropdown menus, tooltips, megamenus, popovers etc...
 * @fileOverview jQuery Popout plugin
 * @author <a href="mailto:lmammino@oryzone.com">Luciano Mammino</a>
 * @author <a href="mailto:amangano@oryzone.com">Andrea Mangano</a>
 * @copyright (c) 2011 <ahref="http://oryzone.com">ORYZONE</a>
 * @license MIT license (http://en.wikipedia.org/wiki/MIT_License)
 * @version 1.0
 */

// initializes the Oryzone namespace if needed
if(typeof(Oryzone)=="undefined")
    /**
     * @namespace Holds all the Oryzone js plugins
     */
    Oryzone = {};

/**
 *  Createns a new instance of Popout
 *  @class instance of Popout for a given element 
 */ 
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
    
    /**
     * @namespace Holds all the Popout base animations classes
     */
    Oryzone.PopoutAnimation = {};
    
    /**
     * @class simple animation class that does not provide real animations.
     * It can be easily extended to create custom animation objects
     */
    Oryzone.PopoutAnimation.none = function()
    {
        /**
         * @function sets the current DOM element the animation should work with
         */
        this.setElement = function(element)
        {
            this.element = element;
        };

        /**
         * @function sets the final position of the DOM element to display. The
         * position is represented by a 2 items array, the first contains the left distance
         * (in pixel) from the anchor point and the second the top distance
         */
        this.setPosition = function(position)
        {
            this.position = position;
        };
        
        /**
         * @function sets the options.
         */
        this.setOptions = function(options)
        {
            this.options = options;
        };
        
        /**
         * @function callback called before the open method
         */
        this.beforeOpen = function(){};
        
        /**
         * @function handles the opening animation
         */
        this.open = function(afterAnimation){
            this.element.css({
                left    : this.position[0] + "px",
                top     : this.position[1] + "px",
                display : this.options.displayOn
            });
            afterAnimation();
        };
        
        /**
         * @function callback called before the close method
         */
        this.beforeClose = function(){};
        
        /**
         * @function handles the close animation
         */
        this.close = function(afterAnimation){
            this.element.css('display', this.options.displayOff);
            afterAnimation();
        };
    };
    
    /**
     * @class slide animation class. Provides a simple implementation for showing
     * the popout with a slideDown effect and hiding it with a slideUp effect
     */
    Oryzone.PopoutAnimation.slide = function()
    {
        return $.extend({}, new Oryzone.PopoutAnimation.none(), {

           beforeOpen : function(){
               if("undefined" == typeof this.elementHeight)
               {
                   this.elementHeight = this.element.height();
                   this.elementPaddingTop = this.element.css("paddingTop");
                   this.elementPaddingBottom = this.element.css("paddingBottom");
               }
           },

           open : function(afterAnimation){
               this.element.css({
                    left    : this.position[0] + "px",
                    top     : this.position[1] + "px",
                    display : this.options.displayOn,
                    height  : 0,
                    paddingTop : '0px',
                    paddingBottom : '0px'
                });
               this.element.stop().animate(
                    {
                        height: this.elementHeight,
                        paddingTop : this.elementPaddingTop,
                        paddingBottom : this.elementPaddingBottom
                    },
                    this.options.animationSpeed,
                    this.options.animationEasing,
                    afterAnimation
               );
           },

           beforeClose : function(){},

           close : function(afterAnimation){
               var self = this;
               this.element.stop().animate(
                    {
                        height: 0,
                        paddingTop : '0px',
                        paddingBottom : '0px'
                    },
                    this.options.animationSpeed,
                    this.options.animationEasing,
                    function(){
                        self.element.css({
                            'display'       : self.options.displayOff,
                            'height'        : self.elementHeight,
                            'paddingTop'    : self.elementPaddingTop,
                            'paddingBottom' : self.elementPaddingBottom
                        });
                        afterAnimation();
                    }
               );
           } 
        });
    };
    
    /**
     * @class fade animation class. Provides a simple implementation for showing
     * the popout with a fadeIn effect and hiding it with a fadeOut effect
     */
    Oryzone.PopoutAnimation.fade = function()
    {
        return $.extend({}, new Oryzone.PopoutAnimation.none(), {
           
           beforeOpen : function(){},

           open : function(afterAnimation){
               this.element.css({
                    left    : this.position[0] + "px",
                    top     : this.position[1] + "px"
                });
               this.element.fadeIn(
                    this.options.animationSpeed,
                    this.options.animationEasing,
                    afterAnimation   
               );
           },

           beforeClose : function(){},

           close : function(afterAnimation){
               var self = this;
               this.element.fadeOut(
                    this.options.animationSpeed,
                    this.options.animationEasing,
                    function(){
                        self.element.css('display', self.options.displayOff);
                        afterAnimation();
                    }
               );
           } 
        });
    };
    
    /**
     * @class expand animation class.
     */
    Oryzone.PopoutAnimation.expand = function()
    {
        return $.extend({}, new Oryzone.PopoutAnimation.none(), {
           
           beforeOpen : function(){
               if("undefined" == typeof this.elementHeight)
               {
                   this.elementHeight = this.element.height();
                   this.elementWidth = this.element.width();
                   this.elementPaddingTop = this.element.css("paddingTop");
                   this.elementPaddingRight = this.element.css("paddingRight");
                   this.elementPaddingBottom = this.element.css("paddingBottom");
                   this.elementPaddingLeft = this.element.css("paddingLeft");
               }
           },

           open : function(afterAnimation){
               this.element.css({
                    left    : this.position[0] + "px",
                    top     : this.position[1] + "px",
                    display : this.options.displayOn,
                    height  : 0,
                    width   : 0,
                    paddingTop : '0px',
                    paddingRight : '0px',
                    paddingBottom : '0px',
                    paddingLeft : '0px'
                });
               this.element.stop().animate(
                    {
                        height : this.elementHeight,
                        width : this.elementWidth,
                        paddingTop : this.elementPaddingTop,
                        paddingRight : this.elementPaddingRight,
                        paddingBottom : this.elementPaddingBottom,
                        paddingLeft : this.elementPaddingLeft
                    },
                    this.options.animationSpeed,
                    this.options.animationEasing,
                    afterAnimation
               );
           },

           beforeClose : function(){},

           close : function(afterAnimation){
               var self = this;
               this.element.stop().animate(
                    {
                        height: 0,
                        width : 0,
                        paddingTop : '0px',
                        paddingRight : '0px',
                        paddingBottom : '0px',
                        paddingLeft : '0px'
                    },
                    this.options.animationSpeed,
                    this.options.animationEasing,
                    function(){
                        self.element.css({
                            'display'       : self.options.displayOff,
                            'height'        : self.elementHeight,
                            'width'         : self.elementWidth,
                            'paddingTop'    : self.elementPaddingTop,
                            'paddingRight'  : self.elementPaddingRight,
                            'paddingBottom' : self.elementPaddingBottom,
                            'paddingLeft'   : self.elementPaddingLeft
                        });
                        afterAnimation();
                    }
               );
           }
           
        });
    }
    
    /**
     * The set of default options
     * @name DefaultOptions
     * @memberOf $.fn.popout
     */
    var defaults =
    {
        'button'            : '.popout-button',     // the selector to use to identify the popout button
        'content'           : '.popout-content',    // the selector to use to identify the popout content
        'closeButton'       : '.popout-close',      // the selector to use to identify the popout close button
        'openClass'         : 'popout-open',        // the name of the class to attach to the currently opened popouts
        'openOnHover'       : false,                // if true opens the popout when hovering its related button
        'openOnClick'       : true,                 // if true opens the popout when clicking its related button
        'closeOnHoverOut'   : true,                 // if true closes the popout when hovering out from the related button
        'closeOnClickOut'   : false,                // if true closes the popout when clicking its related button
        'closeDelay'        : 500,                  // the amount of time to wait before closing the popoun after an hover out
        'useCloseButton'    : true,                 // if true enables the close button for a popout (if any)
        'z-index'           : 9999,                 // the z-index assigned to the popout content
        'contentPosition'   : 'absolute',           // the css position attribute to give to the popout content
        'displayOn'         : 'block',              // the css display attribute to give to visible popout content
        'displayOff'        : 'none',               // the css display attribute to give to invisible popout content
        'position'          : 'data',               // the relative position of the popout content (relative to the popout button anchor)
        'anchor'            : 'data',               // the anchor point of the content on the popout button
        'distance'          : 'data',               // an additional distance to add to space the popout content out from its button
        'defaultPosition'   : 'SW',                 // the default position
        'defaultAnchor'     : 'NW',                 // the default anchor
        'defaultDistance'   : 0,                    // the default distance
 	'animation'         : 'none',               // the animation to use ('none', 'slide', 'fade', 'expand' or provide a custom animation object)
        'animationSpeed'    : 'fast',               // the animation speed
        'animationEasing'   : 'swing'               // the animation easing
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
    
    // normalizes the animation parameter by instancing the right animation object
    // if a generic string is given
    var normalizeAnimation = function(animation)
    {
        if('string' == typeof animation)
        {
            switch(animation.toLowerCase())
            {
                case "none":
                    return new Oryzone.PopoutAnimation.none();
                    break;
                case "slide":
                    return new Oryzone.PopoutAnimation.slide();
                    break;
                case "fade":
                    return new Oryzone.PopoutAnimation.fade();
                    break;
                case "expand":
                    return new Oryzone.PopoutAnimation.expand();
                    break;
                default :
                    throw "InvalidArgumentException: '" + animation + "' is not a valid animation";
            }
        }
        
        if(!(animation.beforeOpen && "function" == typeof animation.beforeOpen &&
             animation.open && "function" == typeof animation.open &&
             animation.beforeClose && "function" == typeof animation.beforeClose &&
             animation.close && "function" == typeof animation.close &&
             animation.setPosition && "function" == typeof animation.setPosition &&
             animation.setElement && "function" == typeof animation.setElement &&
             animation.setOptions && "function" == typeof animation.setOptions))
            throw "InvalidArgumentException: The given animation object is not a valid animation";
        
        return animation;
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
    
    /**
     * Initializes the plugin on one or more DOM elements:
     * @example $(selector).popout(options)
     * 
     * @param options an object containing the options
     */
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
    
    /**
     * retrieves the first instance of the popout attached to the list of 
     * elements retrieved by a selector (if any)
     */
    $.fn.popoutInstance = function()
    {
        return getInstance(this);
    }
    
    // utility function to raise events
    var raiseEvent = function(eventName, $this)
    {
        $this.container.trigger("Oryzone_popout_" + eventName, [$this.container, $this]);
    };
    
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
        
        if(this.isOpen() && this.options.closeOnHoverOut)
            this.delayedClose();
    };
    
    // defines the Popout prototype
    $.extend(Oryzone.Popout.prototype, {
        /** @lends Oryzone.Popout */
        
        /** the name of the instance */
        name: "oryzone_popout",
        
        /** the current version */
        version: 1.0,
        
        /** 
         * Initializes the object
         * @constructs
         * @param el {DomElement} the referred DOM element
         * @param options the set of options
         */
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
            this.options.animation = normalizeAnimation(this.options.animation);
            
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
        
        /**
         * Destroys the current instance releasing the related DOM element
         */
        destroy : function()
        {
            this.teardown();
        },
        
        // removes all the functionalities of the plugin
        teardown : function()
        {
            raiseEvent("destroying", this);
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
            raiseEvent("destroyed", this);
        },
        
        /** checks if the current popout is opened */
        isOpen : function()
        {
            return this.content.hasClass(this.options.openClass);
        },

        /** opens the popout element */
        open : function()
        {
            var self = this;
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
                
            this.options.animation.setPosition(pos);
            this.options.animation.setElement(this.content);
            this.options.animation.setOptions(this.options);
            this.options.animation.beforeOpen();
            raiseEvent("opening", this);

            if(this.options.closeOnClickOut)
                $.proxy(createGlassPane, this)();
            
            this.content.addClass(this.options.openClass);

            this.content.addClass(this.options.openClass);
            this.options.animation.open(function(){
                raiseEvent("opened", self);
            });
            
            return this;
        },

        /** closes the popout element */
        close : function()
        {            
            var self = this;
            this.options.animation.beforeClose();
            raiseEvent("closing", this);
            $.proxy(destroyGlassPane, this)();
            this.cancelDelayedClose();
            this.content.removeClass(this.options.openClass);
            this.options.animation.close(function(){
               raiseEvent("closed", self); 
            })
            
            return this;
        },

        /** open the popout if closed and closes it otherwise */
        toggle : function()
        {
            if(this.isOpen())
                this.close();
            else
                this.open();

            return this;
        },

        /** closes the popout after `delay` millisecs */
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

        /** cancel the delay close timeout (avoid closing the popout) */
        cancelDelayedClose : function()
        {            
            if(this._private.timeout)
                clearTimeout(this._private.timeout);

            return this;
        }
        
    });
     
})(jQuery);