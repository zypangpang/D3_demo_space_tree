if (!Array.prototype.last){
    Array.prototype.last = function(){
        return this[this.length - 1];
    };
}
//Main
//const margin = {top: 20, right: 30, bottom: 30, left: 40},
const width = 1024, //- margin.left - margin.right,
    height = 600; // - margin.top - margin.bottom;
//let oriData;
let curCityNumber=10,curDOI=-2;
let r;
const MAX_DOI=100;
let cur_focus_name;
let move_tree=false;
let X=width,Y=height;
let isPath=true;

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
    //d3.select(this).style("stroke", "black")
};
mousemove = function(d) {
    let text=`[${d.v.name}] 区县数:${d.v.val}`;
    if(d.v.dist!==undefined) text=text+" 距离:"+d.v.dist;
    if(d.v.doi!=undefined) text=text+" DOI:"+d.v.doi.toFixed(2);
    Tooltip.html(text)
        .style("left", (d3.mouse(this)[0]+20) + "px")
        .style("top", (d3.mouse(this)[1]-10) + "px")
};
mouseleave = function(d) {
    Tooltip.style("opacity", 0);
    //d3.select(this).style("stroke", "none")
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
function findNodeByName(v,name) {
    if(v.name===name) return v;
    for(let c of v.children){
        let t=findNodeByName(c,name);
        if(t) return t;
    }
    return undefined;
}
newData.calDOIByName=function(name){
    newData.reset();
    console.log(name);
    let node=findNodeByName(newData.root,name);
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
          moveTree(child,'r',left);
         left+=child.p.w;
         maxY=child.p.y>maxY?child.p.y:maxY;
      });
      v.children.forEach(v=>v.p.y=maxY);
      v.p={
          'x':(v.children[0].p.x+v.children.last().p.x)/2,
          'y':maxY+1,
          'w':left
          //'w':(v.children[0].p.x+v.children.last().p.x)/2+1
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
    return v.val>=curCityNumber&&v.doi>=curDOI;
}
//let svgWidth=300,svgHeight=300;
function centerTree(maxX,maxY,node) {
    let centerX=(maxX+1)/2;
    let centerY=(maxY+1)/2;
    moveTree(tree.root,'r',centerX-node.p.x);
    moveTree(tree.root,'u',centerY-node.p.y);
}
function update() {
    d3.select("#focus_name").text(cur_focus_name);
    tree.clone(newData.root);
    tree.filter(filter);
    let vs=[],edges=[];
    let x,y,diagonal1,diagonal2;
    if(tree.root) {
        //tree.sortChildren();
        tree.calAbsPosition();
        vs = tree.getVertices();
        edges=tree.getEdges();
        let maxX = vs.reduce((prev, cur) => {
            if (prev.v.p.x > cur.v.p.x) return {'v':{'p': {'x': prev.v.p.x}}};
            return {'v':{'p': {'x': cur.v.p.x}}};
        }).v.p.x;
        let maxY=tree.root.p.y;
        if(move_tree) {
            let node = findNodeByName(tree.root, cur_focus_name);
            centerTree(maxX, maxY, node);
        }
        x = d3.scaleLinear().domain([1, maxX]).range([tree.node_r+(width-X)/2, (width+X)/2 - tree.node_r]);
        y = d3.scaleLinear().domain([1, maxY]).range([(height+Y)/2 - tree.node_r, (height-Y)/2+tree.node_r+3]);
        diagonal1 = d3.linkVertical()
            .source(function(d) { return {"x":d.p1.x, "y":d.p1.y}; })
            .target(function(d) { return {"x":d.p1.x, "y":d.p1.y}; })
            .x(d=>x(d.x))
            .y(d=>y(d.y));
        diagonal2 = d3.linkVertical()
            .source(function(d) { return {"x":d.p1.x, "y":d.p1.y}; })
            .target(function(d) { return {"x":d.p2.x, "y":d.p2.y}; })
            .x(d=>x(d.x))
            .y(d=>y(d.y));
    }

    let circles=d3.select("#g_circles")
        .selectAll("circle")
        .data(vs);
    circles.exit().remove();
    circles.attr("id",d=>d.v.name)
        .style("stroke","none")
        .transition().duration(500)
        .attr("cx",d=>x(d.v.p.x))
        .attr("cy",d=>y(d.v.p.y))
        .attr("r",d=>r(d.v.val));

    let newCircles=circles.enter().append("circle")
        .style("opacity","0")
        .attr("id",d=>d.v.name)
        .attr("absX",d=>d.v.p.x)
        .attr("absY",d=>d.v.p.y)
        .attr("cx",d=>x(d.f.v.p.x))
        .attr("cy",d=>y(d.f.v.p.y))
        .attr("r",d=>r(d.v.val));

    setTimeout(()=>{
        newCircles
            .style("opacity","1")
            .transition().duration(500)
            .attr("cx",d=>x(d.v.p.x))
            .attr("cy",d=>y(d.v.p.y));

    },500);
    setTimeout(()=>{
        d3.select(`#${cur_focus_name}`)
        //.transition().duration(500)
            .style("stroke","#c4788b");
    },800);


    if(isPath) {
        let lines = d3.select("#g_lines")
            .selectAll("path")
            .data(edges);
        lines.exit().remove();
        lines.transition().duration(500)
            .style("stroke-width", d => r(d.val))
            .attr("d", diagonal2);
        let newLines=lines.enter()
            .append("path")
            .style("opacity","0")
            .style("stroke-width", d => r(d.val))
            .attr('d', diagonal1);

        setTimeout(() => {
            newLines
                .style("opacity","1")
                .transition().duration(500)
                .attr('d', diagonal2);
        }, 500);
    }
    else{
        let lines = d3.select("#g_lines")
            .selectAll("line")
            .data(edges);
        lines.exit().remove();
        lines
            .transition().duration(500)
            .style("stroke-width",d=>r(d.val))
            .attr("x1",d=>x(d.p1.x)).attr("y1",d=>y(d.p1.y))
            .attr("x2",d=>x(d.p2.x)).attr("y2",d=>y(d.p2.y));
        let newLines=lines.enter()
            .append("line")
            .style("opacity","0")
            .style("stroke-width",d=>r(d.val))
            .attr("x1",d=>x(d.p1.x)).attr("y1",d=>y(d.p1.y))
            .attr("x2",d=>x(d.p1.x)).attr("y2",d=>y(d.p1.y));
        setTimeout(() => {
            newLines
                .style("opacity","1")
                .transition().duration(500)
                .attr("x2",d=>x(d.p2.x)).attr("y2",d=>y(d.p2.y));
        }, 500);
    }
    d3.selectAll("circle")
        .on("mouseover",mouseover)
        .on("mousemove",mousemove)
        .on("mouseleave",mouseleave);
    d3.selectAll("circle")
        .on("click",d=>{
            cur_focus_name=d.v.name;
            newData.calDOIByName(cur_focus_name);
            update();
        });
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
    cur_focus_name="中国";
    d3.select("body")
        .append("svg")
        .attr("width",width)
        .attr("height",height);

    let svg=d3.select("svg");
    svg.append("g").attr("id","g_lines");
        //.attr("transform",`translate(${margin.left},${margin.top}`);
    svg.append("g").attr("id","g_circles");
        //.attr("transform",`translate(${margin.left},${margin.top}`);

    d3.select("#city_number").property("value",curCityNumber).on('change',function(){
        curCityNumber=(+this.value);
        update();
    });
    d3.select("#doi").property("value",curDOI).on('change',function () {
        curDOI=(+this.value);
        update();
    });
    d3.select("#x_span")
        .attr("min",width/2)
        .attr("max",width)
        .property("value",X)
        .on('change',function () {
        X=(+this.value);
        update();
    });
    d3.select("#y_span")
        .attr("min",height/2)
        .attr("max",height)
        .property("value",X)
        .on('change',function () {
        Y=(+this.value);
        update();
    });
    d3.select("#move_tree").on("change",function(){
        move_tree = this.checked;
        update();
    });
    d3.select("#is_path").on("change",function(){
        isPath= this.checked;
        d3.selectAll("circle").remove();
        d3.selectAll("line").remove();
        d3.selectAll("path").remove();
        update();
    });

    newData.root=transformData(data);
    newData.prepareData();

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
                .style("left", (d3.mouse(this)[0]+140)+"px")
                .style("top", d3.mouse(this)[1] + "px");
        });
    d3.select("#x_span")
        .on('mouseover',mouseover)
        .on('mouseleave',mouseleave)
        .on('mousemove',function(){
            Tooltip.html(this.value)
                .style("left", (d3.mouse(this)[0]+250)+"px")
                .style("top", d3.mouse(this)[1] + "px");
        });
    d3.select("#y_span")
        .on('mouseover',mouseover)
        .on('mouseleave',mouseleave)
        .on('mousemove',function(){
            Tooltip.html(this.value)
                .style("left", (d3.mouse(this)[0]+380)+"px")
                .style("top", d3.mouse(this)[1] + "px");
        });

    update();
}
d3.json("../data/China.json").then(main).catch(error=>console.log(error));