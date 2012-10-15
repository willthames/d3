function time_to_string(seconds) {
    var result = ""
    if (seconds / 3600) { 
        result = sprintf("%d:", seconds/3600); 
        seconds = seconds % 3600;
    }
    result = result + sprintf("%02d:", seconds/60);
    seconds = seconds % 60;
    return result + sprintf("%02d", seconds);
}

var speed = {
    value: function(d) { return +d.v; },
    name: "Speed",
    units: "km/h",
    toString: function(d) { return d.v; }
};

var distance = { 
    value: function(d) { return (+d.d) / 1000; }, 
    name: "Distance",
    units: "km",
    toString: function(d) { return (+d.d) / 1000; }
};

var altitude = { 
    value: function(d) { return +d.a; },
    name: "Altitude",
    units: "m",
    toString: function(d) { return d.a; }
};

var time = { 
    value: function(d) { return +d.t; },
    name: "Time",
    toString: function(d) { return time_to_string(+d.t); }
};
    

function json_to_laps(json, xObject) { 
    var laps = [];
    var x0 = 0;
    for (var i = 0, n = json.laps.length; i < n; i++) { 
        var lap = {
            x0: x0,
            x1: xObject.value(json.laps[i])
        };
        x0 = lap.x1; 
        // alert (lap.x0 + " " + lap.x1);
        laps.push(lap);
    }
    return laps;
}

function drawGraph(json, xObject, yObject,
                   width, height) { 

    var m = [0.1 * width, 0.1 * height, 0.1 * width, 0.1 * height];
    var x = d3.scale.linear().range([0, width]),
        y = d3.scale.linear().range([height,0]),
        xAxis = d3.svg.axis().scale(x),
        yAxis = d3.svg.axis().scale(y).orient("left");

    records = json.records;
    laps = json_to_laps(json, xObject);
    
    x.domain([xObject.value(records[0]), 
              xObject.value(records[records.length - 1])]);
    y.domain([0, 1.1*d3.max(records, yObject.value)]);

    var svg = d3.select("body").append("svg:svg")
        .attr("width", width + m[1] + m[3])
        .attr("height", height + m[0] + m[2])
      .append("svg:g")
        .attr("transform", "translate(" + m[3] + "," + m[0] +")");

    // Add the laps
    svg.selectAll(".fish")
        .data(laps)
      .enter().append("svg:rect")
        .attr("x", function(d) { return x(d.x0) })
        .attr("width", function(d) { return x(d.x1 - d.x0) })
        .attr("y", function(d) { return 0 })
        .attr("height", function(d) { return height })
        .attr("class", function(d,i) { return i%2==0 ? "even" : "odd" })

    // line generator
    var line = d3.svg.line()
      .x(function(d) { return x(xObject.value(d)); })
      .y(function(d) { return y(yObject.value(d)); })


    // Add the line path.
    svg.append("svg:path")
        .attr("class", "line")
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
}
