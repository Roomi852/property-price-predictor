document.addEventListener('DOMContentLoaded', () => {
  fetch('property_data.json')
    .then(res => res.json())
    .then(data => {
      window.propertyData = data;

      setPriceRange(data);
      populateFilters(data);
      displayProperties(data);
      setupDependentDropdowns();
    })
    .catch(err => console.error(err));

  document.getElementById('searchInput').addEventListener('input', filterProperties);
});

// Set dynamic min/max price
function setPriceRange(data) {
  const prices = data.map(p => p.price);
  const minPriceInput = document.getElementById('min_price');
  const maxPriceInput = document.getElementById('max_price');

  const minPrice = Math.floor(Math.min(...prices));
  const maxPrice = Math.ceil(Math.max(...prices));

  minPriceInput.value = minPrice;
  minPriceInput.min = minPrice;
  minPriceInput.max = maxPrice;

  maxPriceInput.value = maxPrice;
  maxPriceInput.min = minPrice;
  maxPriceInput.max = maxPrice;
}

// Populate dropdowns
function populateFilters(data) {
  const totalSqftSelect = document.getElementById('total_sqft');
  const bedroomsSelect = document.getElementById('bedrooms');
  const bathroomsSelect = document.getElementById('bathrooms');
  const locationSelect = document.getElementById('location');

  const uniqueTotalSqft = [...new Set(data.map(p => p.total_sqft))].sort((a,b)=>a-b);
  uniqueTotalSqft.forEach(sqft => totalSqftSelect.append(new Option(sqft, sqft)));

  const uniqueBedrooms = [...new Set(data.map(p => p.bedrooms))];
  uniqueBedrooms.forEach(bhk => bedroomsSelect.append(new Option(bhk, bhk)));

  const uniqueBathrooms = [...new Set(data.map(p => p.bathrooms))];
  uniqueBathrooms.forEach(bath => bathroomsSelect.append(new Option(bath, bath)));

  const uniqueLocations = [...new Set(data.map(p => p.location))];
  uniqueLocations.forEach(loc => locationSelect.append(new Option(loc, loc)));
}

// Smart dropdowns: update options based on other selections
function setupDependentDropdowns() {
  ['total_sqft', 'bedrooms', 'bathrooms', 'location'].forEach(id => {
    document.getElementById(id).addEventListener('change', updateDropdowns);
  });
}

function updateDropdowns() {
  let filtered = [...window.propertyData];

  const totalSqft = document.getElementById('total_sqft').value;
  const bedrooms = document.getElementById('bedrooms').value;
  const bathrooms = document.getElementById('bathrooms').value;
  const location = document.getElementById('location').value;

  if(totalSqft) filtered = filtered.filter(p => p.total_sqft == totalSqft);
  if(bedrooms) filtered = filtered.filter(p => p.bedrooms == bedrooms);
  if(bathrooms) filtered = filtered.filter(p => p.bathrooms == bathrooms);
  if(location) filtered = filtered.filter(p => p.location == location);

  populateFilteredOptions('total_sqft', filtered.map(p => p.total_sqft));
  populateFilteredOptions('bedrooms', filtered.map(p => p.bedrooms));
  populateFilteredOptions('bathrooms', filtered.map(p => p.bathrooms));
  populateFilteredOptions('location', filtered.map(p => p.location));
}

function populateFilteredOptions(id, optionsArray) {
  const select = document.getElementById(id);
  const currentValue = select.value;
  select.innerHTML = '<option value="">All</option>';
  [...new Set(optionsArray)].forEach(val => {
    const option = new Option(val, val);
    if(val == currentValue) option.selected = true;
    select.appendChild(option);
  });
}

// Filter properties
function filterProperties() {
  let filtered = [...window.propertyData];

  const totalSqft = document.getElementById('total_sqft').value;
  const bedrooms = document.getElementById('bedrooms').value;
  const bathrooms = document.getElementById('bathrooms').value;
  const location = document.getElementById('location').value;
  const minPrice = parseFloat(document.getElementById('min_price').value) || 0;
  const maxPrice = parseFloat(document.getElementById('max_price').value) || 999999;
  const sortPrice = document.getElementById('sort_price').value;
  const searchText = document.getElementById('searchInput').value.toLowerCase();

  if(totalSqft) filtered = filtered.filter(p => p.total_sqft == totalSqft);
  if(bedrooms) filtered = filtered.filter(p => p.bedrooms == bedrooms);
  if(bathrooms) filtered = filtered.filter(p => p.bathrooms == bathrooms);
  if(location) filtered = filtered.filter(p => p.location == location);

  filtered = filtered.filter(p => p.price >= minPrice && p.price <= maxPrice);

  if(searchText) {
    filtered = filtered.filter(p =>
      (p.location && p.location.toLowerCase().includes(searchText)) ||
      (p.society && p.society.toLowerCase().includes(searchText))
    );
  }

  if(sortPrice === 'low') filtered.sort((a,b) => a.price - b.price);
  else filtered.sort((a,b) => b.price - a.price);

  displayProperties(filtered, searchText);
}

// Display properties
function displayProperties(properties, searchText='') {
  const grid = document.getElementById('propertyGrid');
  grid.innerHTML = '';

  if(properties.length === 0) {
    grid.innerHTML = '<p style="text-align:center; font-weight:bold;">No properties found.</p>';
    return;
  }

  properties.forEach(p => {
    const card = document.createElement('div');
    card.className = 'property-card';

    const locationHighlighted = searchText ? highlightText(p.location, searchText) : p.location;
    const societyHighlighted = searchText ? highlightText(p.society || 'N/A', searchText) : (p.society || 'N/A');

    card.innerHTML = `
      <img src="${p.image}" alt="${p.location}">
      <div class="property-details">
        <h3>${locationHighlighted} - ${p.bedrooms} - ₹${p.price} Lakhs</h3>
        <p>Area Type: ${p.area_type}</p>
        <p>Bathrooms: ${p.bathrooms} | Balcony: ${p.balcony}</p>
        <p>Availability: ${p.availability}</p>
        <p>Society: ${societyHighlighted}</p>
      </div>
    `;
    grid.appendChild(card);
  });
}

// Highlight search text
function highlightText(text, searchText) {
  const re = new RegExp(`(${searchText})`, 'gi');
  return text.replace(re, '<span class="highlight">$1</span>');
}

// Reset filters
function resetFilters() {
  document.getElementById('propertyForm').reset();
  setPriceRange(window.propertyData); // reset min/max price to original
  populateFilters(window.propertyData); // reset dropdowns
  displayProperties(window.propertyData); // show all properties
}
