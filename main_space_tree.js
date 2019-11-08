if (!Array.prototype.last){
    Array.prototype.last = function(){
        return this[this.length - 1];
    };
}
let r,lw;
const MAX_DOI=100;
let cur_focus_v;
let Tooltip,mouseover,mousemove,mouseleave;
//Tooltip
// create a tooltip
Tooltip = d3.select(".tooltip");
    /*.append("div")
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "2px")
    .style("border-radius", "5px")
    .style("padding", "5px");*/

// Three function that change the tooltip when user hover / move / leave a cell
mouseover = function(d) {
    Tooltip.style("opacity", 1);
    d3.select(this).style("stroke", "black")
};
mousemove = function(d) {
    let text=d.v.name+" "+d.v.val;
    if(d.v.dist) text=text+" "+d.v.dist;
    if(d.v.doi) text=text+" "+d.v.doi;
    Tooltip.html(text)
        .style("left", (d3.mouse(this)[0]+20) + "px")
        .style("top", (d3.mouse(this)[1]-10) + "px")
};
mouseleave = function(d) {
    Tooltip.style("opacity", 0);
    d3.select(this).style("stroke", "none")
};
let newData={};
newData.calValue=function(){
    function calV(v) {
        if(!v.children.length) {v.val=0;return;}
        v.children.forEach(v=>calV(v));
        v.val=v.children.length+v.children.reduce((prev,cur)=>{return {'val':prev.val+cur.val};}).val;
    }
    calV(newData.root);
};
newData.addFather=function(){
    function addF(v) {
        v.children.forEach(c=>c.f=v);
        v.children.forEach(c=>addF(c));
    }
    newData.root.f=newData.root;
    addF(newData.root);
};
newData.reset=function(){
    function rs(v) {
        v.tag=false;
        v.children.forEach(c=>rs(c));
    }
    rs(newData.root);
};
newData.findDistance=function(node){
    console.log(node);
    function fd(v,lv) {
        if(v.tag) lv=v.dist;
        v.dist=lv;
        v.children.forEach(c=>fd(c,lv+1));
    }
    function traceBack(nt,dt) {
        while(nt!==newData.root){
            console.log('wrong');
            nt.dist=dt;
            nt.tag=true;
            nt=nt.f;
            dt+=1;
        }
        nt.dist=dt;
        nt.tag=true;
        //return dt;
    }
    traceBack(node,0);
    fd(newData.root,0);
    //console.log(node.v);
};
newData.calDOIByName=function(name){
    newData.reset();
    console.log(name);
    function dfs(v,name) {
        if(v.name===name) return v;
        for(let c of v.children){
            let t=dfs(c,name);
            if(t) return t;
        }
        return undefined;
    }
    let node=dfs(newData.root,name);
    console.log(node);
    newData.calDOI(node);
};
newData.calDOI=function(node){
    newData.findDistance(node);
    function cDOI(v){
        v.doi=r(v.val)-v.dist*2;
        v.children.forEach(c=>cDOI(c));
    }
    cDOI(newData.root);
    node.doi=MAX_DOI;
};
newData.prepareData=function () {
    newData.reset();
    newData.addFather();
    newData.calValue();
    r = d3.scaleSqrt().domain([0, newData.root.val]).range([1, tree.node_r]);
    newData.calDOI(newData.root);
};
//Main
//const margin = {top: 20, right: 30, bottom: 30, left: 40},
const width = 960, //- margin.left - margin.right,
    height = 600; // - margin.top - margin.bottom;
