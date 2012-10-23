var two_dp = d3.format(".2f");

function time_to_string(seconds) {
    var result = ""

    zeropad = d3.format("02d");
    seconds = Math.round(seconds);
    if (Math.floor(seconds / 3600)) { 
        result = zeropad(Math.floor(seconds/3600)) + ":"; 
        seconds = seconds % 3600;
    }
    result = result + zeropad(Math.floor(seconds/60)) + ":";
    seconds = seconds % 60;
    return result + zeropad(seconds);
}

var speed = {
    value: function(d) { return +d.v; },
    name: "speed",
    units: "km/h",
    toString: function(d) { return d.v; }
};

var distance = { 
    value: function(d) { return (+d.d) / 1000; }, 
    name: "distance",
    units: "km",
    toString: function(d) { return (+d.d) / 1000; }
};

var altitude = { 
    value: function(d) { return +d.a; },
    name: "altitude",
    units: "m",
    toString: function(d) { return d.a; }
};

var time = { 
    value: function(d) { return +d.t; },
    name: "time",
    toString: function(d) { return time_to_string(+d.t); }
};
    
// json_to_laps converts raw lap data into something more useful
// for drawing laps and more particularly lap summary data 
// where we typically don't want the cumulative data
function json_to_laps(json, xObject) { 
    var laps = [];
    var time_x0 = 0, distance_x0 = 0;
    for (var i = 0, n = json.laps.length; i < n; i++) { 
        var lap = {
            time: { 
                x0: time_x0,
                width: time.value(json.laps[i]) - time_x0
            },
            distance: { 
                x0: distance_x0,
                width: distance.value(json.laps[i]) - distance_x0
            }
        };
        time_x0 = time_x0 + lap.time.width; 
        distance_x0 = distance_x0 + lap.distance.width; 
        // alert (lap.x0 + " " + lap.x1);
        laps.push(lap);
    }
    return laps;
}

