/* This upcoming script tag holds all of the functions and scripts that
will run. If something isn't in a function, it runs automatically on load.
Those are mostly global variable and CONSTANT definitions. If a variable's 
value is constant, it is declared in BLOCK_LETTERS (with underscores between
words). This is just a personal convention I use to avoid getting confused. 
if a variable's value can change, its written with the first
word beginning in lowercase, and the rest beginning upper, as in: helloThereYou. 
Sometimes i depart from this convention for various reasons. For this, I appologize. =)
	The functions only run when they're called, either by the html code above,
by another function, or by a user event like a click or zoom.
I am changing stuff */
		
////////////////////////////////////////////////////////////////////////////////
////					 DEFINE GLOBAL VARIABLES 		////
////										////
////	IF YOU'RE TRYING TO CHANGE THE FORMATTING / COLORS / STYLES /		////
////		DATASET IN THE EXISTING MAP, YOU SHOULD ONLY NEED TO CHANGE 	////
////		STUFF IN THIS SECTION. DON'T CHANGE ANYTHING ELSE IF YOU'RE	////
////		NOT SURE WHAT IT DOES!!!					////
////										////
////	IF YOU WANT TO CHANGE SOMETHING FUNDAMENTAL, LIKE WHICH VARIABLES 	////
////		CAN BE PLOTTED WITH THR DROPDOWN MENU, PLEASE REFFER TO THE 	////
////		TUTORIAL VIDEO POSTED ON TRELLO BEFORE PROCEEDING. 		////
////										////
////////////////////////////////////////////////////////////////////////////////

function setGlobals() {
	for (var k=0; k<BASE_URLS.length; k++) {  	// Grab all the icons with correct size. 
		BASE_ICONS[k] = L.icon({ 			// 	to be used when displaying the base markers
			iconUrl: BASE_URLS[k],
			iconSize: EXTRA_SMALL_ICON_SIZE
		});
		SPIDER_ICONS[k] = L.icon({ 			//	and the spidered markers
			iconUrl: SPIDER_URLS[k],
			iconSize: SMALL_ICON_SIZE
		});
		BASE_SPIDER_ICONS[k] = L.icon({		// 	and the markers at the base of the spider. 
			iconUrl: SPIDER_URLS[k],
			iconSize: LARGE_ICON_SIZE
		});
	};
	
	for (var i=0; i<HISTORICAL_BASE_URLS.length; i++) {
		for (var j=i; j<HISTORICAL_BASE_URLS[i].length; j++) {
			HISTORICAL_BASE_ICONS[i][j] = L.icon({
				iconUrl: HISTORICAL_BASE_URLS[i][j],	
				iconSize: SMALL_ICON_SIZE
			});
		}
	}
	
	X_ICON = L.icon({ 					// define an icon that can be clicked to close the spider
		iconUrl: X_URL,
		iconSize: SMALL_ICON_SIZE
	});
	
	for (var i=0; i<document.getElementsByName("no_data").length; i++) {
		document.getElementsByName("no_data")[i].innerHTML = "<b>"+NO_DATA_MSG+"</b>";
	}
	
	for (var i=0; i<document.getElementsByName("f").length; i++) {
		document.getElementsByName("f")[i].innerHTML = "<b>"+F_LABELS[i]+"</b>";
	}
	
	for (var i=0; i<document.getElementsByName("as").length; i++) {
		document.getElementsByName("as")[i].innerHTML = "<b>"+AS_LABELS[i]+"</b>";
	}
	
	for (var i=0; i<document.getElementsByName("risk").length; i++) {
		document.getElementsByName("risk")[i].innerHTML = RISK_LABELS[i];
	}
	
	for (var i=0; i<document.getElementsByName("contam_button").length; i++) {
		document.getElementsByName("contam_button")[i].innerHTML = CONTAMINANTS[i];
	}
	
	//document.getElementById("f_title").innerHTML = F_TITLE;
	//document.getElementById("as_title").innerHTML = AS_TITLE;
	//document.getElementById("risk_title").innerHTML = RISK_TITLE;
	document.getElementById("how_to_read").src = LEGEND_URL;
	document.getElementById("help_button").src = HELP_URL;
	
	document.getElementById("search").innerHTML = SEARCH_HELPER_TEXT;
	
	//document.getElementById("img-button-text").innerHTML = SATELLITE_MAP_VIEW;
	//document.getElementById("map-tile-selector").src = SATELLITE_TILE_THUMBNAIL_URL;
	
	document.getElementById("overlay_title").innerHTML = DISPLAY_TITLE;
	document.getElementById("overlay_msg").innerHTML = DISPLAY_MSG;
	$("#overlay").corner("keep 16px cc:#222");	// adjust inner border corners
	$("#overlay").css("display", "inline-block");	// display overlay once stuff loads!
	
}


////////////////////////////////////////////////////////////////////////////////
////					 INITIALIZATION FUNCTION 						  	////
//////////////////////////////////////////////////////////////////////////////// 

function init() {
	
	setGlobals();
	if (detectMobile()) {adjustDisplayForMobile();}
	initMap(); 					// Initialize and display the map object
	applyBaseMap(MAPBOX_STYLES["default"]); 			// Apply the base tiles to the map
	loadData(TOTAL_RISK); 	// Load the data for Fluoride (the default contaminant)  
	
	
}								

////////////////////////////////////////////////////////////////////////////////
////					  	initMap FUNCTION	 						  	////
//// 			This function initializes the global map object.			////
////////////////////////////////////////////////////////////////////////////////

function initMap() {
	map = new L.map('WaterMap', { //First, initialize the map
		center: MAP_CENTER,
		zoom: MAP_INIT_ZOOM,
		minZoom: MAP_MIN_ZOOM,
		maxZoom: MAP_MAX_ZOOM,
		attributionControl: true,
		fullscreenControl:true
	});	
	map.attributionControl.setPrefix(ATTRIBUTION);
	map.on('zoomstart', function() { 	// When the map zooms,
		if (spiderOpen) {				//	if some points are spidered open,
			closeSpider();				//	close them,
			spiderOpen = true;			//	but save the status that they were open.
		};
	});
	
	map.on('zoomend', function() {	 	// Then when the map finishes zooming,
		if (spiderOpen) {				// 	if there were previously spidered points open,
			openSpider(AllData, spiderOpenIndex, activeContaminant);
		};								// 	re-open the same points at the current zoom level. 
	});	
}