let oriData;
let curCityNumber=20,curDOI=-50;
let tree={'node_w':1,'node_y':1,'node_r':40};
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
let calValue=function (root) {
    function calV(v) {
        if(!v.children.length) {v.val=0;return;}
        v.children.forEach(v=>calV(v));
        v.val=v.children.length+v.children.reduce((prev,cur)=>{return {'val':prev.val+cur.val};}).val;
    }
    calV(root);
};
tree.findDistance=function(node){
    console.log(node);
    function fd(v,lv) {
        if(v.tag) lv=v.dist;
        v.dist=lv;
        v.children.forEach(c=>fd(c,lv+1));
    }
    function traceBack(nt,dt) {
        while(nt.v!==tree.root){
            console.log('wrong');
            nt.v.dist=dt;
            nt.v.tag=true;
            nt=nt.f;
            dt+=1;
        }
        nt.v.dist=dt;
        nt.v.tag=true;
        //return dt;
    }
    traceBack(node,0);
    fd(tree.root,0);
    //console.log(node.v);
};
tree.calDOI=function (click_node) {
    tree.findDistance(click_node);
    function cDOI(v){
        v.doi=r(v.val)-v.dist*2;
        v.children.forEach(c=>cDOI(c));
    }
    cDOI(tree.root);
    click_node.v.doi=MAX_DOI;
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
    let queue=new Queue();
    queue.enqueue([tree.root,{'v':tree.root}]);
    while(!queue.isEmpty()){
        let v=queue.dequeue();
        let obj={'v':v[0],'f':v[1]};
        vs.push(obj);
        v[0].children.forEach(c=>queue.enqueue([c,obj]));
    }
    /*let getV=(v,f)=>{
        vs.push({'name': v.name,'val':v.val, 'p': v.p,'f':f});
        q=q.concat(v.children);
        v.children.forEach(c => getV(c,{'p':v.p}));
    };
    getV(tree.root,tree.root);
    return vs.sort((a,b)=>a.val<b.val);*/
    return vs;
};
tree.getEdges=function(){
    let edges=[];
    let getE=v=>{
        v.children.forEach(c => edges.push({'p1': v.p, 'p2': c.p,'val':c.val}));
        v.children.forEach(c => getE(c));
    };
    getE(tree.root);
    return edges;
};
function filter(v) {
    //if(v.doi) return v.val>curCityNumber&&v.doi>curDOI;
    //return v.val>curCityNumber;
    return v.val>curCityNumber&&v.doi>curDOI;
}
//let svgWidth=300,svgHeight=300;
function update() {
    tree.clone(newData.root);
    tree.filter(filter);
    let vs=[],edges=[];
    let x,y;
    if(tree.root) {
        //tree.sortChildren();
        tree.calAbsPosition();
        vs = tree.getVertices();
        edges=tree.getEdges();
        //console.log(vs);
        //if(!cur_focus_v) cur_focus_v=vs[0];
        //tree.calDOI(cur_focus_v);

        let maxX = vs.reduce((prev, cur) => {
            if (prev.v.p.x > cur.v.p.x) return {'v':{'p': {'x': prev.v.p.x}}};
            return {'v':{'p': {'x': cur.v.p.x}}};
        }).v.p.x;
        x = d3.scaleLinear().domain([1, maxX]).range([tree.node_r, width - tree.node_r]);
        y = d3.scaleLinear().domain([1, tree.root.p.y]).range([height - tree.node_r, tree.node_r+3]);
    }

    let circles=d3.select("#g_circles")
        .selectAll("circle")
        .data(vs);
    circles.exit().remove();
    circles.transition().duration(500)
        .attr("cx",d=>x(d.v.p.x))
        .attr("cy",d=>y(d.v.p.y))
        .attr("r",d=>r(d.v.val));

    setTimeout(()=>{
    circles.enter().append("circle")
        .attr("cx",d=>x(d.f.v.p.x))
        .attr("cy",d=>y(d.f.v.p.y))
        .attr("r",d=>r(d.v.val))
        .transition().duration(500)
        .attr("cx",d=>x(d.v.p.x))
        .attr("cy",d=>y(d.v.p.y));},500);

    let lines=d3.select("#g_lines")
        .selectAll("line")
        .data(edges);
    lines.exit().remove();
    setTimeout(()=>{
    lines.enter()
        .append("line")
        .style("stroke-width",d=>r(d.val))
        .attr("x1",d=>x(d.p1.x)).attr("y1",d=>y(d.p1.y))
        .attr("x2",d=>x(d.p1.x)).attr("y2",d=>y(d.p1.y))
        .transition().duration(500)
        .attr("x2",d=>x(d.p2.x)).attr("y2",d=>y(d.p2.y))
    ;},500);
    lines
        .transition().duration(500)
        .style("stroke-width",d=>r(d.val))
        .attr("x1",d=>x(d.p1.x)).attr("y1",d=>y(d.p1.y))
        .attr("x2",d=>x(d.p2.x)).attr("y2",d=>y(d.p2.y));
    setTimeout(()=>d3.selectAll("circle")
        .on("mouseover",mouseover)
        .on("mousemove",mousemove)
        .on("mouseleave",mouseleave)
        ,500);
    setTimeout(()=>d3.selectAll("circle")
            .on("click",d=>{newData.calDOIByName(d.v.name);update();})
        ,500);

}

function transformData(data) {
    let dataNew={'name':'中国','children':data.citylist};
    dataNew.children.forEach(p=>{
        p.name=p.p;
        p.children=[];
        if(p.c) {
            p.children=p.c;
            p.children.forEach(c => {
                c.name = c.n;
                c.children = [];
                if(c.a){
                    c.children=c.a;
                    c.children.forEach(c=>{
                        c.name=c.s;
                        c.children=[];
                    })
                }
            });
        }
    });
    return dataNew;
}
function main(data){
    d3.select("body")
        .append("svg")
        .attr("width",width)
        .attr("height",height);

    let svg=d3.select("svg");
    svg.append("g").attr("id","g_lines");
        //.attr("transform",`translate(${margin.left},${margin.top}`);
    svg.append("g").attr("id","g_circles");
        //.attr("transform",`translate(${margin.left},${margin.top}`);

    d3.select("#city_number").on('change',function(){
        curCityNumber=this.value;
        update();
    });
    d3.select("#doi").on('change',function () {
        curDOI=this.value;
        update();
    });

    newData.root=transformData(data);
    newData.prepareData();
    //oriData=data[0];
    //console.log(oriData);
    //tree.root=oriData;
    //tree.calValue();
    //d3.select("#city_number").attr("max",tree.root.val);
    //lw = d3.scaleLinear().domain([0, tree.root.val]).range([0, tree.node_r-5]);
    update();
    //tree.calDOI({'v':tree.root});
    d3.select("#city_number")
        .on('mouseover',mouseover)
        .on('mouseleave',mouseleave)
        .on('mousemove',function(){
            Tooltip.html(this.value)
                .style("left", (d3.mouse(this)[0]) + "px")
                .style("top", (d3.mouse(this)[1]) + "px");
        });
    d3.select("#doi")
        .on('mouseover',mouseover)
        .on('mouseleave',mouseleave)
        .on('mousemove',function(){
            Tooltip.html(this.value)
                .style("left", (d3.mouse(this)[0]+175)+"px")
                .style("top", (d3.mouse(this)[1] + "px"));
        });
    //d3.select("#doi").on('change',(d,i,nodes)=>console.log(d3.select(nodes[i]).property("value")));
}
d3.json("China.json").then(main).catch(error=>console.log(error));