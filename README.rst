jQuery popOut
=============

jQuery popOut is a plugin that easily allows you to create popout elements such as **dropdown** menus, **tooltips**, **megamenus**, **popovers** and so much more. The usage is very simple but its behavior can be heavily configured to obtain the maximum flexibility.


A jQuery popOut primer
----------------------

jQuery popOut requires you to use a certain DOM structure to create popOut elements. The basic approach needs 3 DOM elements:

  * **a container** (which, obviously, contains the next two elements)
  * **a sensible area** (also called "button", sensible to click and/or hover)
  * **the popout content** (your megamenu, tooltip, etc...)

So here it comes a first example:

::

	<div class="popout-area">
		<a href="#" class="popout-button">Click me, tease me!</a>
		<div class="popout-content">
			Hello World!
		</div>
	</div>
	
The outer div (class *popout-area*) is the container, *popout-button* is the sensible area, and, finally, *popout-content* is the content the will be shown as popout (it should be initially hidden).

Once you got this markup (supposing you have added jQuery and jQuery popout to your web page scripts) you can easily makes it functional by just using one line of javascript code:

::

	$('.popout-area').popout();
	

What's else?
------------

To come soon, stay tuned ;)