////////////////////////////////////////////////////////////////////////////////
////					  	applyBaseMap FUNCTION 						  	////
//// 	This function grabs a set of Stamen or Mapzen base tiles and 		////
//// 	applies them to the map. 											////
////////////////////////////////////////////////////////////////////////////////


function applyBaseMap(id) {
	if (TILE_LAYER) {							// If there is a tile layer
		var old_layer = TILE_LAYER;
	}
	
	/////////////////////////////////////////
	//mapbox.accessToken = MAPBOX_ACCESS_TOKEN; // These lines are to use Mapbox basemaps
	//TILE_LAYER = new L.mapbox.tileLayer(id);	// create the new layer
		
	TILE_LAYER = new L.StamenTileLayer("terrain");
	
	
		
	
	
	////////////////////////////////////////
	map.addLayer(TILE_LAYER, {});				// add the new layer
	CURRENT_TILE_ID = id;						// store the id of the current (new) layer
	
	
	if (old_layer) {							// if there was an old layer...
		map.removeLayer(old_layer);				// 	remove the old layer from underneath
	}
}


function loadData(contaminantToShow) {
	var url = DATA_URL;
	var options = {sendMethod: 'auto'};
	var query = new google.visualization.Query(url, options);
	query.setQuery('select * ORDER BY A DESC, B');				// Relies on A being date and B being name
	query.send(onQueryResponse);						
}

function onQueryResponse(response) {
	if(response.isError()) {
		throw new Error("data could not be retieved from Google sheets")
	} else {
		AllData = googleDataTable2JSON(response.getDataTable());	// convert data to json, store as global
		setupSearch();
		plotData(TOTAL_RISK);												// feed into plotting function											
	}
}

function googleDataTable2JSON(dataTable) {
numCols = dataTable.getNumberOfColumns();
	numRows = dataTable.getNumberOfRows();

	var data = [];										// initialze data array to hold json
	
	for(var i=0; i<numRows; i++) {						// loop through rows
		data.push({});									// on each row creating a new dictionary
		for(var j=0; j<numCols; j++) {					// and loop through each column of that row
			
			var lbl = dataTable.getColumnLabel(j);		// get the name of the column
			var value = dataTable.getValue(i,j);		// get cell's value
			if (!value) {								// if a value exists in the cell
				value = "";
			} 
			data[i][lbl] = value;						// store the "key: value" pair
		}
	}
	return data											// after all looping is done, return the finalized json
}

function plotData(contaminantToShow) {
	if (spiderOpen) {					// if there's a spider open, 
		closeSpider(); 					//	close the spider,
		spiderOpen = true;				//	but store that the spider is still open. 
	};									// (we'll open it back up later...)
	dup_indices = []; 					// reinitialize global dup_indices as an array
	points_valid = [];                                      // reinitialize global points_valid as an array
	if (activeContaminant == contaminantToShow) {
	} else { 							// if the currently-displayed contaminant is
										//	selected again, don't do anything! Otherwise:
		if (activeContaminant != NOT_PRESENT) { 	// if there's already a layer being displayed
			for (var l=0; l<base.Markers.length; l++) {
				if (base.Markers[l]){ 	// if a marker exists,
					map.removeLayer(base.Markers[l]);
				};						// clear it, to wipe the map clean. 
			};
			hideLegend();				// and then hide the legend. 

		};
		activeContaminant = contaminantToShow;  // Store the contaminant as a global
		adjustDDText(contaminantToShow); 		// Adjust the text in the drop down menu to display the current contaminant
		showLegend(contaminantToShow);			// And display the appropriate legend
	
		base = { 								// reinitialize the global variable base.
			Markers: [],						// to hold the leaflet marker objects
			Popups: [],							// to hold the popup object
			Bins: [],							// to hold the bin value, used for coloring the points
			Wells: [],			
			Index: []						
		};
		
		for (i=0;i<AllData.length;i++){ // check the validity of all the points at once
			points_valid.push(pointIsValid(i));
		}
		for (i=0; i<AllData.length; i++) { // Loop through all the rows of the AllData
			if (points_valid[i]) {
				var worstBin
				if (!presentIn2dArray(dup_indices, i)[0]) {
					var matches = 0;		// If the current marker is known to be a duplicate, skip it. 
					var j = i;				// 	otherwise, check to see if it has any duplicates. This works
											//	because we loaded the AllData in chronological order, so the 1st
											//	element in each row of the duplicate array will be the most recent.
											// 	And the spider will extend upwards in reverse chronological order. 
					while (matches == 0 & j<AllData.length-1) {
						j++;				// Increment (j) to check out the next AllData point. 							
											// while there are no matches, and we're still in the AllData array 
											// Check to see if the current element (i) has the same latLngs
											//	as each subsequent datapoint (j).
						
						if (Math.abs(AllData[i][DATA_NAMES.lat]-AllData[j][DATA_NAMES.lat])<EPS 
						&& Math.abs(AllData[i][DATA_NAMES.lng]-AllData[j][DATA_NAMES.lng])<EPS &&
						points_valid[j] ){
							
							matches++; 		// If so, increment matches to break out of the while-loop
							dup_indices.push([i,j]); 
						};					// And save the current index (i) and the 1st duplicate, (j). 			
					};
					if (matches == 1) { // If there's at least one duplicate, there may be more! 
						for (var k=j+1; k<AllData.length; k++) {
										// Loop through the rest of the AllData points, if there's a match,
										// 	at index (k), save it after (i) and (j) as [i,j,k1,k2,k3,...]
							if (Math.abs(AllData[i][DATA_NAMES.lat]-AllData[k][DATA_NAMES.lat])<EPS 
							& Math.abs(AllData[i][DATA_NAMES.lng]-AllData[k][DATA_NAMES.lng])<EPS &
							points_valid[k] ){
								dup_indices[dup_indices.length-1].push(k);
							};
						};
					};
				};
				
				if (!presentIn2dArray(dup_indices, i)[0]) {					// plot the base data with no history
					var border = [false, 0, 0]; 							// use the normal white border on the base points w/o history
					plotMarker("base", contaminantToShow, i, border, dup_indices);
				} else if (presentIn2dArray(dup_indices, i)[1][1] == 0) {	// plot the base data with historical data
					var bin = getBin(i, BINS[contaminantToShow]);			// define the base bin as the bin of the base point
					var border = [true, bin, bin];							// when plotting the point show the same border as the base point
					plotMarker("preSpider", contaminantToShow, i, border, dup_indices);
				} else {
					// Do stuff to the historic points, if you'd like, here. 
				};
			
			};
		}
	}
	if (spiderOpen) { 											// If the spider was open already and closed,
		if (presentIn2dArray(dup_indices, i)[0]) {
			openSpider(AllData, spiderOpenIndex, contaminantToShow);// 	reopen it here, now colored by the new contaminant
		}
	};
}
//// TESTING GOOGLE SHEETS DATA IMPORT!!!! /////////

