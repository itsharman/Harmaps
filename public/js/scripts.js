/* global google */
/* global _ */
/**
 * scripts.js
 *
 * Harman M. Singh
 * Computer Science 50
 * Problem Set 8
 *
 * Global JavaScript.
 */

// Google Map
var map;

// markers for map
var markers = [];

// info window
var info = new google.maps.InfoWindow();

// execute when the DOM is fully loaded
$(function() {

    // styles for map
    // https://developers.google.com/maps/documentation/javascript/styling
    var styles = [

        // hide Google's labels -- I decided to turn this feature on for aesthetic purposes (feels more complete) -- part of personal touch (1/3)
        //also added coloring options
        {
            featureType: "all",
            elementType: "labels",
            stylers: [
                {visibility: "on"},
                // {hue: "#000000"}
                // {saturation: 60},
                // {lightness: -20},
                // {gamma: 1.51}
            ]
        },

        // hide roads -- I decided to turn this feature on for aesthetic purposes (feels more complete) -- part of personal touch (2/3)
        //also added coloring options
        {
            featureType: "road",
            elementType: "geometry",
            stylers: [
                {visibility: "on"},
                {hue: "#00d4ff"},
                {saturation: 60},
                {lightness: -20},
                {gamma: 1.51}
            ]
        }

    ];

    // options for map
    // https://developers.google.com/maps/documentation/javascript/reference#MapOptions
    var options = {
        center: {lat: 41.3184, lng: -72.9318}, // Yale, Connecticut
        disableDefaultUI: true,
        //my personal touch (3/3) -- changing look of Google Maps to Hybrid view (I also added road and labels visibility above with coloring options)
        mapTypeId: google.maps.MapTypeId.HYBRID,
        maxZoom: 100,
        panControl: true,
        styles: styles,
        zoom: 13,
        zoomControl: true
        };

    // get DOM node in which map will be instantiated
    var canvas = $("#map-canvas").get(0);

    // instantiate map
    map = new google.maps.Map(canvas, options);

    // configure UI once Google Map is idle (i.e., loaded)
    google.maps.event.addListenerOnce(map, "idle", configure);

});

/**
 * Adds marker for place to map.
 */
function addMarker(place)
{
    // given a place (postal code and more), add a marker (ie: icon) to the map
    
    //latitude and longitude of place
    var myLatlng = new google.maps.LatLng (place.latitude,place.longitude);
    
    //create marker
    var marker = new google.maps.Marker ({
        position: myLatlng,
        title: place.place_name,
        map: map
    });
    
    //ability to customize map options -- doesn't do much for me, but was included in Google's example code (already implemented earlier on)
    // var mapOptions = {
    //     zoom: 4,
    //     center: myLatlng
    // }

    //get JSON object
    // $.getJSON ('articles.php', function (articles) { //didn't work
    // $.getJSON ('articles.php', {geo: place.place_name}, function (articles) { //shows less results than postal_code
    $.getJSON ('articles.php', {geo: place.postal_code}, function (articles) {
        //if there are no articles for a place_name, return false
        if ($.isEmptyObject (articles)) return false;
        //else display news in bulleted format
        else {
            var news = "";
            //iterate through articles found and place them in bulleted format
            for (var i = 0, n = articles.length; i < n; i++) {
                news += "<li><a target = 'NEW' href ='" + articles[i].link + "'>" + articles[i].title + "</a></li>";
            }
            //open news in new tab
            var clickme = new google.maps.event.addListener (marker, 'click', function() { 
                showInfo (marker, news);
            });
        }
    });
    //display markers
    markers.push(marker);
}

/**
 * Configures application.
 */
