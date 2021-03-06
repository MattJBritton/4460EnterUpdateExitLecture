const margin = { top: 30, right: 120, bottom: 40, left: 40 };
const width = 1400 - margin.left - margin.right;
const height = 700 - margin.top - margin.bottom;
const topK = 30;

var yearFilter = 2018;
var filteredData = [];
var svg;
var raw_data, dataByYear, deficitByYear;
var xScale, yScale, colorScale, xAxis, yAxis;

function setup() {

  svg = d3.select("#main")
    .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  svg.append("text")
    .attr("x", 6)
    .attr("y", -2)
    .attr("class", "label")
    .text("Imports (Millions of Dollars)");

  svg.append("text")
    .attr("x", width-2)
    .attr("y", height-6)
    .attr("text-anchor", "end")
    .attr("class", "label")
    .text("Exports (Millions of Dollars)");      
}

function filter_data() {
  filteredData = dataByYear.filter(d=> d.key==yearFilter)[0]["values"];
  if(topK != null) {
    filteredData = filteredData.slice(0, topK);
  }
}

function updateScalesFromData() {

  xScale.domain([0,d3.max(filteredData,d=> d.Imports)]).nice();
  yScale.domain([0,d3.max(filteredData,d=> d.Imports)]).nice();
  xAxis.scale(xScale);
  yAxis.scale(yScale);
  d3.select(".x.axis").call(xAxis);
  d3.select(".y.axis").call(yAxis);
}

function build_scales() {

  xScale = d3.scaleSqrt()
    .range([0,width]);

  yScale = d3.scaleSqrt()
    .range([height,0]);

  xAxis = d3.axisBottom()
    .tickSize(-height)
    .ticks(5)
    .scale(xScale);

  yAxis = d3.axisLeft()
    .tickSize(-width)
    .ticks(5)
    .scale(yScale)

  colorScale = d3.scaleOrdinal()
    .domain(Array.from(new Set(raw_data.map(d=> d.Continent))))
    .range(d3.schemeCategory10);

  svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .attr("class", "x axis")
    .call(xAxis);

  svg.append("g")
    .attr("transform", "translate(0,0)")
    .attr("class", "y axis")
    .call(yAxis);  
}

function build_legend() {

  var legend = svg.selectAll(".legend")
      .data(colorScale.domain())
    .enter().append("g")
      .attr("class", "legend")
      .attr("transform", function(d, i) {
        return "translate(2," + i * 14 + ")"; 
      });

  legend.append("rect")
      .attr("x", width)
      .attr("width", 12)
      .attr("height", 12)
      .style("fill", colorScale);

  legend.append("text")
      .attr("x", width + 16)
      .attr("y", 6)
      .attr("dy", ".35em")
      .style("text-anchor", "start")
      .text(d=> d);
}

function build_scatterplot() {

  var bubbleSelection = svg.selectAll("g.bubble")
    .data(filteredData, d=> d.Country)
    .enter()
    .append("g")
    .attr("class", "bubble")
    .attr("transform", function(d) {
      return "translate(" + xScale(d.Exports) + ","
      + yScale(d.Imports) + ")";
    });

  bubbleSelection
    .append("circle")
    .attr("r", 5)
    .style("fill", d=>colorScale(d.Continent))

  bubbleSelection
    .append("text")
    .attr("x", 5)
    .attr("alignment-baseline", "middle")
    .text(d=> d.Country);
}

function setYearFilter(inYear) {

  yearFilter = inYear;
  updateBarChart();
  filter_data();
  updateScalesFromData();
  build_scatterplot();
}

function initialize() {

  setup();
  filter_data();
  build_scales();
  updateScalesFromData();
  build_legend();
  build_scatterplot();
}

//load data
d3.csv("trade.csv", function(error, data) {

  // data pre-processing
  data.forEach(function(d) {
    d.Imports = +d.Imports;
    d.Exports = +d.Exports;
    d.Balance = +d.Exports-d.Imports;
    d.Year = +d.Year;
  });

  raw_data = data;

  dataByYear = d3.nest()
    .key(d=> d.Year)
    .sortValues((a,b)=> {return b.Imports-a.Imports})
    .entries(data);

  deficitByYear = d3.nest()
    .key(d=> d.Year)
    .rollup(yr => d3.sum(yr, d=>d.Balance))
    .entries(data);

  deficitByYear.forEach(d=>{
    d.key = +d.key;
    d.value = Math.abs(d.value);
  })
  deficitByYear.sort((a,b)=> b.key-a.key)

  initialize();
});