////////////////////////////////////////////////////////////////////////////////
////					 	plotMarker FUNCTION 						  	////
//// 	Takes in a six arguments, "type" (str), "data" (full dataset), 		////
////	"contam" (int) and "data_index" (int) and "border" (1x3 array: [str,////
////	int, int] and plots:												////
//// 	the appropriate point to the map. It also stores the marker info 	////
//// 	(latLng, labels, popups, etc.) in a global array that can be closed ////
//// 	by another function later. 											////
////////////////////////////////////////////////////////////////////////////////

function plotMarker(type, contam, data_index, border) {
	if (type == "base" | type == "preSpider") {					// If the point to plot is a base point (with or without spidering data)
		base.Bins.push(getNextMeasuredBin(AllData, i)); 			// Grab the bin of the point
		var iconToUse;
		if (border[0] == false) {																// if there's no border
			iconToUse = BASE_ICONS[COLORS[activeContaminant][base.Bins[base.Bins.length-1]]];	// grab the normal icon
		} else {																				// if there should be a border
			iconToUse = HISTORICAL_BASE_ICONS[COLORS[activeContaminant][border[1]]][COLORS[activeContaminant][border[2]]];	// grab the bordered icon
		}
		var latLng = L.latLng([AllData[i][DATA_NAMES.lat], AllData[i][DATA_NAMES.lng]]); // Grab the latLng of the point
		base.Markers.push( 										// Save the appropriate marker
			L.marker(latLng, {
			icon: iconToUse,
			riseOnHover: true,
			zIndexOffset: BASE_Z_OFFSET
			})
			.on('click', function(event) { 						// When the marker is clicked	
				click_lat = event.latlng.lat; 					// Grab the latLng of the cliked point 
				click_lng = event.latlng.lng;
																// 	(returns value of marker's center, regardless of where is clicked...)
				var j = -1;
				
				//This loops below gets the index of the point with the same latitude and longitude as the clicked points
				//we'll use that index to access the marker, popup, and label soon. 
				for (var index =0;index<base.Popups.length;index++){
					if(base.Popups[index]._latlng.lat == click_lat && base.Popups[index]._latlng.lng == click_lng){
						j = index;
						index = base.Popups.length;
					}
				}
				
				if (type == "base"){ 				// if the marker is a base point without spidered points
					if(spiderOpen) {				// 	and if another spider is open
						closeSpider();				//	close that other spider.
					};
					map.openPopup(base.Popups[j]); 	// then open the popup for the clicked point.
				} else if (type == "preSpider" & !spiderOpen) { // if the point has spidered points, and there's no spider open
					openSpider(AllData, data_index, contam);		// 	open the spider for the clicked point!
				} else if (type == "preSpider") {				// if the point has spidered points, but there IS a spider open
					if (spiderOpenIndex == data_index) { 		// if the open spider is the clicekd point,
						map.openPopup(base.Popups[j]); 			//	show that point's popup
					} else {									// if not,
						closeSpider();							//	close the current spider
						openSpider(AllData, data_index, contam); 	// 	and open the clicked point's spider!
					}
				}
				
			})
		);
		base.Markers[base.Markers.length-1].bindLabel(getLabel("community", i), {
			noHide: false,										// attach labels to all the base points 
			className: "ourLabel"								//	that activate during mouseover
		});

		if(AllData[data_index][DATA_NAMES.site_type].includes("Well")) {	// if the site is a well
			base.Wells.push(true);										// 	indicate it with a true,
		} else {														//	in base.Wells, otherwise,
			base.Wells.push(false);										//	indicate it with a false.
		}
		
		
		
		//var orgsArray = AllData[data_index][DATA_NAMES.test_org].split("; ");	// THIS REQUIRES THAT TESTING ORGANIZATIONS ARE
		//for (var k=0; k<orgsArray.length; k++) {							//	SEPARATED IN THE DATABASE BY A SEMI-COLON AND A SPACE
		//	if(ORGS.indexOf(orgsArray[k]) == NOT_PRESENT) {					// 	FOR EXAMPLE: "Caminos de Agua; Texas A&M University"
		//		ORGS.push(orgsArray[k])
		//	}
		//}
		
		base.Index.push(data_index);										// store the index in AllData for later access
		
		var popupText = getBasePopup(i);// Grab the text for the popup at data index i
		base.Popups.push(L.popup({		// Define the popup for each marker
			offset: POPUP_OFFSET})
			.setLatLng(latLng)
			.setContent(popupText)
		);
		base.Markers[base.Markers.length-1].addTo(map); // And finally, actually add the markers to the map!
	} else {						// If the point isn't being displayed, push
		base.Markers.push(false); 	// 	falses into the array, so that the indexes
		base.Popups.push(false); 	// 	are the same as in the SQL querried data. 
		base.Bins.push(false);
	}
}		

////////////////////////////////////////////////////////////////////////////////
////					 	getBin FUNCTION 							  	////
//// 	Takes in an index to get the data from the global var AllData and 	////
////	an array called 													////
////	"bins". If bins begins with a 										////
//// 	number, we'll figure out in which bin the value falls. If bins 		////
//// 	begins with a non-number, we need to do something more complex. 	////
//// 	Either way, getBin() returns the correct bin in which value falls.  ////
////																		////
////	Returns 0 to mean no data, 1 means the safest bin, with upwards		////
////	progression by +1 from there.										////
////////////////////////////////////////////////////////////////////////////////

