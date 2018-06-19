/* This upcoming script tag holds all of the functions and scripts that
will run. If something isn't in a function, it runs automatically on load.
Those are mostly global variable and CONSTANT definitions. If a variable's 
value is constant, it is declared in BLOCK_LETTERS (with underscores between
words). This is just a personal convention I use to avoid getting confused. 
if a variable's value can change, its written with the first
word beginning in lowercase, and the rest beginning upper, as in: helloThereYou. 
Sometimes i depart from this convention for various reasons. For this, I appologize. =)
	The functions only run when they're called, either by the html code above,
by another function, or by a user event like a click or zoom. */
		
////////////////////////////////////////////////////////////////////////////////
////					 DEFINE GLOBAL VARIABLES 						  	////
////																		////
////	IF YOU'RE TRYING TO CHANGE THE FORMATTING / COLORS / STYLES /		////
////		DATASET IN THE EXISTING MAP, YOU SHOULD ONLY NEED TO CHANGE 	////
////		STUFF IN THIS SECTION. DON'T CHANGE ANYTHING ELSE IF YOU'RE		////
////		NOT SURE WHAT IT DOES!!!										////
////																		////
////	IF YOU WANT TO CHANGE SOMETHING FUNDAMENTAL, LIKE WHICH VARIABLES 	////
////		CAN BE PLOTTED WITH THR DROPDOWN MENU, PLEASE REFFER TO THE 	////
////		TUTORIAL VIDEO POSTED ON TRELLO BEFORE PROCEEDING. 				////
////																		////
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
	
	var X_ICON = L.icon({ 					// define an icon that can be clicked to close the spider
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
	
	document.getElementById("f_title").innerHTML = F_TITLE;
	document.getElementById("as_title").innerHTML = AS_TITLE;
	document.getElementById("risk_title").innerHTML = RISK_TITLE;
	document.getElementById("how_to_read").src = LEGEND_URL;
	document.getElementById("help_button").src = HELP_URL;
	document.getElementById("close_arrow").src = ARROW_URL;
}


////////////////////////////////////////////////////////////////////////////////
////					 INITIALIZATION FUNCTION 						  	////
//////////////////////////////////////////////////////////////////////////////// 

function init() {
	
	setGlobals();
	initMap(); 					// Initialize and display the map object
	applyBaseMap(); 			// Apply the base tiles to the map
	loadAndPlotData(TOTAL_RISK); 	// Load the data for Fluoride (the default contaminant) 
}								// 	then plot the base markers on the map.	

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
	map.attributionControl.setPrefix(CARTO_ATTRIBUTION);
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


function applyBaseMap() {
	map.addLayer(new L.StamenTileLayer(STAMEN_MAP_TYPE), {});
	
}

////////////////////////////////////////////////////////////////////////////////
////					 	loadAndPlotData FUNCTION 					  	////
//// 	This function grabs data from carto.com and stores it in a local 	////
//// 	variable array. It also stores a copy of the data in the global 	////
////	array AllData for other functions to access. After storing the 		////
////	data, it calls functions to plot them. 								////
////////////////////////////////////////////////////////////////////////////////

function loadAndPlotData(contaminantToShow) {
	base = { 							// reinitialize the global variable base.
		Markers: [],
		Popups: [],
		Bins: [],
		Wells: [],
		Index: []
	};
	if (spiderOpen) {					// if there's a spider open, 
		closeSpider(); 					//	close the spider,
		spiderOpen = true;				//	but store that the spider is still open. 
	};									// (we'll open it back up later...)
	dup_indices = []; 					// reinitialize global dup_indices as an array
	if (activeContaminant == contaminantToShow) {
	} else { 							// if the currently-displayed contaminant is
										//	selected again, don't do anything! Otherwise:
		if (activeContaminant != NOT_PRESENT) { 	// if there's already a layer being displayed
		
			for (l=1; l<base.Markers.length; l++) {
				if (base.Markers[l]){ 	// if a marker exists,
					map.removeLayer(base.Markers[l]);
				};						// clear it, to wipe the map clean. 
			};
			hideLegend();				// and then hide the legend, too. 
		};
		activeContaminant = contaminantToShow;  // Store the contaminant as a global
		adjustDDText(contaminantToShow); 		// Adjust the text in the drop down menu to display the current contaminant
		showLegend(contaminantToShow);			// And display the appropriate legend
		
			
		var data = WQM_MAP_DATA;			// grab the data // This grabs the JSON data file. MAKE SURE THE FILE IS SORTED BY 
											//	DATE IN DECREASING ORDER!!!! <--- Super important for spidering to work correctly...
		AllData = data;						// store it in the global variable
		
		// Uncomment the next line to see the full dataset in the console, super useful for debugging!
		//console.log("Data acquired! "+JSON.stringify(data)); 	// log the data in the console for debugging...
		
		for (i=0; i<data.length; i++) { // Loop through all the rows of the data
			if (data[i][DATA_NAMES.lat] == null | data[i][DATA_NAMES.lat] == "" |	//	ignore the point!
			data[i][DATA_NAMES.lng] == null | data[i][DATA_NAMES.lng] == "" |
			makeDate(data[i][DATA_NAMES.day], data[i][DATA_NAMES.month], data[i][DATA_NAMES.year]) == NOT_PRESENT) {
			} else { 						// Otherwise, check for duplicate latLngs, then plot the base markers
				var worstBin
				if (!presentIn2dArray(dup_indices, i)[0]) {
					var matches = 0;		// If the current marker is known to be a duplicate, skip it. 
					var j = i;				// 	otherwise, check to see if it has any duplicates. This works
											//	because we loaded the data in chronological order, so the 1st
											//	element in each row of the duplicate array will be the most recent.
											// 	And the spider will extend upwards in reverse chronological order. 
					while (matches == 0 & j<data.length-1) {
						j++;				// Increment (j) to check out the next data point. 							// while there are no matches, and we're still in the data array 
											// Check to see if the current element (i) has the same latLngs
											//	as each subsequent datapoint (j).
						if (Math.abs(data[i][DATA_NAMES.lat]-data[j][DATA_NAMES.lat])<EPS 
						& Math.abs(data[i][DATA_NAMES.lng]-data[j][DATA_NAMES.lng])<EPS &
						makeDate(data[j][DATA_NAMES.day], data[j][DATA_NAMES.month], data[j][DATA_NAMES.year]) != NOT_PRESENT ){
							matches++; 		// If so, increment matches to break out of the while-loop
							dup_indices.push([i,j]); 
						};					// And save the current index (i) and the 1st duplicate, (j). 			
					};
					if (matches == 1) { // If there's at least one duplicate, there may be more! 
						for (var k=j+1; k<data.length; k++) {
										// Loop through the rest of the data points, if there's a match,
										// 	at index (k), save it after (i) and (j) as [i,j,k1,k2,k3,...]
							if (Math.abs(data[i][DATA_NAMES.lat]-data[k][DATA_NAMES.lat])<EPS 
							& Math.abs(data[i][DATA_NAMES.lng]-data[k][DATA_NAMES.lng])<EPS &
							makeDate(data[k][DATA_NAMES.day], data[k][DATA_NAMES.month], data[k][DATA_NAMES.year]) != NOT_PRESENT ){
								dup_indices[dup_indices.length-1].push(k);
							};
						};
					};
				};
				
				if (!presentIn2dArray(dup_indices, i)[0]) {					// plot the base data with no history
					var border = [false, 0, 0]; 							// use the normal white border on the base points w/o history
					plotMarker("base", data, contaminantToShow, i, border, dup_indices);
				} else if (presentIn2dArray(dup_indices, i)[1][1] == 0) {	// plot the base data with historical data
					var row = presentIn2dArray(dup_indices, i)[1][0];		// get row of dup_indices that has all the duplicate indices for the current point
					var baseBin = getBin(i, BINS[contaminantToShow]);		// define the base bin as the bin of the base point
					var maxBin = 0;											// init maxBin to hold the maximum bin of the spider
					var newBin;												// init a placeholder called newBin
					for (var spideringPts = 0; spideringPts<dup_indices[row].length; spideringPts++) {	// loop through all the duplicate points`
						newBin = getBin(dup_indices[row][spideringPts], BINS[contaminantToShow]);	// set newBin to the bin of the historical points
						if (newBin > maxBin) {								// if a historical point is higher than the previously registered max bin,
							maxBin = newBin;								//	set the maxBin to the bin of that new point, this way, maxBin ends up
						}													//	holding the maximum bin of all the historical data, including the base point. 
					}
					var border = [true, baseBin, maxBin];					// when plotting the point show the border based on the max bin of the historical data
					plotMarker("preSpider", data, contaminantToShow, i, border, dup_indices);
				} else {
					// Do stuff to the historic points, if you'd like, here. 
				};
			
			};
		};
		if (spiderOpen) { 											// If the spider was open already and closed,
			openSpider(AllData, spiderOpenIndex, contaminantToShow);// 	reopen it here, now colored by the new contaminant
		};			
	};
};
////////////////////////////////////////////////////////////////////////////////
////					 	plotMarker FUNCTION 						  	////
//// 	Takes in a six arguments, "type" (str), "data" (full dataset), 		////
////	"contam" (int) and "data_index" (int) and "border" (1x3 array: [str,////
////	int, int] and plots:												////
//// 	the appropriate point to the map. It also stores the marker info 	////
//// 	(latLng, labels, popups, etc.) in a global array that can be closed ////
//// 	by another function later. 											////
////////////////////////////////////////////////////////////////////////////////

function plotMarker(type, data, contam, data_index, border) {
	if (type == "base" | type == "preSpider") {					// If the point to plot is a base point (with or without spidering data)
		base.Bins.push(getNextMeasuredBin(data, i)); 			// Grab the bin of the point
		var iconToUse;
		if (border[0] == false) {																// if there's no border
			iconToUse = BASE_ICONS[COLORS[activeContaminant][base.Bins[base.Bins.length-1]]];	// grab the normal icon
		} else {																				// if there should be a border
			iconToUse = HISTORICAL_BASE_ICONS[COLORS[activeContaminant][border[1]]][COLORS[activeContaminant][border[2]]];	// grab the bordered icon
		}
		var latLng = L.latLng([data[i][DATA_NAMES.lat], data[i][DATA_NAMES.lng]]); // Grab the latLng of the point
		base.Markers.push( 										// Save the appropriate marker
			L.marker(latLng, {
			icon: iconToUse,
			riseOnHover: true,
			zIndexOffset: BASE_Z_OFFSET
			})
			.on('click', function(event) { 						// When the marker is clicked	
				click_lat = event.latlng.lat; 					// Grab the latLng of the cliked point 
																// 	(returns value of marker's center, regardless of where is clicked...)
				var j = base.Popups.map(function(a) {return a._latlng.lat}).indexOf(click_lat);
																// this confusing line gets the index in base.Popups
																//	of the point with the same latitude as the clicked point
																// 	we'll use that index to access the marker, popup, and label soon. 
				if (type == "base"){ 				// if the marker is a base point without spidered points
					if(spiderOpen) {				// 	and if another spider is open
						closeSpider();				//	close that other spider.
					};
					map.openPopup(base.Popups[j]); 	// then open the popup for the clicked point.
				} else if (type == "preSpider" & !spiderOpen) { // if the point has spidered points, and there's no spider open
					openSpider(data, data_index, contam);		// 	open the spider for the clicked point!
				} else if (type == "preSpider") {				// if the point has spidered points, but there IS a spider open
					if (spiderOpenIndex == data_index) { 		// if the open spider is the clicekd point,
						map.openPopup(base.Popups[j]); 			//	show that point's popup
					} else {									// if not,
						closeSpider();							//	close the current spider
						openSpider(data, data_index, contam); 	// 	and open the clicked point's spider!
					}
				}
				
			})
		);
		base.Markers[base.Markers.length-1].bindLabel(getLabel("community", i), {
			noHide: false,										// attach labels to all the base points 
			className: "ourLabel"								//	that activate during mouseover
		});

		if(data[data_index][DATA_NAMES.site_type].includes("Well")) {	// if the site is a well
			base.Wells.push(true);										// 	indicate it with a true,
		} else {														//	in base.Wells, otherwise,
			base.Wells.push(false);										//	indicate it with a false.
		}
		
		
		
		var orgsArray = data[data_index][DATA_NAMES.test_org].split("; ");	// THIS REQUIRES THAT TESTING ORGANIZATIONS ARE
		for (var k=0; k<orgsArray.length; k++) {							//	SEPARATED IN THE DATABASE BY A SEMI-COLON AND A SPACE
			if(ORGS.indexOf(orgsArray[k]) == NOT_PRESENT) {					// 	FOR EXAMPLE: "Caminos de Agua; Texas A&M University"
				ORGS.push(orgsArray[k])
			}
		}
		
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
				opacity: POLY_OPACITY									// 	featurs array
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
	if (!event.target.matches('.dropbtn')) { 				// if the user's clikced the dropdown button
		var dropdowns = document.getElementsByClassName("dropdown-content");
		for (var i=0; i<dropdowns.length; i++) { 		// loop through dropdown menu
			var openDropdown = dropdowns[i]; 				// if the dropdown menu is showing
			if (openDropdown.classList.contains('show')) { 	// remove show (so that it hides)
				openDropdown.classList.remove('show');
			};
		};
	};
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
}

////////////////////////////////////////////////////////////////////////////////
////					 	getBasePopup FUNCTION 					  		////
//// 	Takes in an index and returns the base popup text format used.		////
////////////////////////////////////////////////////////////////////////////////

function getBasePopup(i) {
	
	var day = String(AllData[i][DATA_NAMES.day]);
	var month = MONTHS[Number(AllData[i][DATA_NAMES.month])-1];
	var year = String(AllData[i][DATA_NAMES.year]);

	var docPath = AllData[i][DATA_NAMES.docs];
	var docLink;
	var f_numb;
	var as_numb;
	var test_org;
	
	if(docPath) {
		docLink = "<a href="+ docPath +" target='_blank'>"+SEE_MORE+"</a>";
	} else {
		docLink = ""
	}
	
	if (!AllData[i][DATA_NAMES.f] | AllData[i][DATA_NAMES.f] == "") {
		f_numb = NO_DATA_MSG;
	} else {
		f_numb = AllData[i][DATA_NAMES.f];
	};
	
	if (!AllData[i][DATA_NAMES.as] | AllData[i][DATA_NAMES.as] == "") {
		as_numb = NO_DATA_MSG;
	} else {
		as_numb = AllData[i][DATA_NAMES.as];
	};
	
	if (!AllData[i][DATA_NAMES.test_org] | AllData[i][DATA_NAMES.test_org] == "") {
		test_org = NO_DATA_MSG;
	} else {
		test_org = String(AllData[i][DATA_NAMES.test_org]);
	}
	
	var pop = "<dl><h2>" + AllData[i][DATA_NAMES.name] + "</h2>"	// This text will be displayed
		+ "<b>"+DATE+"</b>"												//	in the popup for this point.
		+ "<dt>" + day + "-" + month + "-" + year + "</dd>"
		+ "<br><br>"
		+ "<b>"+TEST_ORG+"</b>"
		+ "<dt>" + test_org + "</dd>"
		+ "<br><br>"
		+ "<b>"+CONTAMINANTS[0]+" (mg/L)</b>"
		+ "<dt>" + f_numb + "</dd>"
		+ "<br><br>"
		+ "<b>"+CONTAMINANTS[1]+" (&mu;g/L)</b>"
		+ "<dt>" + as_numb + "</dd>"
		+ "<br><br>"
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
	date = makeDate(AllData[i][DATA_NAMES.day], AllData[i][DATA_NAMES.month], AllData[i][DATA_NAMES.year])
	if (type == "year") {
		return date.split('/',3)[2];		
	} else if (type == "month") {
		var monthNumb = Number(date.split('/',3)[1]);
		return MONTHS[monthNumb-1];
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
	document.getElementById("close_arrow").style.display = "inline-block";
}


function closeHelp () {
	document.getElementById("help_button").style.display = "inline-block";
	document.getElementById("how_to_read").style.display = "none";
	document.getElementById("x_button").style.display = "none";
	document.getElementById("close_arrow").style.display = "none";

}

////////////////////////////////////////////////////////////////////////////////
////					 	zipAndDownloadMap FUNCTION 					  	////
//// 	Creates a zip file of all relevant files for the map and downloads	////
////	it to the user's machine. 		
////	PSEUDOCODE:
////		Read in all relevant files as strings							////
////		Modify index.html to look only at local files. Change name to 	////
////		"WQM_MAP.html"													////
////			HOW TO DEAL WITH TILES?!?!?!
////		Store them in the appropriate folders and zip it!				////
////		Download the zip file to the user's computer					////
////////////////////////////////////////////////////////////////////////////////

function zipAndDownloadMap() {
	
	
	


}

///////////////////////////////////////////////////////////////////
////			function enable/disableMapControls 				////
//// 															////
////	Disables and enables panning, zooming, and all keyboard	////
////	map controls when the cursor is and isn't over the map.	////
////////////////////////////////////////////////////////////////////


function disableMapControls() {
	map.dragging.disable();
	map.touchZoom.disable();
	map.doubleClickZoom.disable();
	map.scrollWheelZoom.disable();
	map.boxZoom.disable();
	map.keyboard.disable();
	if (map.tap) map.tap.disable();
	document.getElementById('WaterMap').style.cursor='default';
}

function enableMapControls() {
	map.dragging.enable();
	map.touchZoom.enable();
	map.doubleClickZoom.enable();
	map.scrollWheelZoom.enable();
	map.boxZoom.enable();
	map.keyboard.enable();
	if (map.tap) map.tap.enable();
	document.getElementById('WaterMap').style.cursor='grab';
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

///////////////////////////////////////////////////////////////////
////			function makeDate(d, m, y)		 				////
//// 															////
////	Concatenates the date, month, and year into a string	////
////	separated by slashes (/) with 0's added to pad the 		////
////	string into dd/mm/yyyy format. 							////
////////////////////////////////////////////////////////////////////

function makeDate(d, m, y) {
	if (d>31 | m>12 | d=="" | d==null | m=="" | m==null | y=="" | y==null) {
		return NOT_PRESENT;
	}
	
	var day;
	if (d<10) {
		day = "0"+String(d);
	} else {
		day = String(d);
	}
	var month;
	if (m<10) {
		month = "0"+String(m);
	} else {
		month = String(m);
	}
	var year = String(y);
	
	return day+"/"+month+"/"+year;

}