 const socket = io();
        let startLatLng = null; // Define startLatLng in the outer scope
        let lastMarker = null; // Track the last added marker
        let routingCtl = null //to track the route

        if (navigator.geolocation) {
            navigator.geolocation.watchPosition(
                (position) => {
                    const { longitude, latitude } = position.coords;
                    console.log('Current Position:', latitude, longitude);
                    socket.emit('send-location', { latitude, longitude });
                },
                (error) => {
                    console.error(error);
                },
                {
                    enableHighAccuracy: false,
                    timeout: 5000,
                    maximumAge: 0
                }
            );
        }

        const map = L.map('map').setView([27.700769, 85.300140], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

        const markers = {};

        socket.on('location', (data) => {
            const { id, longitude, latitude } = data;
            map.panTo([latitude, longitude]); // Smoother movement

            // Add marker for the location
            if (markers[id]) {
                markers[id].setLatLng([latitude, longitude]);
            } else {
                markers[id] = L.marker([latitude, longitude]).addTo(map)
            }

            // Update startLatLng with the new position
            startLatLng = L.latLng(latitude, longitude);
        });

        map.on('click', function(ev) {
            if (startLatLng) { // Ensure startLatLng is set
                const lat = ev.latlng.lat;
                const lng = ev.latlng.lng;
                const endLatLng = L.latLng(lat, lng);

                // Remove the last marker if it exists and matches the clicked location
                if (lastMarker) {
                    const lastLatLng = lastMarker.getLatLng();
                    if (lastLatLng.lat.toFixed(3) === endLatLng.lat.toFixed(3) &&
                        lastLatLng.lng.toFixed(3) === endLatLng.lng.toFixed(3)) {
                        
                        map.removeLayer(lastMarker);
                        lastMarker = null;
                        if (routingCtl) {
                            map.removeControl(routingCtl)
                            routingCtl = null
                        }
                        return;
                    }
                }

                // Add new marker for the end point
                lastMarker = L.marker(endLatLng).addTo(map).bindPopup('End Point').openPopup();

                // Create routing control to show the route
                routingCtl = L.Routing.control({
                    waypoints: [
                        startLatLng, // Start location
                        endLatLng  // End location
                    ],
                    routeWhileDragging: true
                }).addTo(map);

                // Calculate the distance between start and end points
                const distance = startLatLng.distanceTo(endLatLng);
                document.getElementById('distance').innerHTML = `Distance: ${Math.round(distance)} meters`;

                console.log('Distance:', Math.round(distance));
            } else {
                console.log('Start point not defined.');
            }
        });

        socket.on('user-disconnect', (id) => {
            if (markers[id]) {
                map.removeLayer(markers[id]);
                delete markers[id];
            }
        });