function getBin(index, bins) {
	var pureBins = Array.from(bins);				// store a copy of bins into pureBins
	
	if (bins[0]=="combined") {						// if the bins are combined
		pureBins.splice(0,1);						// get rid of the word 'combined' in pureBins	
	}

	var values = []; 								// initialize the local array, values
	var fluoride = -1;
	var arsenic = -1;
	if (activeContaminant == FLUORIDE) {			// 	and push the relevant values into it,
		values.push(AllData[index][DATA_NAMES.f]);	//	depending on the contaminant to deal 
	} else if (activeContaminant == ARSENIC) { 		// 	with, which is accessed from the global,
		values.push(AllData[index][DATA_NAMES.as]);	//	"activeContaminant".
	} else if (activeContaminant == TOTAL_RISK) {	// For the TOTAL_RISK case:
		var row = presentIn2dArray(dup_indices, index)[1][0];	// get row of dup_indices that has all the duplicate indices for the current point
		var location = presentIn2dArray(dup_indices, index)[1][1]
		if (row >= 0) {
			for (i=location; i<dup_indices[row].length; i++) {
				if (fluoride == -1 && (AllData[dup_indices[row][i]][DATA_NAMES.f] != "" && AllData[dup_indices[row][i]][DATA_NAMES.f] != null)) {
					fluoride = AllData[dup_indices[row][i]][DATA_NAMES.f];
				}
				if (arsenic == -1 && (AllData[dup_indices[row][i]][DATA_NAMES.as] != "" && AllData[dup_indices[row][i]][DATA_NAMES.as] != null)) {
					arsenic = AllData[dup_indices[row][i]][DATA_NAMES.as];
				}
			}	
		} else {
			fluoride = AllData[index][DATA_NAMES.f];
			arsenic = AllData[index][DATA_NAMES.as];
		}
		
		values.push(fluoride);
		values.push(arsenic);
	}		

	var nullCounter = 0;					// initialize a counter
	for (var i=0; i<values.length; i++) {	// count the number of nulls in the values array
		if (!values[i]) {
			nullCounter++
		}
	}
	if (nullCounter == values.length) {		// if it's full of nulls, 
		return 0;							//	return 0, the code for no data
	}
		
	
	var realBin = 1;					// Initialize the bin holder to 1. If we don't find
										// a bin >1, the bin must be 1. 
	if (typeof(bins[0]) == "number"){  	// This section deals with the case where there's
										// 	a single relevant contaminant
		for (var j=0; j<bins.length; j++) { // Loop through the bins array. If the value is
			if (values[0] > pureBins[j]) {	//	greater than the threshold, set the bin!
				realBin = j+2;
			};							// If the bin number hasn't been set, it means
		};								//	that the marker belongs in bin 0, the default value of realBin.
	} else if (bins[0] == "combined") { // This section deals with the case where we're 
										// 	aggregating multiple contaminants into a "risk scale."
		
		for (var contam = 0; contam<values.length; contam++) {						// loop through the contaminants
			for (var level = 0; level<COLORS[contam].length; level++) {				// within each contaminant, loop through the bin cutoffs
				if (values[contam] > BINS[pureBins[contam]][level]) {				// if the value exceeds the cutoff level:
					if (values[contam] && realBin<COLORS[contam][level+2]) {		// (quick check to make sure there is actually a value and that we're not overwriting a higher bin value from an earlier contaminant)
						realBin = COLORS[contam][level+2];							// set the bin. Otherwise, do nothing.
					}
				}
			}
		}					
	} else {
		// if you have any other types of layers you'd like to include,
		//	they should go in the "else" here or in an "else if" where
		// 	you can parse the bin. Good luck!
	};
	return realBin;	
}

////////////////////////////////////////////////////////////////////////////////
////					 	openSpider FUNCTION 						  	////
//// 	Is passed the complete JSON dataset from the SQL querry and the 	////
//// 	index of the base point that has historical duplicates and the 		////
//// 	active contaminant. The function									////
////	searches through the dup_indices array to find the correct row, 	////
//// 	then plots all the points whose indices live in that row spidered.  ////
////	dup_indices is already in reverse chronological order, so they'll 	////
////	be plotted sequentially. When a spidered point is clicked, it's 	////
////	popup appears. 														////
////////////////////////////////////////////////////////////////////////////////
	
function openSpider(data, i, contam) {
	var features = [];										// initialize a local array to store the features
	row = presentIn2dArray(dup_indices, i)[1][0];			// get the row of dup_indices where the index exists
	for (var j=0; j<dup_indices[row].length; j++) {			// loop through that row of dup_indices. I.e., loop 
															//	through all the data-indices of points to spider
		z = dup_indices[row][j]; 							// set z to each index in turn
		var spiderBin = getBin(z, BINS[contam]); // set the latLng, then modify it 
		var shiftedLatLng = adjustLatLng(data[z][DATA_NAMES.lat], data[z][DATA_NAMES.lng], dup_indices[row].length, j);
		var prevShiftedLatLng = adjustLatLng(data[z][DATA_NAMES.lat], data[z][DATA_NAMES.lng], dup_indices[row].length, j-1);
															// get the shifted latlng value of the marker
															// then define the popup format. 
		var popupText = getBasePopup(z);					// grab the text for the popup		
		if (j==0) {											// if we're dealing with the base point of the spider
			features.push(L.marker(shiftedLatLng, {			// push the marker onto the features array
				icon: BASE_SPIDER_ICONS[COLORS[activeContaminant][spiderBin]],
				zIndexOffset: SPIDER_Z_OFFSET
			}));	
		} else {
			features.push(L.marker(shiftedLatLng, {			// if we're not dealing with the base
				icon: SPIDER_ICONS[COLORS[activeContaminant][spiderBin]],				// also push the marker onto the features array.
				zIndexOffset: SPIDER_Z_OFFSET
			}));		
			var popupText = getLabel("hist", 0)+popupText;	// adjust the popup text to note "historical data"
			features.push(L.polyline([shiftedLatLng, prevShiftedLatLng],{
				color: POLY_COLOR,							// push a polyline connecting the current
				weight: POLY_WEIGHT,									// 	point and the previous one onto the 
				opacity: POLY_OPACITY,									// 	featurs array
			}));
		};
		if (j==0) {						// if we're dealing with the base point
			var marker_index = 0;		// 	set the marker index to 0
		} else {						// otherwise, the markers are odd and 
			var marker_index = 2*j-1;	// 	their polylines are the following evens
			var polyline_index = 2*j;
		};	
		features[marker_index].bindLabel(getLabel("month", z)+",\xa0"+getLabel("year", z), {
			noHide: true,				// bind labels displaying the date
			className: "yearLabel",		// 	permanently next to each spidered point
			offset: SPIDER_LABEL_OFFSET						
		});
		features[marker_index].bindPopup(popupText, {
			offset: POPUP_OFFSET 		// bind the appropriate popup to each marker
		});
		if (polyline_index) {					// if there is a polyline (i.e. not the 0th point)
			features[polyline_index].bindLabel(getLabel("community", z),{
				className: "ourLabel"	// bind a label to the polylines as well, displaying community name
			});
		};
	}
	
	var shiftedLatLng = adjustLatLng(data[z][DATA_NAMES.lat], data[z][DATA_NAMES.lng], dup_indices[row].length, j);
	var prevShiftedLatLng = adjustLatLng(data[z][DATA_NAMES.lat], data[z][DATA_NAMES.lng], dup_indices[row].length, j-1);
	features.push(L.marker(shiftedLatLng, {	// get the newest shifted point values
		icon: X_ICON,						// 	to plot the x-out icon at the top
		zIndexOffset: X_OFFSET				// 	of the spider stack. 
	}).on('click', function() {				// When the x-out is clicked,
		closeSpider();						//	close the spider. 
	}));
	
	features.push(L.polyline([shiftedLatLng, prevShiftedLatLng],{
		color: POLY_COLOR,					// push a polyline connecting the x-out
		weight: POLY_WEIGHT,							//	button and the oldest spidered point.
		opacity: POLY_OPACITY
	}).bindLabel(getLabel("community", z),{	// attach the community label to the polyline
		className: "ourLabel"
	}));
											// Finally, add the whole spider featureGroup to the map!
	spiderFeatures = L.featureGroup(features).addTo(map);
	spiderOpenIndex = i;					// set the gloabl spider index 
	spiderOpen = true;						//	and status. Wooohooo! Spider plotted!
}

