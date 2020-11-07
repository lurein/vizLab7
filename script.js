

Promise.all([ // load multiple files
	d3.json('airports.json'),
	d3.json('world-110m.json')
]).then(data=>{ // or use destructuring :([airports, wordmap])=>{ ... 
	let airports = data[0];
	let worldmap = data[1];

	let visType = 'force';
	var transition = d3.transition();

	console.log(airports)

	const margin = ({top: 20, right: 20, bottom: 20, left: 20});
	const width = 700 - margin.left - margin.right;
	const height = 700 - margin.top - margin.bottom;
	const svg = d3.select('.nodeDiagram')
		.append('svg')
		.attr('width', width + margin.left + margin.right)
		.attr('height', height + margin.top + margin.bottom)
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");


	const circleScale = d3
		.scaleLinear()
		.range([6, 12])
		.domain([d3.min(airports.nodes, function(d) { return d.passengers; }), d3.max(airports.nodes, function(d) { return d.passengers; })])


	d3.selectAll("input[name=chartType]").on("change", event=>{
			visType = event.target.value;// selected button
			console.log(visType)
			switchLayout()
		});

	let mapData = topojson.feature(worldmap, worldmap.objects.countries)
	console.log(mapData)

	var projection = d3.geoMercator()
	projection.fitExtent([[0,0], [width,height]], mapData)

	var path = d3.geoPath()
		.projection(projection);
		
	var mapChart = svg.append("path")
		.datum(mapData)
		.attr("d", path)
		.style("opacity", 0)
	
	var countryLines =	svg.append("path")
		.datum(topojson.mesh(worldmap, worldmap.objects.countries))
		.attr("d", path)
		.attr('fill', 'none')
			.attr('stroke', 'white')
		.attr("class", "subunit-boundary")
		.style("opacity", 0)
	

	const force = d3.forceSimulation(airports.nodes)
			.force('charge', d3.forceManyBody())
			.force('link', d3.forceLink(airports.links))
			.force('x', d3.forceX(350))
			.force('y', d3.forceY(200))


		const link = svg.selectAll('path.link')
			.data(airports.links)
			.enter()
			.append('path')
			.attr('stroke', 'black')
			.attr('fill', 'none')

		const nodes = svg.selectAll('circle')
			.data(airports.nodes)
			.enter()
			.append('circle')
			.attr('r', d=>circleScale(d.passengers))
			.attr('fill', 'orange')
			.call(drag(force));

		nodes.append("title")
			.text(d=>d.name);

		const lineGenerator = d3.line();

		force.on('tick', () => {
			nodes.attr('cx', d=> d.x)
			nodes.attr('cy', d=> d.y)
			link.attr('d', d => lineGenerator([
				[d.source.x, d.source.y], 
				[d.target.x, d.target.y]]) 
			)

		})


		function drag(simulation) {
  
			function dragstarted(event) {
			  if(visType === "force") {	
				if (!event.active) simulation.alphaTarget(0.3).restart();
				event.subject.fx = event.subject.x;
				event.subject.fy = event.subject.y;
			  }
			}
			
			function dragged(event) {
			  event.subject.fx = event.x;
			  event.subject.fy = event.y;
			}
			
			function dragended(event) {
			  if (!event.active) simulation.alphaTarget(0);
			  event.subject.fx = null;
			  event.subject.fy = null;
			}
			
			return d3.drag()
				.on("start", dragstarted)
				.on("drag", dragged)
				.on("end", dragended);
		  }

	function switchLayout(){
		if (visType === "map") {
			// stop the simulation
			force.stop()
			// set the positions of links and nodes based on geo-coordinates
			nodes.attr('cx', d=> d.x = projection([d.longitude, d.latitude])[0])
			nodes.attr('cy', d=> d.y = projection([d.longitude, d.latitude])[1])

			link.attr('d', d => lineGenerator([
				[d.source.x, d.source.y], 
				[d.target.x, d.target.y]]) 
			)
			// set the map opacity to 1
			mapChart.style("opacity", 1.0)
			countryLines.style("opacity", 1.0)
		} else { // force layout
			// restart the simulation
			force.restart()
			// set the map opacity to 0
			mapChart.style("opacity", 0)
			countryLines.style("opacity", 0)
		}
	}

})