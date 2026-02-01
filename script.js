let map;
let userMarker;
let markers = [];

navigator.geolocation.getCurrentPosition(
  pos => initMap(pos.coords.latitude, pos.coords.longitude),
  () => initMap(28.6139, 77.2090) // fallback (Delhi)
);

function initMap(lat, lon) {
  map = L.map("map").setView([lat, lon], 14);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap"
  }).addTo(map);

  userMarker = L.marker([lat, lon])
    .addTo(map)
    .bindPopup("📍 Your Location")
    .openPopup();
}

function findPlaces() {
  clearMarkers();
  document.getElementById("results").innerHTML = "Loading...";
  const radius = document.getElementById("radius").value;

  const type = document.getElementById("placeType").value;
  const { lat, lng } = userMarker.getLatLng();

  const query = `
    [out:json];
    (
    node["amenity"="${type}"](around:${radius},${lat},${lng});
    );
    out center;
  `;

  fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: query
  })
    .then(res => res.json())
    .then(data => showPlaces(data.elements))
    .catch(() => {
      document.getElementById("results").innerHTML =
        "❌ Failed to fetch places";
    });
}

function showPlaces(places) {
  const results = document.getElementById("results");
  results.innerHTML = "";

  if (!places.length) {
    results.innerHTML = "No places found nearby.";
    return;
  }

  places.forEach(p => {
    if (!p.tags || !p.tags.name) return;

    const marker = L.marker([p.lat, p.lon])
      .addTo(map)
      .bindPopup(p.tags.name);

    markers.push(marker);

    const div = document.createElement("div");
    div.className = "card";
    const dist = getDistance(
  userMarker.getLatLng().lat,
  userMarker.getLatLng().lng,
  p.lat,
  p.lon
).toFixed(0);

div.innerHTML = `
  <b>${p.tags.name}</b><br>
  📏 ${dist} meters away
`;
    results.appendChild(div);
  });
}

function clearMarkers() {
  markers.forEach(m => map.removeLayer(m));
  markers = [];
}
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const toRad = d => d * Math.PI / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