////////////////////////////////////////////////////////////////////////////////
////					 	window.onclik FUNCTION 						  	////
//// 	When the user clicks in the window, this function executes. It is  	////
//// 	used to toggle the state (show/hide) of the dropdown menu. You 		////
////	almost definitely don't need to mess with this, unless you want 	////
////	something new to happen anytime the user clicks in the window...	////
////////////////////////////////////////////////////////////////////////////////

window.onclick = function(event) {
	if (!event.target.matches('.dropbtn')) { 				// if the user's clikced something other than the dropdown button
		var dropdowns = document.getElementsByClassName("dropdown-content");
		for (var i=0; i<dropdowns.length; i++) { 		// loop through dropdown menu
			var openDropdown = dropdowns[i]; 				// if the dropdown menu is showing
			if (openDropdown.classList.contains('show')) { 	// remove show (so that it hides)
				openDropdown.classList.remove('show');
			}
		}
	} 
}

////////////////////////////////////////////////////////////////////////////////
////					 	adjustDDText FUNCTION 						  	////
//// 	Takes in a contaminant and adjusts the display text in the dropdown ////
////	menu to that contaminant with a downwards pointing triangle. 		////
////////////////////////////////////////////////////////////////////////////////

function adjustDDText(contam) {
	var pointDown = '\xa0\xa0\xa0\u25BC'; 	// The value of a downwards pointing arrow
											// 	preceeded by 3 spaces. 
	document.getElementById('DDHeader').textContent = CONTAMINANTS[contam]+pointDown;
}

////////////////////////////////////////////////////////////////////////////////
////					 	toggleDD FUNCTION 							  	////
//// 	changes the classList property to show on the drop down menu 	    ////
////////////////////////////////////////////////////////////////////////////////

function toggleDD(){
	document.getElementById("mapSelector").classList.toggle("show");
	document.getElementById("search-dropdown").style.display = "none";
}

////////////////////////////////////////////////////////////////////////////////
////					 	getBasePopup FUNCTION 					  		////
//// 	Takes in an index and returns the base popup text format used.		////
////////////////////////////////////////////////////////////////////////////////

function getBasePopup(i) {

	var date = AllData[i][DATA_NAMES.date];									// get the date string
	var day = String(date.getDate());										// get day number
	var month = MONTHS[date.getMonth()];									// get three letter code in appropriate language for month
	var year = String(date.getFullYear());									// get 4digit year
	date = day + "-" + month + "-" + year;									// concatenate day, month, year into string
	date = "<strong>" + DATE_MESSAGE + ": </strong>" + date;				// add label			
	var docPath = AllData[i][DATA_NAMES.docs];								// grab document path from dataset
	var site, docLink, f_numb, f_txt, as_numb, as_txt, test_org;					// initialize variables			

	if (!AllData[i][DATA_NAMES.site_type]) {
		site = NO_DATA_MSG;
	} else {
		site = "<strong>" +WATER_SOURCE_MESSAGE + ": </strong>" + AllData[i][DATA_NAMES.site_type];
	}
	
	
	if (!AllData[i][DATA_NAMES.f] | AllData[i][DATA_NAMES.f] == "") {		// if there is no fluoride data
		f_txt = NO_DATA_MSG;												// load the no data message
	} else {																// otherwise, load the fluoride value
		f_txt = "<h3>"+CONTAMINANTS[0]+"</h3>" + "<h4>" + String(AllData[i][DATA_NAMES.f]) + " " + F_UNITS + "</h4>";
		if (AllData[i][DATA_NAMES.forg] && AllData[i][DATA_NAMES.fmethod]) {
			f_txt = f_txt + "<h5>" + TESTED_BY + AllData[i][DATA_NAMES.forg] + ", " + AllData[i][DATA_NAMES.fmethod] + "</h5>";	
		} else if (AllData[i][DATA_NAMES.forg]) {
			f_txt = f_txt + "<h5>" + TESTED_BY + AllData[i][DATA_NAMES.forg] + "</h5>";
		} else if (AllData[i][DATA_NAMES.fmethod]) {
			f_txt = f_txt + "<h5>" + AllData[i][DATA_NAMES.fmethod] + "</h5>";
		}
	};
	
	if (!AllData[i][DATA_NAMES.as] | AllData[i][DATA_NAMES.as] == "") {		// if there is no arsenic data
		as_txt = NO_DATA_MSG;												// load the no data message
	} else {																// otherwise, load the arsenic value
		as_txt = "<h3>"+CONTAMINANTS[1]+"</h3>" + "<h4>" + String(AllData[i][DATA_NAMES.as]) + " " + AS_UNITS + "</h4>";
		if (AllData[i][DATA_NAMES.asorg] && AllData[i][DATA_NAMES.asmethod]) {
			as_txt = as_txt + "<h5>" + TESTED_BY + AllData[i][DATA_NAMES.asorg] + ", " + AllData[i][DATA_NAMES.asmethod] + "</h5>";	
		} else if (AllData[i][DATA_NAMES.asorg]) {
			as_txt = as_txt + "<h5>" + TESTED_BY + AllData[i][DATA_NAMES.asorg] + "</h5>";
		} else if (AllData[i][DATA_NAMES.asmethod]) {
			as_txt = as_txt + "<h5>" + AllData[i][DATA_NAMES.method] + "</h5>";
		}
	};
	
	if(docPath) {															// if there is a document
		docLink = "<h3><a href="+ docPath +" target='_blank'>"+SEE_MORE+"</a></h3>";	// setup a link 
	} else {																// otherwise don't.
		docLink = ""
	}
	
	// based on the above gets, fill in the popup:
	
	var pop = "<h1>" + AllData[i][DATA_NAMES.name] + "</h1>"	// This text will be displayeD in the popup for this point.
		+ "<hr>"
		+ "<h4>" 
		+ date + "<br>" 
		+ site
		+ "</h4>"
		+ "<hr>"
		+ f_txt
		+ as_txt
		+ docLink
		
	return pop;
}