function configure()
{
    // update UI after map has been dragged
    google.maps.event.addListener(map, "dragend", function() {
        update();
    });

    // update UI after zoom level changes
    google.maps.event.addListener(map, "zoom_changed", function() {
        update();
    });

    // remove markers whilst dragging
    google.maps.event.addListener(map, "dragstart", function() {
        removeMarkers();
    });

    // configure typeahead
    // https://github.com/twitter/typeahead.js/blob/master/doc/jquery_typeahead.md
    $("#q").typeahead({
        autoselect: true,
        highlight: true,
        minLength: 1
    },
    {
        source: search,
        templates: {
            empty: "no places found yet",
            suggestion: _.template("<p><%- place_name %>, <%- admin_name1 %>, <%- postal_code %> </p>")
        }
    });

    // re-center map after place is selected from drop-down
    $("#q").on("typeahead:selected", function(eventObject, suggestion, name) {

        // ensure coordinates are numbers
        var latitude = (_.isNumber(suggestion.latitude)) ? suggestion.latitude : parseFloat(suggestion.latitude);
        var longitude = (_.isNumber(suggestion.longitude)) ? suggestion.longitude : parseFloat(suggestion.longitude);

        // set map's center
        map.setCenter({lat: latitude, lng: longitude});

        // update UI
        update();
    });

    // hide info window when text box has focus
    $("#q").focus(function(eventData) {
        hideInfo();
    });

    // re-enable ctrl- and right-clicking (and thus Inspect Element) on Google Map
    // https://chrome.google.com/webstore/detail/allow-right-click/hompjdfbfmmmgflfjdlnkohcplmboaeo?hl=en
    document.addEventListener("contextmenu", function(event) {
        event.returnValue = true; 
        event.stopPropagation && event.stopPropagation(); 
        event.cancelBubble && event.cancelBubble();
    }, true);

    // update UI
    update();

    // give focus to text box
    $("#q").focus();
}

/**
 * Hides info window.
 */
function hideInfo()
{
    info.close();
}

/**
 * Removes markers from map.
 */
function removeMarkers()
{
    //need to modify global variable markers
    //https://developers.google.com/maps/documentation/javascript/markers
    //iterate through amount of markers
    for (var i = 0, n = markers.length; i < n; i++) {
        //remove marker icons from map
        markers[i].setMap(null);
        //set amount of markers to zero
        //markers[i].length = 0;
    }
    markers.length = 0;
}

/**
 * Searches database for typeahead's suggestions.
 */
function search(query, cb)
{
    // get places matching query (asynchronously)
    var parameters = {
        geo: query
    };
    $.getJSON("search.php", parameters)
    .done(function(data, textStatus, jqXHR) {

        // call typeahead's callback with search results (i.e., places)
        cb(data);
    })
    .fail(function(jqXHR, textStatus, errorThrown) {

        // log error to browser's console
        console.log(errorThrown.toString());
    });
}

/**
 * Shows info window at marker with content.
 */
function showInfo(marker, content)
{
    // start div
    var div = "<div id='info'>";
    if (typeof(content) === "undefined")
    {
        // http://www.ajaxload.info/
        div += "<img alt='loading' src='img/ajax-loader.gif'/>";
    }
    else
    {
        div += content;
    }

    // end div
    div += "</div>";

    // set info window's content
    info.setContent(div);

    // open info window (if not already open)
    info.open(map, marker);
}

/**
 * Updates UI's markers.
 */
function update() 
{
    // get map's bounds
    var bounds = map.getBounds();
    var ne = bounds.getNorthEast();
    var sw = bounds.getSouthWest();

    // get places within bounds (asynchronously)
    var parameters = {
        ne: ne.lat() + "," + ne.lng(),
        q: $("#q").val(),
        sw: sw.lat() + "," + sw.lng()
    };
    $.getJSON("update.php", parameters)
    .done(function(data, textStatus, jqXHR) {

        // remove old markers from map
        removeMarkers();

        // add new markers to map
        for (var i = 0; i < data.length; i++)
        {
            addMarker(data[i]);
        }
     })
     .fail(function(jqXHR, textStatus, errorThrown) {

         // log error to browser's console
         console.log(errorThrown.toString());
     });
}