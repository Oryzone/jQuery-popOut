/* Author: Luciano Mammino
*/

(function($){

	var $sidebar   = $("#sidebar .fixed"),
        $window    = $(window),
        offset     = $sidebar.offset(),
        topPadding = 20;

	$sidebar.css("position", "relative");

    $window.scroll(function() {
        if ($window.scrollTop() > offset.top) {
            $sidebar.stop().animate({
                marginTop: $window.scrollTop() - offset.top + topPadding
            });
        } else {
            $sidebar.stop().animate({
                marginTop: 0
            });
        }
    });

})(jQuery);























