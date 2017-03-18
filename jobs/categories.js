'use strict';

openHealth.getScript(['https://d3js.org/d3.v3.min.js'], function () {
  // Query first 1000 NY medicare inpatients data through SODA service.
  // Then, process and visualize the data.
  openHealth.soda("https://health.data.ny.gov/resource/2yck-xisk.json", function (inpatients) {
    visualize(process(inpatients));
  });

  // Count the number of inpatients for each kind of major diagnostic category,
  // and visualize the result in a bar chart and a pie chart.
  function process(inpatients) {
    // From the raw inpatients data, generate a map whose format is
    // { name of category => number of inpatients }.
    var categoryCounts = {};
    inpatients.map(function (inpatient) {
      var category = inpatient.major_diagnostic_category;
      if (category in categoryCounts) {
        categoryCounts[category]++;
      } else {
        categoryCounts[category] = 1;
      }
    });

    // Convert the previous map to an array whose format is
    // [ { label => name of category, value: number of inpatients }, ... ]
    var visualizedData = [];
    Object.keys(categoryCounts).map(function (k, i) {
      visualizedData.push({
        'label': k,
        'value': categoryCounts[k]
      });
    });

    return visualizedData;
  }

  // Visualize the input data in a bar chart and a pie chart.
  function visualize(data) {
    barChart(data);
    pieChart(data);
  }

  // Generate the bar chart of number of inpatients of each major diagnostic category.
  function barChart(data) {
    var div = d3.select("body").append("div").attr("class", "toolTip");

    var axisMargin = 20,
      margin = 40,
      valueMargin = 4,
      width = parseInt(d3.select('body').style('width'), 10),
      height = parseInt(d3.select('body').style('height'), 10),
      barHeight = (height - axisMargin - margin * 2) * 0.4 / data.length,
      barPadding = (height - axisMargin - margin * 2) * 0.6 / data.length,
      labelWidth = 0;

    var max = d3.max(data, function (d) {
      return d.value;
    });

    var colors = ['#7E57C2', '#3F51B5', '#039BE5', '#009688', '#43A047', '#827717'];
    var colorScale = d3.scale.quantize()
      .domain([0, data.length])
      .range(colors);

    var svg = d3.select('body')
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    var bar = svg.selectAll("g")
      .data(data)
      .enter()
      .append("g")
      .style('fill', function (d, i) {
        return colorScale(i);
      });

    bar.attr("class", "bar")
      .attr("cx", 0)
      .attr("transform", function (d, i) {
        return "translate(" + margin + "," + (i * (barHeight + barPadding) + barPadding) + ")";
      });

    bar.append("text")
      .attr("class", "label")
      .attr("y", barHeight / 2)
      .attr("dy", ".35em")
      .text(function (d) {
        return d.label;
      }).each(function () {
      labelWidth = Math.ceil(Math.max(labelWidth, this.getBBox().width));
    });

    var scale = d3.scale.linear()
      .domain([0, max])
      .range([0, width - margin * 2 - labelWidth]);

    var xAxis = d3.svg.axis()
      .scale(scale)
      .tickSize(-height + 2 * margin + axisMargin)
      .orient("bottom");

    bar.append("rect")
      .attr("transform", "translate(" + labelWidth + ", 0)")
      .attr("height", barHeight)
      .attr("width", function (d) {
        return scale(d.value);
      });

    bar.append("text")
      .attr("class", "value")
      .attr("y", barHeight / 2)
      .attr("dx", -valueMargin + labelWidth)
      .attr("dy", ".35em")
      .attr("text-anchor", "end")
      .text(function (d) {
        return d.value;
      })
      .attr("x", function (d) {
        var width = this.getBBox().width;
        return Math.max(width + valueMargin, scale(d.value));
      });

    bar.on("mousemove", function (d) {
      div.style("left", d3.event.pageX + 10 + "px");
      div.style("top", d3.event.pageY - 25 + "px");
      div.style("display", "inline-block");
      div.html((d.label) + "<br>" + d.value);
    });

    bar.on("mouseout", function () {
      div.style("display", "none");
    });

    svg.insert("g", ":first-child")
      .attr("class", "axisHorizontal")
      .attr("transform", "translate(" + (margin + labelWidth) + "," + (height - axisMargin - margin) + ")")
      .call(xAxis);
  }

  // Generate a pie chart shows proportion of inpatients for each major diagnostic category.
  function pieChart(data) {
    var width = 800;
    var height = 500;
    var radius = 200;

    var colors = ['#F8BBD0', '#D1C4E9', '#C5CAE9', '#BBDEFB', '#80DEEA', '#A5D6A7'];
    var colorScale = d3.scale.quantize()
      .domain([0, data.length])
      .range(colors);

    var svg = d3.select("body")
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    var arc = d3.svg.arc()
      .outerRadius(radius)
      .innerRadius(30);

    var pie = d3.layout.pie()
      .sort(null)
      .value(function (d) {
        return d.value;
      });

    var g = svg.selectAll(".fan")
      .data(pie(data))
      .enter()
      .append("g")
      .attr("class", "fan");

    g.append("path")
      .attr("d", arc)
      .attr("fill", function (d, i) {
        return colorScale(i);
      });

    g.append("text")
      .attr("transform", function (d) {
        return "translate(" + arc.centroid(d) + ")";
      })
      .style("text-anchor", "middle")
      .text(function (d) {
        if (d.data.label.length > 30) {
          return d.data.label.substring(0, 30) + '...';
        }
        return d.data.label;
      });
  }
});