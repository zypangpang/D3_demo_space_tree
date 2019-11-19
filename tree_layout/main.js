//d3.select("body").transition().style("background-color","red");
/*async function getData() {
    return await d3.json("data.json");
}*/
if (!Array.prototype.last){
    Array.prototype.last = function(){
        return this[this.length - 1];
    };
}

function computeWH(data) {

}
let node_coords=[];
function calNodeXY(node) {
    let nodeXYs=[];
    if(!node.childs.length)
        return {'x': 1, 'y': 1, 'w': 1, }; //x,y,w,h
    node.childs.forEach(child=>{nodeXYs.push(calNodeXY(child));});
    let cur_w=0,max_y=-1;//,max_h=-1;
    for(let node of nodeXYs){
        node.x+=cur_w;
        cur_w+=node.w;
        max_y=node.y>max_y?node.y:max_y;
        //max_h=node.h>max_y?node.h:max_y;
    }
    nodeXYs.forEach(nd=>{nd.y=max_y;});
    node_coords= node_coords.concat(nodeXYs);
    //node.childs.map((node,i)=>{node.coords=nodeXYs[i];});
    let x=(nodeXYs[0].x+nodeXYs.last().x)/2;
    let y=nodeXYs[0].y+1;
    let w=cur_w;
    //let h=max_h+30;
    return {'x':x,'y':y,'w':w};
}
let svgWidth=300,svgHeight=300;
function showTree(data){
    let a=calNodeXY(data[0]);
    node_coords.push(a);
    console.log(node_coords);

    let TreeGeo=node_coords.reduce((prev,cur)=>{
        let temp={};
        temp.x=cur.x>prev.x?cur.x:prev.x;
        temp.y=cur.y>prev.y?cur.y:prev.y;
        return temp;
    });
    console.log(TreeGeo);
    let x=d3.scaleLinear().domain([0,TreeGeo.x]).range([0,svgWidth]);
    let y=d3.scaleLinear().domain([0,TreeGeo.y]).range([svgHeight,0]);
    d3.select("body")
        .append("svg")
        .attr("width",svgWidth+20)
        .attr("height",svgHeight+20);
    d3.select("svg")
        .selectAll("circle")
        .data(node_coords)
        .enter().append("circle")
        .attr("cx",d=>x(d.x))
        .attr("cy",d=>y(d.y))
        .attr("r",10)
        .style("fill","steelblue");
}
d3.json("data.json").then(showTree).catch(error=>console.log(error));
