async function initMap() {


    const api_url = 'https://raw.githubusercontent.com/kiang/pharmacies/master/json/points.json?fbclid=IwAR3Owu0eV4q0oSFWq5owQrpSPaJq9K1BP53Y-t6yixEXPre8BV_AQccarEU'
    const setting = await axios.get('/map-setting.json')
    const result = await axios.get(api_url)
    const mapConfig = {
        center: { lat: 25.052518, lng: 121.526219 },
        zoom: 17,
        styles: setting.data,
        disableDefaultUI: true
    }
    let map, service, info, timer, circle, coordinates, searchMarker, activeInfoWindow, str
    let filterData = []
    let markerAry = []
    info = new google.maps.InfoWindow();
    map = new google.maps.Map(document.getElementById('map'), mapConfig)
    service = new google.maps.places.PlacesService(map);
    const sidebar = document.querySelector('.sidebar')
    const toggleBtn = document.querySelector('.toggle-btn')
    const rangeSilder = document.querySelector('.range-silder > input')
    const searchBtn = document.querySelector('.search-bar > button')
    const searchBar = document.querySelector('.search-bar > input')
    const renderResult = document.querySelector('.result')
    const shadow = document.querySelector('.shadow')
    const shadowBtn = document.querySelector('.shadow-btn')
    renderResult.style.maxHeight = `${window.innerHeight - 210 - 40}px`

    function infoTemplate({ name, address, mask_adult, mask_child, updated }) {
        return `<div>
         <ul>
           <li>店家名稱: ${name}</li>
           <li>成人口罩: <span class="text-red">${mask_adult}</span></li>
           <li>孩童口罩: <span class="text-red">${mask_child}</span></li>
           <li>地址: ${address}</li>
           <li>最後更新時間: ${updated == '' ? '未知' : updated}</li>
         </ul>
      </div>`
    }

    function markerHandler({ lat, lng }, isDefalutIcon, { mask_adult, mask_child }) {
        let setting = {
            position: { lat, lng },
            map: map,
            icon: mask_adult == 0 && mask_child == 0 ? '/img/empty.png' : '/img/store.png'
        }
        isDefalutIcon ? delete setting.icon : setting
        return new google.maps.Marker(setting)
    }

    function removeMarkerHandler() {
        circle.setMap(null)
        searchMarker.setMap(null)
        markerAry.forEach(item => item.setMap(null))
        markerAry = []
        filterData = []
    }

    function circleHadler({ lat, lng }, range) {
        return new google.maps.Circle({
            map: map,
            radius: parseInt(range, 10),
            center: { lat, lng },
            strokeColor: '#FF0000',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: '#f99696',
            fillOpacity: 0.35,
        });
    }

    function filterDataHandler(coordinates) {
        str = ''
        if (searchMarker || markerAry.length > 0) removeMarkerHandler()
        circle = circleHadler(coordinates, rangeSilder.value)
        searchMarker = markerHandler(coordinates, true, { mask_adult: 0, mask_child: 0 })
        map.setCenter(coordinates)
        result.data.features.forEach(item => {
            let targetGeo = new google.maps.LatLng({
                lat: item.geometry.coordinates[1],
                lng: item.geometry.coordinates[0],
            })
            let compareGeo = new google.maps.LatLng(coordinates)
            let distance = google.maps.geometry.spherical.computeDistanceBetween(compareGeo, targetGeo)
            if (distance < parseInt(rangeSilder.value, 10)) {
                item.distance = distance
                filterData.push(item)
            }
        })
        filterData.forEach(item => {
            str += infoTemplate(item.properties)
            var infowindow = new google.maps.InfoWindow({
                content: infoTemplate(item.properties)
            });
            let marker = markerHandler({
                lat: item.geometry.coordinates[1],
                lng: item.geometry.coordinates[0]
            }, false, item.properties)
            marker.addListener('click', function () {
                if (activeInfoWindow) activeInfoWindow.close()
                infowindow.open(map, marker);
                activeInfoWindow = infowindow
            });
            markerAry.push(marker)
        })
        renderResult.innerHTML = str
        sidebar.classList.remove('open')
    }

    function searchHandler() {
        if (searchBar.value == '') return alert('請輸入地址')
        let request = {
            query: searchBar.value.trim(),
            fields: ['name', 'geometry'],
        };
        service.findPlaceFromQuery(request, function (results, status) {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                coordinates = {
                    lat: results[0].geometry.location.lat(),
                    lng: results[0].geometry.location.lng()
                }
                filterDataHandler(coordinates)
            }
        });
    }

    google.maps.event.addListener(map, 'click', function (event) {
        startLocation = event.latLng;
        filterDataHandler({ lat: startLocation.lat(), lng: startLocation.lng() })
    });

    rangeSilder.addEventListener('input', function () {
        if (!searchBar.value || !coordinates) {
            return alert('請先輸入搜尋地址')
        }
        clearTimeout(timer)
        timer = setTimeout(() => {
            circle.setMap(null)
            circle = circleHadler(coordinates, rangeSilder.value)
            searchHandler()
        }, 500)
        document.querySelector('.range-text').textContent = `搜索距離：${rangeSilder.value}公尺`
    })

    toggleBtn.addEventListener('click', function () {
        if (sidebar.classList.contains('open')) {
            toggleBtn.textContent = "<"
        } else {
            toggleBtn.textContent = ">"
        }
        sidebar.classList.toggle('open')
    })

    shadow.addEventListener('click', function () {
        shadow.classList.add('hide')
    })

    shadowBtn.addEventListener('click', function () {
        shadow.classList.add('hide')
    })

    window.addEventListener('keydown', function (e) {
        if (e.keyCode == 13) searchHandler()
    })

    searchBtn.addEventListener('click', searchHandler)
}