////////////////////////////////////////////////////////////////////////////////
////					 	adjustLatLng FUNCTION 						  	////
//// 	Takes in a lat, lng, total number of points to spider, and the index////
////	of this particular point. Returns an L.latLng object with the 		////
////	location at which to plot the marker. 								////
////																		////
////	Algorithm: 	x -> x - (X_STRETCH/total_pts)*i^2						////
////				y -> y - Y_STRETCH*i									////
////////////////////////////////////////////////////////////////////////////////

function adjustLatLng(lat, lng, total_pts, i) { 				
	var latLng = L.latLng([lat, lng]);					// build a latLng object
	var ll_point = map.latLngToContainerPoint(latLng);	// convert to container point with [x, y] coords, then shift
	var x = ll_point.x - (X_STRETCH/total_pts)*i*i; 	// get the shifted x
	var y = ll_point.y - Y_STRETCH*i;					//	 and y.
	var shiftedLatLng = map.containerPointToLatLng(L.point([x, y])); // Turn the shifted components back to a L.latLng object.
	return shiftedLatLng;
}

////////////////////////////////////////////////////////////////////////////////
////					 	presentIn2dArray FUNCTION 					  	////
//// 	Takes in a 2D array and a value, and returns an array of the form 	////
//// 	[exists?, [index0, index1]] where "exists?" is a boolean, true if 	////
//// 	the value exists in the array, at the coordinates [index0][index1].	//// 
////																		////
////	THIS FUNCTION ONLY WORKS IF THERE ARE NO REPEATS. OTHERWISE IT WILL	////
////	RETURN THE 1ST INSTANCE OF value IN array.							////
////////////////////////////////////////////////////////////////////////////////

function presentIn2dArray(array, value) {
	var exists = false; 					// if we don't find value in array, we'll return false. 
	var index = [NOT_PRESENT, NOT_PRESENT];					// if we don't find value in array, we'll return [-1,-1] as it's coordinates.
	for (var a=0; a<array.length; a++) {		// loop through each subArray
		if (array[a].indexOf(value) > NOT_PRESENT) { // if the value exists in that subArray
			exists = true; 					// set exists
			index = [a, array[a].indexOf(value)]; 	// and set the indices
		};
	};
	return [exists, index]; 			
}

////////////////////////////////////////////////////////////////////////////////
////						getNextMeasuredBin FUNCTION	 					////
////																		////
////	Takes in the full dataset and index. If the point isn't a spider,	////
////	returns 0. Otherwise, it returns the bin of the next most recent, 	////
////	non-zero data point at the same location. If there isn't one, 		////
//// 	returns 0 as well. 													////
////////////////////////////////////////////////////////////////////////////////


function getNextMeasuredBin(data, i) {
	var nextBin = 0;
	var bin;
	if (!presentIn2dArray(dup_indices, i)[0]) {
		nextBin = getBin(i, BINS[activeContaminant]);
	} else {
		dup_row = dup_indices[presentIn2dArray(dup_indices, i)[1][0]];
		for (var j=dup_row.length-1; j>=0; j--){						// loop through all the duplicates (going from oldest to newest)
			bin = getBin(dup_row[j], BINS[activeContaminant])		// get the bin of each duplicate
			if (bin != 0) {												
				nextBin = bin;
			}					
		}
	};
	return nextBin;
	



}

////////////////////////////////////////////////////////////////////////////////
////					 	getLabel FUNCTION 							  	////
//// 	Takes in the type of label to plot (string) and the index of the 	////
////	marker's data in the global data array, AllData. Returns the string ////
////	that will be contained in the label. 								////
////////////////////////////////////////////////////////////////////////////////

function getLabel(type, i) {
	date = AllData[i][DATA_NAMES.date]
	if (type == "year") {
		return date.getFullYear();		
	} else if (type == "month") {
		return MONTHS[date.getMonth()];
	} else if (type == "community") {
		str = String(AllData[i][DATA_NAMES.name]);
		str = str.split(" ")
		var newStr = "";
		var lineCount = 1;
		for (var i=0; i<str.length; i++) {
			tempNewStr = newStr+"\xa0"+str[i]
			if(tempNewStr.length>MAX_LABEL_LINE_CHARS*lineCount & i!=0) {	
				newStr = newStr+"\xa0\n\xa0"+str[i];
			} else {
			newStr = tempNewStr;
			}
		};
		return "\xa0"+newStr+"\xa0";
	} else if (type == 'hist') {
		return OLD_DATA_MSG;
	};
}

////////////////////////////////////////////////////////////////////////////////
////					  	hideLegend FUNCTION	 						  	////
//// 			This function hides any div legends that may be open.		////
////////////////////////////////////////////////////////////////////////////////

function hideLegend() {
	document.getElementById('fluoride_legend').style.display = 'none';
	document.getElementById('arsenic_legend').style.display = 'none';
	document.getElementById('risk_legend').style.display = 'none';
}

////////////////////////////////////////////////////////////////////////////////
////					  	showLegend FUNCTION	 						  	////
//// 	This function shows the div legend for the relevant contaminant.	////
////////////////////////////////////////////////////////////////////////////////

function showLegend(contam) { 
	if (contam == FLUORIDE) {
		document.getElementById('fluoride_legend').style.display = 'block';
	} else if (contam == ARSENIC) {
		document.getElementById('arsenic_legend').style.display = 'block';
	} else if (contam == TOTAL_RISK) {
		document.getElementById('risk_legend').style.display = 'block';
	};
}

////////////////////////////////////////////////////////////////////////////////
////					 	closeSpider FUNCTION 						  	////
//// 	Closes all points stored in the global var spiderFeatures.			////
////////////////////////////////////////////////////////////////////////////////

