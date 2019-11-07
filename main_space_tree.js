if (!Array.prototype.last){
    Array.prototype.last = function(){
        return this[this.length - 1];
    };
}

let tree={'node_w':1,'node_y':1};
tree.sortChildren=function()
{
    let comp=tree.comp;
    function sortC(v) {
        v.children.sort(comp);
        v.children.forEach(c=>sortC(c));
    }
    sortC(tree.root);
};
const DIRECTION={
  'u': ['y',1],
    'd':['y',-1],
    'l':['x',-1],
    'r':['x',1]
};
let moveTree=function(v,d,l){
    v.p[DIRECTION[d][0]]+=DIRECTION[d][1]*l;
    v.children.forEach(c=>moveTree(c,d,l));
};
tree.filter=function(filter){
    let ft=(v)=>{
        v.children=v.children.filter(filter);
        v.children.forEach(c=>ft(c));
    };
    if(filter(tree.root)) ft(tree.root);
    else tree.root=undefined;
};
tree.calAbsPosition=function(){
    let filter=tree.filter;
    function calXY(v) {
      if(!filter(v)) return;
      let children=v.children.filter(filter);
      if(!children.length) { v.p = {'x': 1, 'y': 1, 'w': 1}; return; }
      children.forEach(child=>calXY(child));
      let left=0,maxY=-1;//,max_h=-1;
      children.forEach(child=>{
         //child.p.x+=left;
          moveTree(child,'r',left);
         left+=child.p.w;
         maxY=child.p.y>maxY?child.p.y:maxY;
      });
      children.forEach(v=>v.p.y=maxY);
      v.p={
          'x':(children[0].p.x+children.last().p.x)/2,
          'y':maxY+1,
          'w':left
      };
    }
    calXY(tree.root);
};
tree.getVertices=function(){
    let filter=tree.filter;
    let vs=[];
    let getV=(v,f)=>{
        if(filter(v)) {
            vs.push({'name': v.name,'val':v.val, 'p': v.p,'f':f});
            v.children.filter(filter).forEach(c => getV(c,{'p':v.p}));
        }
    };
    getV(tree.root);
    return vs.sort((a,b)=>a.val<b.val);
};
tree.getEdges=function(){
    let filter=tree.filter;
    let edges=[];
    let getE=v=>{
        if(filter(v)) {
            v.children.filter(filter).forEach(c => edges.push({'p1': v.p, 'p2': c.p}));
            v.children.filter(filter).forEach(c => getE(c));
        }
    };
    getE(tree.root);
    return edges;
};
let svgWidth=300,svgHeight=300;
function update(filter) {
    tree.filter=filter;
    tree.calAbsPosition();
    let vs=tree.getVertices();
    //console.log(vs);

    let maxX=vs.reduce((prev,cur)=>{
        if(prev.p.x>cur.p.x) return {'p':{'x':prev.p.x}};
        return {'p':{'x':cur.p.x}};
    }).p.x;
    let x=d3.scaleLinear().domain([0,maxX]).range([0,svgWidth]);
    let y=d3.scaleLinear().domain([0,tree.root.p.y]).range([svgHeight,0]);

    let circles=d3.select("#g_circles")
        .selectAll("circle")
        .data(vs);
    circles.exit().remove();
    circles.transition().duration(500)
        .attr("cx",d=>x(d.p.x))
        .attr("cy",d=>y(d.p.y));

    setTimeout(()=>{
    circles.enter().append("circle")
        .attr("cx",d=>x(d.f.p.x))
        .attr("cy",d=>y(d.f.p.y))
        .attr("r",10)
        .transition().duration(500)
        .attr("cx",d=>x(d.p.x))
        .attr("cy",d=>y(d.p.y));},500);

    let edges=tree.getEdges(filter);
    let lines=d3.select("#g_lines")
        .selectAll("line")
        .data(edges);
    lines.exit().remove();
    setTimeout(()=>{
    lines.enter()
        .append("line")
        .attr("x1",d=>x(d.p1.x)).attr("y1",d=>y(d.p1.y))
        .attr("x2",d=>x(d.p1.x)).attr("y2",d=>y(d.p1.y))
        .transition().duration(500)
        .attr("x2",d=>x(d.p2.x)).attr("y2",d=>y(d.p2.y));},500);
    lines.transition().duration(500)
        .attr("x1",d=>x(d.p1.x)).attr("y1",d=>y(d.p1.y))
        .attr("x2",d=>x(d.p2.x)).attr("y2",d=>y(d.p2.y));

}
function showTree(data){
    let filter=v=>true;
    tree.root=data[0];
    tree.filter=filter;
    tree.comp=(a,b)=>a.val<b.val;
    tree.sortChildren();
    tree.calAbsPosition();
    let vs=tree.getVertices();
    console.log(vs);
    let maxX=vs.reduce((prev,cur)=>{
        if(prev.p.x>cur.p.x) return {'p':{'x':prev.p.x}};
        return {'p':{'x':cur.p.x}};
    }).p.x;
    let x=d3.scaleLinear().domain([0,maxX]).range([0,svgWidth]);
    let y=d3.scaleLinear().domain([0,tree.root.p.y]).range([svgHeight,0]);

    d3.select("body")
        .append("svg")
        .attr("width",svgWidth)
        .attr("height",svgHeight);

    let svg=d3.select("svg");
    svg.append("g").attr("id","g_lines");
    svg.append("g").attr("id","g_circles");

    d3.select("#g_circles")
        .selectAll("circle")
        .data(vs)
        .enter().append("circle")
        .attr("cx",d=>x(d.p.x))
        .attr("cy",d=>y(d.p.y))
        .attr("r",10);

    let edges=tree.getEdges(filter);
    svg.select("#g_lines")
        .selectAll("line")
        .data(edges)
        .enter()
        .append("line")
        .attr("x1",d=>x(d.p1.x)).attr("y1",d=>y(d.p1.y))
        .attr("x2",d=>x(d.p2.x)).attr("y2",d=>y(d.p2.y));
    d3.selectAll("circle").on("click",d=>console.log(d.val));
    //d3.select("#doi").on('change',(d,i,nodes)=>console.log(d3.select(nodes[i]).property("value")));
    d3.select("#doi").on('change',(d,i,nodes)=>update(v=>v.val>nodes[i].value));

}
d3.json("data.json").then(showTree).catch(error=>console.log(error));