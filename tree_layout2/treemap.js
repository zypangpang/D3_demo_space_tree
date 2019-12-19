function tree_map(data,div_id) {
    const width = 1000, height = 1000;
    //let format = d3.format(",d");
    let color = d3.scaleOrdinal(d3.schemeCategory10);
    data=d3.hierarchy(data)
        .count()
        .sort((a, b) => b.value - a.value);
    //data.eachBefore(d=>d.value=d.data.value);

    root = d3.treemap()
        .tile(d3.treemapSquarify)
        .size([width, height])
        .padding(2)
        .round(true)
        (data);

    const svg = d3.select(`#${div_id}`).append("svg")
        .attr("viewBox", [0, 0, width, height])
        .style("font", "10px sans-serif");

    const leaf = svg.selectAll("g")
        .data(root.leaves())
        .join("g")
        .attr("transform", d => `translate(${d.x0},${d.y0})`);

    leaf.append("title")
        .text(d => `${d.ancestors().reverse().map(d => d.data.name).join("/")}\n${d.data.value}`);

    leaf.append("rect")
        //.attr("id", d => (d.leafUid = DOM.uid("leaf")).id)
        .attr("fill", d => {
            while (d.depth > 1) d = d.parent;
            return color(d.data.name);
        })
        .attr("fill-opacity", 0.6)
        .attr("width", d => d.x1 - d.x0)
        .attr("height", d => d.y1 - d.y0);

    //leaf.append("clipPath")
        //.attr("id", d => (d.clipUid = DOM.uid("clip")).id)
     //   .append("use")
        //.attr("xlink:href", d => d.leafUid.href);

    leaf.append("text")
        //.attr("clip-path", d => d.clipUid)
        .selectAll("tspan")
        //.data(d => {console.log(d.data.name);return d.data.name.split(/(?=[A-Z][^A-Z])/g).concat(d.data.value);})
        .data(d=>[d.data.name,d.data.value])
        .join("tspan")
        .attr("x", 3)
        .attr("y", (d, i, nodes) => `${(i === nodes.length - 1) * 0.3 + 1.1 + i * 0.9}em`)
        .attr("fill-opacity", (d, i, nodes) => i === nodes.length - 1 ? 0.7 : null)
        .text(d => d);
}
//d3.json("../data/flare-2.json").then(tree_map).catch(error=>console.log(error));
