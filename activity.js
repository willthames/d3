
function json_to_records(json) { 
    var records = json.records;
    
    // parse numbers correctly
    records.forEach(function(d) { 
        d.x = +d.d;
        d.y = +d.v;
    }); 
    return records;
}

function json_to_laps(json, xValue) { 
    var laps = [];
    for (var i = 0, n = json.laps.length; i < n; i++) { 
        var x0 = (i==0 ? 0 : laps[i-1].x1)
        var lap = {
            x0: x0,
            x1: +xValue(json.laps[i]) + x0
        };
        laps.push(lap);
    }
    return laps;
}

function drawGraph(json, xValue, yValue, 
                   width, height) { 

    var m = [0.1 * width, 0.1 * height, 0.1 * width, 0.1 * height];
    var x = d3.scale.linear().range([0, width]),
        y = d3.scale.linear().range([height,0]),
        xAxis = d3.svg.axis().scale(x),
        yAxis = d3.svg.axis().scale(y).orient("left");

    records = json_to_records(json);
    laps = json_to_laps(json, xValue);
    
    x.domain([0, xValue(records[records.length - 1])]);
    y.domain([0, 1.1*d3.max(records, yValue)]);

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
      .x(function(d) { return x(xValue(d)); })
      .y(function(d) { return y(yValue(d)); })


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
