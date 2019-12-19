const width=1000,radius=width/2;
function autoBox() {
    const {x, y, width, height} = this.getBBox();
    return [x, y, width, height];
}

function radial_tree(data,div_id) {
    let badge = d3.select("#focus_name");
// Three function that change the tooltip when user hover / move / leave a cell
    let mouseover = function(d) {
        let text=`${d.data.value}`;
        badge.style("opacity", 1);
        badge.html(text);
    };
    /*let mousemove = function(d) {
        let text=`[${d.data.value}]`;
        Tooltip.html(text)
            .style("left", (d3.mouse(this)[0]+520) + "px")
            .style("top", (d3.mouse(this)[1]-10) + "px")
    };*/
    let mouseleave = function(d) {
        badge.style("opacity", 0);
        //d3.select(this).style("stroke", "none")
    };

    let tree = d3.tree()
        .size([2 * Math.PI, radius])
        .separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth);

    //root = tree(d3.hierarchy(data).sort((a, b) => d3.ascending(a.data.name, b.data.name)));
    root=d3.hierarchy(data);//.sort((a, b) => d3.ascending(a.data.name, b.data.name));
    root.descendants().forEach((d,i)=>{
       d.id=i;
       d.x0=0; d.y0=0;
       d._children=d.children;
    });

    function update(source) {
        let duration = d3.event && d3.event.altKey ? 2000 : 500;
        tree(root);
        const link =link_g.selectAll("path")
            .data(root.links(),d=>d.target.id);

        link.exit()
            .transition().duration(duration)
            .remove()
            .attr("d",d3.linkRadial()
                .angle(d=>source.x)
                .radius(d=>source.y));

        const linkEnter=link.enter().append('path')
            .attr("d",d3.linkRadial()
                .angle(d=>source.x0)
                .radius(d=>source.y0));

        link.merge(linkEnter)
            .transition().duration(duration)
            .attr("d",d3.linkRadial()
                .angle(d=>d.x)
                .radius(d=>d.y));

        const nodes=node_g.selectAll("g")
            .data(root.descendants().reverse(),d=>d.id);

      nodes.selectAll("text").attr("dy", "0.31em")
            .text(d => d.data.name)
            .attr("x", d => d.x < Math.PI? 6 : -6)
            .attr("text-anchor", d => d.x < Math.PI? "start" : "end")
            .attr("transform", d => d.x >= Math.PI? "rotate(180)" : null);

        nodes.exit().transition().duration(duration).remove()
            .attr("transform", d => `
        rotate(${source.x * 180 / Math.PI - 90})
        translate(${source.y},0)`)
            .attr("fill-opacity", 0)
            .attr("stroke-opacity", 0);

        const new_nodes=nodes.enter().append("g")
            .classed("node",true)
            .attr("transform", d => `
        rotate(${source.x0 * 180 / Math.PI - 90})
        translate(${source.y0},0)`)
            .attr("fill-opacity", 0)
            .attr("stroke-opacity", 0);

        new_nodes.append("circle")
            .attr("fill", d => d.children ? "#555" : "#999")
            .attr("id", d => `c${d.id}`)
            .attr("r", circle_r);

        new_nodes.append("text")
            .attr("dy", "0.31em")
            .attr("x", d => d.x < Math.PI? 6 : -6)
            //.attr("text-anchor","end")
            .attr("text-anchor", d => d.x < Math.PI? "start" : "end")
            .attr("transform", d => d.x >= Math.PI? "rotate(180)" : null)
            .text(d => d.data.name)
            .clone(true).lower()
            .attr("stroke", "white");

        nodes.merge(new_nodes).transition().duration(duration)
            .attr("transform", d => `
        rotate(${d.x * 180 / Math.PI - 90})
        translate(${d.y},0)`)
            .attr("fill-opacity", 1)
            .attr("stroke-opacity", 1);

        d3.selectAll(".node").on('click',d=>{
            d.children=d.children?null:d._children;
            update(d);
        }).on("mouseover",mouseover)
         //.on("mousemove",mousemove)
         .on("mouseleave",mouseleave);
        root.eachBefore(d => {
            d.x0 = d.x;
            d.y0 = d.y;
        });
    }

    function zoomed() {
        svg.attr("transform", d3.event.transform);
    }

    const base_svg = d3.select(div_id).append("svg")
        .style("height", 'auto')
        .style("font", "14px sans-serif")
        .style("margin", "5px");
    const svg = base_svg.append('g');

    let circle_r=5;
    base_svg.call(d3.zoom()
    //.extent([[0,0],[400,400]])
        .scaleExtent([0.5, 8])
        .on("zoom", zoomed));

    const link_g = svg.append("g")
        .attr("fill", "none")
        .attr("stroke", "#555")
        .attr("stroke-opacity", 0.4)
        .attr("stroke-width", 2.5);
    const node_g = svg.append("g")
        .attr("stroke-linejoin", "round")
        .attr("stroke-width", 5);

    update(root);

    d3.select(`#c${root.id}`).style("fill", "red");

    base_svg.attr("viewBox",[-510,-510,1010,1010]);
}