function closeSpider() { 				
	if (spiderFeatures) {				// if spiderFeatures exists (if a spider is open)
		map.removeLayer(spiderFeatures)	// 	then remove it!		
	};						
	spiderOpen = false;					// reset the global flag that the spider is closed
}

////////////////////////////////////////////////////////////////////////////////
////					 	removePoint FUNCTION 						  	////
//// 			Removes the point stored at the index i.					////
////////////////////////////////////////////////////////////////////////////////

function removePoint(i) {
	map.removeLayer(base.Markers[i]); 
}

////////////////////////////////////////////////////////////////////////////////
////					 	onKeypress FUNCTION 						  	////
//// 			Closes the spider if the user presses "esc".				////
////////////////////////////////////////////////////////////////////////////////

$(document).bind('keypress', function (event) {
	if(String(event.originalEvent.key) == "Escape") {
		closeSpider();	
	}
})


////////////////////////////////////////////////////////////////////////////////
////					 	changeHelpSrc FUNCTION 						  	////
//// 	Changes the color of the help icon depending on if there's a mouse	////
////	hovering over it.													////
////////////////////////////////////////////////////////////////////////////////

function changeHelpSrc(type) {
	if (type == "hover") {
		document.getElementById("help_button").src = HELP_URL_HOVER;
	} else {
		document.getElementById("help_button").src = HELP_URL;
	}
}

////////////////////////////////////////////////////////////////////////////////
////					 	openHelp/closeHelp FUNCTION 				  	////
//// 			Opens/closes the help dialog box.							////
////////////////////////////////////////////////////////////////////////////////


function openHelp() {
	document.getElementById("help_button").style.display = "none";
	document.getElementById("how_to_read").style.display = "inline-block";
	document.getElementById("x_button").style.display = "inline-block";
}

function closeHelp () {
	document.getElementById("help_button").style.display = "inline-block";
	document.getElementById("how_to_read").style.display = "none";
	document.getElementById("x_button").style.display = "none";
	
}

///////////////////////////////////////////////////////////////////
////			function enable/disableMapControls 				////
//// 															////
////	Disables and enables panning, zooming, and all keyboard	////
////	map controls when the cursor is and isn't over the map.	////
////////////////////////////////////////////////////////////////////


function disableMapControls() {
	if (map) {
		map.dragging.disable();
		map.touchZoom.disable();
		map.doubleClickZoom.disable();
		map.scrollWheelZoom.disable();
		map.boxZoom.disable();
		map.keyboard.disable();
		if (map.tap) map.tap.disable();
		document.getElementById('WaterMap').style.cursor='default';
	}
}

function enableMapControls() {
	if (map) {
		map.dragging.enable();
		map.touchZoom.enable();
		map.doubleClickZoom.enable();
		map.scrollWheelZoom.enable();
		map.boxZoom.enable();
		map.keyboard.enable();
		if (map.tap) map.tap.enable();
		document.getElementById('WaterMap').style.cursor='grab';
	}
}

///////////////////////////////////////////////////////////////////
////			function easterEggGo()			 				////
//// 															////
////	Prints a bunch of information to the console. This is 	////
////	primarily designed for staff to use to get useful		////
////	statistics for reports, publications, quotes for media	////
////	inquiries, etc.											////
////////////////////////////////////////////////////////////////////


function easterEggGo() {
	console.log(PRINTING_SUMMARY_MSG)
	//////// 	total sites sampled					/////////
	
	console.log(TOTAL_SITES_MSG+"\xa0"+base.Markers.length)		// length of base.Markers = number of base points
	
	////////	total wells	sampled					/////////
	
	wellCounter = 0;											// base.Wells is all the base points and reads 1
	for(var i=0; i<base.Wells.length; i++) {					//	for a well, and 0 for anything else. So adding
		wellCounter = wellCounter+base.Wells[i];				// 	them up = # of distinct wells sampled
	}
	console.log(TOTAL_WELLS_MSG+"\xa0"+wellCounter);
	
	////////	total number datapoints taken		/////////
	
	var dups = 0;												// get the total number of duplicates (indluding base points)
	for(var i=0; i<dup_indices.length; i++) {					
		dups = dups + dup_indices[i].length;
	}															// subtract dup_indices.length, the number of base points with duplicates to avoid double counting
	var totalPoints = dups - dup_indices.length + base.Markers.length	// 	then add all the base points to get total number of samples incorporated in map. 
	console.log(TOTAL_POINTS_MSG+"\xa0"+totalPoints)				
	
	////////	number of partners	/////////
	console.log(TOTAL_ORGS_MSG+"\xa0"+ORGS.length);
	
	////////	names of partners	///////// 	
	console.log(ORG_NAMES_MSG+"\xa0"+ORGS)
	
	////////	number of sites currently above F-As-Both		/////////
	var bothBins = Array.apply(null, Array(base.Index.length)).map(Number.prototype.valueOf,0);
	var binCounters = Array.apply(null, Array(CONTAMINANTS.length-1)).map(Number.prototype.valueOf, 0);
	var storedActiveContaminant = activeContaminant;				// store the active contaminant b/c getBins reads it
	for (var pt=0; pt<base.Index.length; pt++) {					// loop through all the points
		bothBins[pt] = Array.apply(null, Array(CONTAMINANTS.length-1)).map(Number.prototype.valueOf,0);
		for (var contam=0; contam<CONTAMINANTS.length-1; contam++) {	// loop through all the contaminant categories, excluding the last one (assumed to be total risk);
			activeContaminant = contam;									// set the active contaminant to whatever contaminant you're getting the bins for (sorry this is a terrible work-around =/  )
			bothBins[pt][contam]=getBin(base.Index[pt], BINS[contam])	// store the value of the bin into bothBins array
			if (bothBins[pt][contam] > 1) {								// if 
				binCounters[contam] = binCounters[contam] + 1;
			}
		}
		activeContaminant = storedActiveContaminant						// reset the active contaminant
		
	}
	
	////////	display results for F/As/contamination data...	////////
	for (var i=0; i<CONTAMINANTS.length-1; i++) {
		console.log("\n"+CONTAMINANT_HEADER_MSG+"\xa0"+CONTAMINANTS[i]+"\xa0"+CONTAMINANT_HEADER_MSG);
		for (var j=0; j<BINS[i].length; j++) {
			var binstances = 0;					// <--- this is a bad pun variable name for "bin instances"
			for (var k=0; k<bothBins.length; k++) {
				if (bothBins[k][i] == j+2) {
					binstances++;
				}
			
			
			}
			console.log(CONTAM_LIMIT_MSG+"\xa0"+LABELS[i][j+1]+": "+binstances);		// print each bin value for each contam
		}
		console.log(TOTAL_ABOVE_MSG+"\xa0"+binCounters[i]);								// print total # > WHO limit for each contam
	}
	var bothAboveCounter = 0;
	for (var i=0; i<bothBins.length; i++) {
		if (bothBins[i][0]>1 && bothBins[i][1]>1) {
			bothAboveCounter++;
		}
	}
	console.log("\n"+CONTAMINANT_HEADER_MSG+"\xa0"+BOTH_MSG+"\xa0"+CONTAMINANT_HEADER_MSG);
	console.log(TOTAL_ABOVE_BOTH_MSG+"\xa0"+bothAboveCounter)
	
	
}

