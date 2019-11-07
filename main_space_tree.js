if (!Array.prototype.last){
    Array.prototype.last = function(){
        return this[this.length - 1];
    };
}
const margin = {top: 20, right: 30, bottom: 30, left: 40},
    width = 660 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;
let oriData;
let r;
let tree={'node_w':1,'node_y':1,'node_r':20};
tree.comp=(a,b)=>a.val<b.val;
tree.sortChildren=function()
{
    let comp=tree.comp;
    function sortC(v) {
        v.children.sort(comp);
        v.children.forEach(c=>sortC(c));
    }
    sortC(tree.root);
};
tree.calValue=function () {
    function calV(v) {
        if(!v.children.length) {v.val=1;return;}
        v.children.forEach(v=>calV(v));
        v.val=v.children.reduce((prev,cur)=>{return {'val':prev.val+cur.val};}).val;
    }
    calV(tree.root);
};
const DIRECTION={
  'u': ['y',1],
    'd':['y',-1],
    'l':['x',-1],
    'r':['x',1]
};
tree.clone=function(root){
    function cl(v) {
        let children=[];
        v.children.forEach(c=>children.push(cl(c)));
        let new_v=Object.assign({},v);
        new_v.children=children;
        return new_v;
    }
    tree.root=cl(root);
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
    function calXY(v) {
      if(!v.children.length) { v.p = {'x': 1, 'y': 1, 'w': 1}; return; }
      v.children.forEach(child=>calXY(child));
      let left=0,maxY=-1;//,max_h=-1;
      v.children.forEach(child=>{
         //child.p.x+=left;
         moveTree(child,'r',left);
         left+=child.p.w;
         maxY=child.p.y>maxY?child.p.y:maxY;
      });
      v.children.forEach(v=>v.p.y=maxY);
      v.p={
          'x':(v.children[0].p.x+v.children.last().p.x)/2,
          'y':maxY+1,
          'w':left
      };
    }
    calXY(tree.root);
};
tree.getVertices=function(){
    let vs=[];
    let getV=(v,f)=>{
        vs.push({'name': v.name,'val':v.val, 'p': v.p,'f':f});
        v.children.forEach(c => getV(c,{'p':v.p}));
    };
    getV(tree.root,tree.root);
    return vs.sort((a,b)=>a.val<b.val);
};
tree.getEdges=function(){
    let edges=[];
    let getE=v=>{
        v.children.forEach(c => edges.push({'p1': v.p, 'p2': c.p}));
        v.children.forEach(c => getE(c));
    };
    getE(tree.root);
    return edges;
};
//let svgWidth=300,svgHeight=300;
function update(filter) {
    tree.clone(oriData[0]);
    tree.filter(filter);
    let vs=[],edges=[];
    let x,y;
    if(tree.root) {
        tree.sortChildren();
        tree.calAbsPosition();
        vs = tree.getVertices();
        edges=tree.getEdges();
        //console.log(vs);

        let maxX = vs.reduce((prev, cur) => {
            if (prev.p.x > cur.p.x) return {'p': {'x': prev.p.x}};
            return {'p': {'x': cur.p.x}};
        }).p.x;
        x = d3.scaleLinear().domain([1, maxX]).range([tree.node_r, width - tree.node_r]);
        y = d3.scaleLinear().domain([1, tree.root.p.y]).range([height - tree.node_r, tree.node_r]);
    }

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
        .attr("r",d=>r(d.val))
        .transition().duration(500)
        .attr("cx",d=>x(d.p.x))
        .attr("cy",d=>y(d.p.y));},500);

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
    setTimeout(()=>d3.selectAll("circle").on("click",d=>console.log(d.val)),500);

}
function main(data){
    d3.select("body")
        .append("svg")
        .attr("width",width+margin.left+margin.right)
        .attr("height",height+margin.top+margin.bottom);

    let svg=d3.select("svg");
    svg.append("g").attr("id","g_lines")
        .attr("transform",`translate(${margin.left},${margin.top}`);
    svg.append("g").attr("id","g_circles")
        .attr("transform",`translate(${margin.left},${margin.top}`);

    d3.select("#doi").on('change',(d,i,nodes)=>update(v=>v.val>nodes[i].value));

    let filter=v=>true;
    oriData=data;
    tree.root=oriData[0];
    tree.calValue();
    r = d3.scaleSqrt().domain([0, tree.root.val]).range([0, tree.node_r]);
    update(filter);
    //d3.select("#doi").on('change',(d,i,nodes)=>console.log(d3.select(nodes[i]).property("value")));
}
d3.json("data.json").then(main).catch(error=>console.log(error));