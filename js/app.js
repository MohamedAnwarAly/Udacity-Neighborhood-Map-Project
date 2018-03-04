
var locations = [
    {
        name: "Kungliga slottet",
        coordinates: {
            lat: 59.326822,
            lng: 18.071719
        },
        marker: null
    },
    {
        name: "First Hotel Reisen",
        coordinates: {
            lat: 59.325436,
            lng: 18.075385
        },
        marker: null
    },
    {
        name: "Storkyrkan",
        coordinates: {
            lat: 59.325786,
            lng: 18.070421
        },
        marker: null
    },
    {
        name: "Nobelmuseet",
        coordinates: {
            lat: 59.325331,
            lng: 18.070825
        },
        marker: null
    },
    {
        name: "Tyska kyrkan",
        coordinates: {
            lat: 59.324139,
            lng: 18.071779
        },
        marker: null
    },
    {
        name: "Stortorget",
        coordinates: {
            lat: 59.325125,
            lng: 18.070804
        },
        marker: null
    }
];

var ViewModel = function () {
    var self = this;
    var filterResult;
    // An observable array for our locations.
    this.famousLocations = ko.observableArray(locations);
    // An observable to hold our filter string.
    this.filter = ko.observable("");
    this.displayFilteredMarkers = ko.observable();

    // The computed observable responsible for filtering the list.
    // attributes: https://www.codeproject.com/Articles/822879/Searching-filtering-and-sorting-with-KnockoutJS-in.
    this.filteredLocations = ko.computed(function () {
        if (!self.filter()) {
            filterResult = self.famousLocations();
        } else {
            filterResult = ko.utils.arrayFilter(self.famousLocations(), function (location) {
                return (
                    (self.filter().length === 0 || location.name.toLowerCase().indexOf(self.filter().toLowerCase()) > -1)
                );
            });
        }

        //  Update the map markers when a filter is apllied.
        self.displayFilteredMarkers(filterResult, self.famousLocations());

        return filterResult;
    });

    // A function responsible for updating the map to display only the filtered markers.
    this.displayFilteredMarkers = function (filteredLocationsArray, LocationsArray) {
        for (let i = 0; i < LocationsArray.length; i++) {
            if (LocationsArray[i].marker !== null) {
                LocationsArray[i].marker.setMap(null);
            }
        }

        for (let i = 0; i < filteredLocationsArray.length; i++) {
            if (LocationsArray[i].marker !== null) {
                filteredLocationsArray[i].marker.setMap(map);
            }
        }
    };

    // A function for handling the click event of the list items.
    this.displayInfoWindow = function (location) {
        if (location.marker !== null) {
            populateInfoWindow(location.marker, largeInfowindow, location);
        }
    };
};

ko.applyBindings(new ViewModel());

// Variables for holding the necessary infos needed to set up the Google maps API data.
var map;
var largeInfowindow;
var bounds;
var markers = [];

// A function responsible for setting up the map and markers.
function initMap() {
    // Constructor creates a new map.
    map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: 59.326822,
            lng: 18.071719
        },
        zoom: 13
    });

    largeInfowindow = new google.maps.InfoWindow();
    bounds = new google.maps.LatLngBounds();

    // Creating markers and their properties.
    for (var i = 0; i < locations.length; i++) {

        // Get the position from the locations array.
        var position = locations[i].coordinates;
        var title = locations[i].name;

        // Create a marker per location, and put it into markers array.
        var marker = new google.maps.Marker({
            map: map,
            position: position,
            title: title,
            animation: google.maps.Animation.DROP,
            id: i
        });

        // Push the marker to our array of markers and to the property of the corresponding location.
        markers.push(marker);
        locations[i].marker = marker;

        // Create an onclick event to open an infowindow at each marker.
        marker.addListener('click', populateInfoWindow.bind(null, marker, largeInfowindow, locations[i]));

        bounds.extend(markers[i].position);
    }

    // Extend the boundaries of the map for each marker.
    map.fitBounds(bounds);
}

// A function responsible for animating the marker.
function toggleBounce(marker) {
    if (marker.getAnimation() !== null) {
        marker.setAnimation(null);
    } else {
        marker.setAnimation(google.maps.Animation.BOUNCE);
    }
}

// A variable to hold the API response data.
var APIResponse;

// This function populates the infowindow when the marker is clicked. We'll only allow
// one infowindow which will open at the marker that is clicked, and populate based
// on that marker's position.
function populateInfoWindow(marker, infowindow, location) {
    // AJAX request for the foursquare API.
    $.ajax({
        url: 'https://api.foursquare.com/v2/venues/explore',
        dataType: 'json',
        data: {
            client_id: "43TEFQV034WEQOFSMDHLLDRL2HDVSI5A1BQCL2DG5LUCFFQG",
            client_secret: "OSVD20T4JOX2JTBA3ADAXG2D1TXFLNEPZYUDNNBTAH4JEOVA",
            v: '20180304',
            ll: `${location.coordinates.lat},${location.coordinates.lng}`,
            query: location.name
        },
        success: function (data, textStatus, jqXHR) {
            APIResponse = data.response.groups[0].items[0].tips[0].text;
        },
        error: function (jqXHR, textStatus, errorThrown) {
            alert("Failed to fetch the details of the location from the Foursquare API.");
        }
    }).then(function () {
        // Check to make sure the infowindow is not already opened on this marker.
        if (infowindow.marker != marker) {
            infowindow.marker = marker;
            infowindow.setContent(`<div><b>${marker.title}<b></div><p>${APIResponse}</p>`);
            infowindow.open(map, marker);
            // Make sure the marker property is cleared if the infowindow is closed.
            infowindow.addListener('closeclick', function () {
                infowindow.marker = null;
            });
        }
        toggleBounce(marker);
        setTimeout(function () {
            marker.setAnimation(null);
        }, 1425);
    });
}

// A function to handle errors with the Google maps API.
function handleGoogleError() {
    alert("Oops! there was an error loading the Google Maps API");
}