function setupSearch() {
	SEARCH_INDEX = elasticlunr(function () {
		this.addField('name');
		this.setRef(DATA_NAMES.name);
	});
	for(var i=0; i<AllData.length; i++) {
		SEARCH_INDEX.addDoc(AllData[i]);
	}	
	$('#search').bind('keyup',function(event) {
		var key = String.fromCharCode(event.keyCode);
		if (/[a-zA-Z0-9-_ ]/.test(key) || event.keyCode == "8") { //if letter, or number or symbol or delete
			loadNewSearchResults(this.value)
		}
	})
	
	$("#searchBar").submit(function() {			
		loadNewSearchResults(this.children[0].value);
		return false
	})
	document.getElementById('search').value = SEARCH_HELPER_TEXT;
}

function focused(el) {
	if(el.value == SEARCH_HELPER_TEXT) {
		el.value = "";
	} 
}

function blurred(el) {
	
	if(el.value == "") {
		el.value = SEARCH_HELPER_TEXT;
	}
}


function loadNewSearchResults(key) {
	var dd = document.getElementById("search-dropdown");
	if (key == "") {					// if there is no text entered
		document.getElementById('search-dropdown').style.display = "none";
	} else {							// if there is text entered
		var res = SEARCH_INDEX.search(key);	// get all search results		
		if(res.length>MAX_SEARCH_LENGTH) {res.length = MAX_SEARCH_LENGTH};	// caps length of results
		dd.innerHTML = "";
		var padLeft = getComputedStyle(document.getElementById('search')).paddingLeft;
		var padRight = getComputedStyle(document.getElementById('search')).paddingRight;
		var width = getComputedStyle(document.getElementById('search')).width;
		padLeft = Number(padLeft.substring(0, padLeft.length-2));
		padRight = Number(padRight.substring(0, padRight.length-2));
		width = Number(width.substring(0, width.length-2));
		width = String(width + padLeft + padRight)+"px";
		document.getElementById('search-dropdown').style.width = width;
		if (res.length != 0) { 				// if some results have been found...
			
			for(var i=0; i<res.length; i++) {
				//console.log(res[i]);
				var lat = res[i].doc.latitude;
				var lng = res[i].doc.longitude;
				if (lat && lng) {
					dd.innerHTML = dd.innerHTML + "<div class='search-result' onclick='zoomTo("+lat+","+lng+");'><b>"+res[i].ref+"</b></div>";
				}
			}
		} else {							// if no results have been found...
			dd.innerHTML = "<div class='search-result'><b>"+NO_RESULTS_MSG+"</b></div>";
		}
	document.getElementById('search-dropdown').style.display = "inline-block";
	}
}

function zoomTo(lat, lng) {
	document.getElementById('search-dropdown').style.display = "none";
	map.setView([lat, lng], 17);
}

function toggleTileView() {
	if (CURRENT_TILE_ID == MAPBOX_IDS["basic"]) {
		applyBaseMap(MAPBOX_IDS["satellite"]);
		document.getElementById("img-button-text").innerHTML = BASIC_MAP_VIEW;
		document.getElementById("map-tile-selector").src = BASIC_TILE_THUMBNAIL_URL;
	} else {
		applyBaseMap(MAPBOX_IDS["basic"]);
		document.getElementById("img-button-text").innerHTML = SATELLITE_MAP_VIEW;
		document.getElementById("map-tile-selector").src = SATELLITE_TILE_THUMBNAIL_URL;
	}
}

function beginUserExperience() {
	$("#overlay").fadeOut(800, function() {});	// fade out the overlay	
}

////////////////////////////////////////////////////////////////////
////				function detectMobile()						////
//// 															////
////	Checks to see if the user is on a mobile browser.		////
////	Args:	none.											////
////	Returns: true if mobile, false otherwise				////
////////////////////////////////////////////////////////////////////

function detectMobile() {	// Thanks to Michael Zaporozhets for this function: http://stackoverflow.com/questions/11381673/detecting-a-mobile-browser
	var check = false;
	(function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
	return check;
};

function adjustDisplayForMobile() {
	closeHelp();
	console.log(document.getElementById("overlay_title").style.fontSize = "36px");
	console.log(document.getElementById("overlay_msg").style.fontSize = "22px");
}

function pointIsValid(i) {		//checks if that points at AllData[i] is valid. If so, returns true. Else, returns false.
	if( AllData[i][DATA_NAMES.lat] == null | AllData[i][DATA_NAMES.lat] == "" |	//	make sure, for a given point, that the
		AllData[i][DATA_NAMES.lng] == null | AllData[i][DATA_NAMES.lng] == "" |			//	lat, lng, and date are all present
		AllData[i][DATA_NAMES.date] == NOT_PRESENT ) {
		return false
	} 
	if( activeContaminant == FLUORIDE &&				// if we're looking at fluoride points
		(AllData[i][DATA_NAMES.f] == null | AllData[i][DATA_NAMES.f] == "")) {	// only show points who have a fluoride value
		return false
	} else if ( activeContaminant == ARSENIC &&				// if we're only looking at arsenic points
		(AllData[i][DATA_NAMES.as] == null | AllData[i][DATA_NAMES.as] == "") ) {	// only show points who have an arsenic value
		return false
	} else if ( activeContaminant == TOTAL_RISK && 			// if we're showing total risk, only show points
	( 	(AllData[i][DATA_NAMES.f] == null | AllData[i][DATA_NAMES.f] == "") &&		// that have either an arsenic or fluoride value
		(AllData[i][DATA_NAMES.as] == null | AllData[i][DATA_NAMES.as] == "") )) {
		return false	
	} 
	return true	
}