function drawGraph(json, xObject, yObject,
                   width, height) { 

    // margins start at top and go clockwise
    var m = [0.1 * height, 0.1 * width, 0.15 * height, 0.15 * width];
    var x = d3.scale.linear().range([0, width]),
        y = d3.scale.linear().range([height,0]),
        xAxis = d3.svg.axis().scale(x),
        yAxis = d3.svg.axis().scale(y).orient("left");

    records = json.records;
    laps = json_to_laps(json, xObject);
    
    x.domain([xObject.value(records[0]), 
              xObject.value(records[records.length - 1])]);
    y.domain([0, 1.1*d3.max(records, yObject.value)]);

    var svg = d3.select("body").append("div").append("svg:svg")
        .attr("width", width + m[1] + m[3])
        .attr("height", height + m[0] + m[2])
      .append("svg:g")
        .attr("transform", "translate(" + m[3] + "," + m[0] +")");

    // Add the laps
    var xName = xObject.name
    svg.selectAll(".fish")
        .data(laps)
      .enter().append("svg:rect")
        .attr("x", function(d) { return x(d[xObject.name].x0) })
        .attr("width", function(d) { return x(d[xName].width) })
        .attr("y", function(d) { return 0 })
        .attr("height", function(d) { return height })
        .attr("class", function(d,i) { return (i+1)%2==0 ? "even" : "odd" })

    // line generator
    var line = d3.svg.line()
      .x(function(d) { return x(xObject.value(d)); })
      .y(function(d) { return y(yObject.value(d)); })

    // An area generator, for the light fill.
    var area = d3.svg.area()
        .x(function(d) { return x(xObject.value(d)); })
        .y0(height)
        .y1(function(d) { return y(yObject.value(d)); })

    // Add the area below the line
    svg.append("svg:path")
        .attr("class", "area " + yObject.name)
        .attr("d", area(records));

    // Add the line path.
    svg.append("svg:path")
        .attr("class", "line " + yObject.name)
        .attr("clip-path", "url(#clip)")
        .attr("d", line(records));

    // Add the x-axis.
    svg.append("svg:g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    // Add the y-axis.
    svg.append("svg:g")
        .attr("class", "y axis")
        .call(yAxis);

    // Add some axes labels.
    svg.append("text")
        .attr("class", "x label")
        .attr("text-anchor", "center")
        .attr("x", width/2)
        .attr("y", height)
        .attr("dy", "24pt")
        .text(xObject.name + (xObject.units ? " (" + xObject.units + ")" : ""));

    svg.append("text")
        .attr("class", "y label")
        .attr("text-anchor", "end")
        .attr("x", height)
        .attr("y", 0)
        .attr("transform", "translate(-30," + height + " ) rotate(-90)")
        .text(yObject.name + (yObject.units ? " (" + yObject.units + ")" : ""));
}


function summaryData(json) { 

    var summary = d3.select("body").append("table")
                      .attr("id", "summaryTable")
                      .attr("class", "table table-bordered"),
        tbody = summary.append("tbody");

    summary_values = { 
        "Start time" : moment(1000 * json.summary.t_start).format("DD/MM/YYYY HH:mm"),
        "Duration" : time_to_string(json.summary.t - json.summary.t_start),
        "Distance" : two_dp(distance.value(json.summary)) +
                                  " " + distance.units,
        "Total Ascent" : json.summary.asc + " m",
        "Total Descent" : json.summary.desc + " m",
        "Max speed" : two_dp(json.summary.v_max) + " m/s",
        "Average speed": two_dp(json.summary.v_avg) + " m/s",
        "Calories": json.summary.cals
    };

    for (var key in summary_values) { 
        row = tbody.append("tr");
        row.append("th").text(key);
        row.append("td").text(summary_values[key])
    }
}

function lapData(json) { 
    var laps = json_to_laps(json);
    var columns = [ "Lap", "Duration", "Distance", "Speed" ];

    var lapTable = d3.select("body").append("table")
                       .attr("id", "lapTable")
                       .attr("class", "table table-bordered table-striped"),
        thead = lapTable.append("thead"), 
        tbody = lapTable.append("tbody");

    thead.append("tr")
        .selectAll("th")
        .data(columns)
        .enter()
        .append("th")
            .text(function(column) { return column; });

    var rows = tbody.selectAll("tr")
        .data(laps)
        .enter()
        .append("tr")
        .attr("class", 
              function(d, i) { return "lap " + ((i+1)%2 == 0 ? "even" : "odd") });


    var cells = rows.selectAll("td")
        .data(function(row, index) { 
            return [ index+1, time_to_string(row.time.width), 
                     two_dp(row.distance.width),
                     two_dp(3600 * row.distance.width / row.time.width) ]
        })
        .enter()
        .append("td")
            .text(function(d) { return d; });
                     
}

function title(json) { 
    var titleh1 = d3.select("body").append("h1")

    titleStr = moment(1000 * json.summary.t_start).format("DD/MM/YYYY");
    titleStr += " " + two_dp(distance.value(json.summary)) + " km";
    titleStr += " " + time_to_string(json.summary.t - json.summary.t_start);    
    titleh1.text(titleStr);
}

function getLongLat(lon, lat) { 
    return new OpenLayers.LonLat( lon, lat)
        .transform(
            new OpenLayers.Projection("EPSG:4326"), // transform from WGS 1984
            map.getProjectionObject() // to Spherical Mercator Projection
        );
}

function drawMap(json) { 

    function project(x) {
        var point = map.latLngToLayerPoint(new L.LatLng(x[1], x[0]));
        return [point.x, point.y];
    }

    var points = [];
    for (var i = 0, n = json.records.length; i < n; i++) { 
        var point = [ json.records[i].lng, json.records[i].lat ];
        points.push(point);
    }
    var geojson = { 
        type: "LineString",
        coordinates: points,
        bbox: [ [ +json.summary.swc_lng, +json.summary.swc_lat ],
                [ +json.summary.nec_lng, +json.summary.nec_lat ] ]
    };
 
    var bounds = d3.geo.bounds(geojson),
        path = d3.geo.path().projection(project);
          
    d3.select("body").append("div")
        .attr("id", "map");

    var centerX = (+json.summary.nec_lng + +json.summary.swc_lng)/2.0;
    var centerY = (+json.summary.nec_lat + +json.summary.swc_lat)/2.0;

    var map = new L.Map("map")
        .setView(new L.LatLng(centerY, centerX), 14)
        .addLayer(new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'));

    var svg = d3.select(map.getPanes().overlayPane).append("svg"),
        g = svg.append("g");

    var feature = g.selectAll("path")
        .data(geojson)
      .enter().append("path")
        .attr("d", path);

    map.on("viewreset", reset);
    reset();

    // Reposition the SVG to cover the features.
    function reset() {
        var bottomLeft = project(bounds[0]),
            topRight = project(bounds[1]);

        svg .attr("width", topRight[0] - bottomLeft[0])
            .attr("height", bottomLeft[1] - topRight[1])
            .style("margin-left", bottomLeft[0] + "px")
            .style("margin-top", topRight[1] + "px");

        g.attr("transform", "translate(" + -bottomLeft[0] + "," + -topRight[1] + ")");
        feature.attr("d", path);
    }

}
