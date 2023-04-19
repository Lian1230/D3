async function draw() {
  const dataset = await d3.json("data.json")

  const xAccessor = d => d.currently.humidity
  const yAccessor = d => d.currently.apparentTemperature

  const dimensions = {
    width: 800,
    height: 800,
    margin: {
      top: 50,
      left: 50,
      bottom: 50,
      right: 50,
    },
  }

  dimensions.ctrWidth = dimensions.width - dimensions.margin.left - dimensions.margin.right
  dimensions.ctrHeight = dimensions.height - dimensions.margin.top - dimensions.margin.bottom

  const xScale = d3
    .scaleLinear()
    .domain(d3.extent(dataset, xAccessor))
    .rangeRound([0, dimensions.ctrWidth])
    .nice()
    .clamp(true)

  const yScale = d3
    .scaleLinear()
    .domain(d3.extent(dataset, yAccessor))
    .rangeRound([dimensions.ctrHeight, 0])
    .nice()
    .clamp(true)

  const svg = d3
    .select("#chart")
    .append("svg")
    .attr("width", dimensions.width)
    .attr("height", dimensions.height)

  const ctr = svg
    .append("g")
    .attr("transform", `translate(${dimensions.margin.left}, ${dimensions.margin.top})`)

  const tooltip = d3.select("#tooltip")

  // ctr.append("circle").attr("r", 15);
  // Draw the circles
  ctr
    .selectAll("circle")
    .data(dataset)
    .join("circle")
    .attr("cx", d => xScale(xAccessor(d)))
    .attr("cy", d => yScale(yAccessor(d)))
    .attr("r", 5)
    .attr("fill", "red")
    .attr("data-temp", yAccessor)

  // Axes
  const xAxis = d3
    .axisBottom(xScale)
    .ticks(5)
    .tickFormat(d => d * 100 + "%")

  const xAxisGroup = ctr
    .append("g")
    .call(xAxis)
    .style("transform", `translateY(${dimensions.ctrHeight}px)`)
    .classed("axis", true)

  xAxisGroup
    .append("text")
    .attr("x", dimensions.ctrWidth / 2)
    .attr("y", dimensions.margin.bottom - 10)
    .attr("fill", "black")
    .text("Humidity")

  const yAxisGroup = ctr.append("g").call(d3.axisLeft(yScale)).classed("axis", true)
  // .style("transform", `translateY(${dimensions.ctrHeight}px)`)

  yAxisGroup
    .append("text")
    .attr("x", -dimensions.ctrHeight / 2)
    .attr("y", -dimensions.margin.left + 15)
    .attr("fill", "black")
    .html("Temperature &deg; F")
    .style("transform", "rotate(-90deg)")
    .style("text-anchor", "middle")

  const delaunay = d3.Delaunay.from(
    dataset,
    d => xScale(xAccessor(d)),
    d => yScale(yAccessor(d))
  )

  const voronoi = delaunay.voronoi()

  voronoi.xmax = dimensions.ctrWidth
  voronoi.ymax = dimensions.ctrHeight

  ctr
    .append("g")
    .selectAll("path")
    .data(dataset)
    .join("path")
    .attr("stroke", "black")
    .attr("fill", "transparent")
    .attr("d", (d, i) => voronoi.renderCell(i))
    .on("mouseenter", (evt, datum) => {
      ctr
        .append("circle")
        .classed("dot-hovered", true)
        .attr("cx", () => xScale(xAccessor(datum)))
        .attr("cy", () => yScale(yAccessor(datum)))
        .attr("fill", "#120078")
        .attr("r", 8)
        .style("pointer-events", "none")

      tooltip
        .style("display", "block")
        .style("top", yScale(yAccessor(datum)) - 50 + "px")
        .style("left", xScale(xAccessor(datum)) + "px")

      const formatter = d3.format(".2f")
      const dateFormater = d3.timeFormat("%A, %B %e")

      tooltip.select(".metric-humidity span").text(formatter(xAccessor(datum)))
      tooltip.select(".metric-temp span").text(formatter(yAccessor(datum)))
      tooltip.select(".metric-date").text(dateFormater(datum.currently.time))
    })
    .on("mouseleave", (evt, datum) => {
      ctr.select(".dot-hovered").remove()
      // d3.select(evt.target).attr("fill", "red").attr("r", 5)
      tooltip.style("display", "none")
    })
}

draw()
