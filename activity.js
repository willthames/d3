function json_to_records(json) { 
    var records = json.records;
    
    // parse numbers correctly
    records.forEach(function(d) { 
        d.x = +d.d;
        d.y = +d.v;
    }); 
    return records;
}

function json_to_laps(json) { 
    var laps = [];
    for (var i = 0, n = json.laps.length; i < n; i++) { 
        var x0 = (i==0 ? 0 : laps[i-1].x1)
        var lap = {
            x0: x0,
            x1: +json.laps[i].d + x0
        };
        laps.push(lap);
    }
    return laps;
}

function velocityGraph(records, width, height, by_distance = true) { 

}

function altitudeGraph(records, width, height, by_distance = true) { 

}

function lapTable(laps) {

}


