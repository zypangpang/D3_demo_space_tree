function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
const WIDTH = 1024, //- margin.left - margin.right,
    HEIGHT = 600; // - margin.top - margin.bottom;
const R=15,E=1;
let TRANS_TIME=100;
let SEPERATION=10;
//const K=10;
let MAX_ITERATION=100;

let isdemo=false;
let curPaperNumber=10;
let g;
let global_data,sorted_authors;
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
};
mousemove = function(d) {
    let text=d.id;
    if(!isdemo)
        text=`[${d.name}] 论文数:${global_data[d.name].paper_num}`;
    //if(d.v.dist!==undefined) text=text+" 距离:"+d.v.dist;
    //if(d.v.doi!=undefined) text=text+" DOI:"+d.v.doi.toFixed(2);
    Tooltip.html(text)
        .style("left", (d3.mouse(this)[0]+10) + "px")
        .style("top", (d3.mouse(this)[1]-10) + "px")
};
mouseleave = function(d) {
    Tooltip.style("opacity", 0);
    //d3.select(this).style("stroke", "none")
};
function Point(x,y) {
    this.x=x;
    this.y=y;
}
Point.prototype={
    add:function (rhs) {
        return new Point(this.x+rhs.x,this.y+rhs.y);
    },
    minus:function (rhs) {
        return new Point(this.x-rhs.x,this.y-rhs.y);
    },
    divide:function(rhs){
        return new Point(this.x/rhs,this.y/rhs);
    },
    multiply:function(rhs){
      return new Point(this.x*rhs,this.y*rhs);
    },
    length:function () {
        return Math.sqrt(this.x*this.x+this.y*this.y);
    }
};
/*if( !Array.prototype.minus){
    Array.prototype.minus=function (rhs) {
        return this.map((item,index)=>item-rhs[index]);
    }
}
if(!Array.prototype.add){
    Array.prototype.add=function (rhs) {
        return this.map((item,index)=>item+rhs[index]);
    }
}*/
function G(n) {
    this.vertexNum=n;
    //this.edgeNum=m;
    //this.adjList=[];
    this.edges=[];
    this.vertices=[];
    this.tV={};
    for(let i=0;i<n;++i){
        //this.adjList.push([]);
        this.vertices.push({
            id:i,
            pos:new Point(0,0),
            displacement:new Point(0,0),
            name:''
        });
        this.tV[i]=new Set();
    }
}
G.prototype={
    addEdge: function (u,v) {
        if(u>=this.vertexNum||v>=this.vertexNum||u===v){
            //console.log("illegal edge");
            return;
        }

        if(this.tV[u].has(v)) return;

        this.tV[u].add(v); this.tV[v].add(u);
        this.edges.push([u,v]);
        //this.adjList[u].push(this.edges.length-1);
        //this.adjList[v].push(this.edges.length-1);
    },
    initPos: function (initLayout) {
        initLayout(this.vertexNum).map((item,index)=>{
           this.vertices[index].pos=new Point(item[0],item[1]);
        });
    },
    setNames: function (names) {
        this.vertices.map((item,index)=>item.name=names[index]);
    }
};
function naiveLayout(vertexNum){
    let colNum=Math.ceil(Math.sqrt(vertexNum));
    let res=[];
    for(let i=0;i<vertexNum;++i){
        res.push([i%colNum,i/colNum>>0]);
    }
    return res;
}

async function FRLayout(g,space) {
    let K=SEPERATION*Math.sqrt(g.vertexNum);

    console.log(K,g.vertexNum);
    let fa=d=>+d*d/K;
    let fr=d=>K*K/d;

    let minXY=space.x<space.y?space.x:space.y;
    let E=g.edges,V=g.vertices;
    d3.select("#info").text("Begin");
    updateGraph();
    for(let i=MAX_ITERATION;i>0;--i){
        d3.select("#info").text(i);
        let t=minXY*i/MAX_ITERATION;
        //repulsive  forces
        for(let u of V){
            for(let v of V){
                if(u!==v){
                    let d=u.pos.minus(v.pos);
                    let dlen=d.length();
                    u.displacement=u.displacement.add(d.divide(dlen).multiply(fr(dlen)));
                }
            }
        }
        //attractive  forces
        for(let e of E){
            let u=g.vertices[e[0]],v=g.vertices[e[1]];
            let d=v.pos.minus(u.pos);
            let dlen=d.length();
            u.displacement=u.displacement.add(d.divide(dlen).multiply(fa(dlen)));
            v.displacement=v.displacement.minus(d.divide(dlen).multiply(fa(dlen)));
        }
        g.vertices.forEach(u=>{
            let dlen=u.displacement.length();
            //u.pos=u.pos.add(u.displacement);
            u.pos=u.pos.add(u.displacement.multiply(Math.min(t,dlen)/dlen));
            u.displacement=new Point(0,0);
        });

        updateGraph();
        await sleep(TRANS_TIME-5);
    }
    d3.select("#info").text("Done");
}
function genGraph(data) {
    if(isdemo) {
        let g = new G(3);
        g.addEdge(0, 1);
        g.addEdge(1, 2);
        return g;
    }
    let authors=sorted_authors.filter(item=>data[item].paper_num>curPaperNumber);
    //let authors=sorted_authors.slice(0,100);
    let vn=authors.length;
    let g=new G(vn);
    g.setNames(authors);
    authors.map((item,index)=>{
        data[item].related_authors
            .map((a,i)=>g.addEdge(data[item].id,data[a].id));
    });

    return g;
}
function update() {
    reset();
    g=genGraph(global_data);
    g.initPos(naiveLayout);
    let colNum=Math.ceil(Math.sqrt(g.vertexNum));
    FRLayout(g,{x:colNum,y:colNum});
    console.log(g);

    let circles=d3.selectAll("circle");
    circles.on("mouseover",mouseover)
        .on("mousemove",mousemove)
        .on("mouseleave",mouseleave)
        .on("click",function (d){
            d3.selectAll('circle').style("stroke","none");
            d3.selectAll('line').attr("opacity",0);
            d3.selectAll(`line[src="${d.id}"]`).attr('opacity',1);
            d3.selectAll(`line[dest="${d.id}"]`).attr('opacity',1);
            d3.select(this).style("stroke","#c4788b");
        });
}
function updateGraph() {
    let maxV=g.vertices.reduce((prev,cur)=>{
        let res={pos:{x:prev.pos.x,y:prev.pos.y}};
        if(prev.pos.x<cur.pos.x) res.pos.x=cur.pos.x;
        if(prev.pos.y<cur.pos.y) res.pos.y=cur.pos.y;
        return res;
    });
    let minV=g.vertices.reduce((prev,cur)=>{
        let res={pos:{x:prev.pos.x,y:prev.pos.y}};
        if(prev.pos.x>cur.pos.x) res.pos.x=cur.pos.x;
        if(prev.pos.y>cur.pos.y) res.pos.y=cur.pos.y;
        return res;
    });
    let maxR=1,minR=1;
    if(!isdemo) {
        maxR=global_data[g.vertices[0].name].paper_num;
        minR=global_data[g.vertices[g.vertices.length-1].name].paper_num;
    }
    //console.log(maxV);
    //console.log(minV);

    let scale_x = d3.scaleLinear().domain([minV.pos.x, maxV.pos.x]).range([R+4, WIDTH-R-4]);
    let scale_y = d3.scaleLinear().domain([minV.pos.y, maxV.pos.y]).range([R+4, HEIGHT-R-4]);
    let scale_r = d3.scaleSqrt().domain([minR, maxR]).range([1, R]);

    let circles=d3.select("#g_circles")
        .selectAll("circle")
        .data(g.vertices);
    circles.exit().remove();
    circles.attr("id",d=>d.id)
        .style("stroke","none")
        .transition().duration(TRANS_TIME)
        .attr("cx",d=>scale_x(d.pos.x))
        .attr("cy",d=>scale_y(d.pos.y))
        .attr("r",d=>{
            if(isdemo) return R;
            return scale_r(global_data[d.name].paper_num)
        });

    let newCircles=circles.enter().append("circle")
    //.style("opacity","0")
        .attr("id",d=>d.id)
        .attr("absX",d=>d.pos.x)
        .attr("absY",d=>d.pos.y)
        .attr("cx",d=>scale_x(d.pos.x))
        .attr("cy",d=>scale_y(d.pos.y))
        .attr("r",0)
        .transition().duration(TRANS_TIME)
        .attr("r",d=>{
            if(isdemo) return R;
            return scale_r(global_data[d.name].paper_num)
        });

    let lines = d3.select("#g_lines")
        .selectAll("line")
        .data(g.edges);
    lines.exit().remove();
    lines
        .attr("src",d=>d[0]).attr("dest",d=>d[1])
        .transition().duration(TRANS_TIME)
        .style("stroke-width",E)
        .attr("x1",d=>scale_x(g.vertices[d[0]].pos.x)).attr("y1",d=>scale_y(g.vertices[d[0]].pos.y))
        .attr("x2",d=>scale_x(g.vertices[d[1]].pos.x)).attr("y2",d=>scale_y(g.vertices[d[1]].pos.y))
    let newLines=lines.enter()
        .append("line")
        //.style("opacity","0")
        .attr("src",d=>d[0]).attr("dest",d=>d[1])
        .style("stroke-width",E)
        .attr("x1",d=>scale_x(g.vertices[d[0]].pos.x)).attr("y1",d=>scale_y(g.vertices[d[0]].pos.y))
        .attr("x2",d=>scale_x(g.vertices[d[1]].pos.x)).attr("y2",d=>scale_y(g.vertices[d[1]].pos.y))
}
function preprocess(data) {
    //Delete data with no authors
    delete data['[No author name available]'];
    sorted_authors=Object.keys(data).sort((a,b)=>{
       if(data[a].paper_num<data[b].paper_num) return 1;
       if(data[a].paper_num>data[b].paper_num) return -1;
       return 0;
    });
    sorted_authors.map((item,index)=>data[item].id=index);
    console.log(global_data);
}
function reset() {
    d3.selectAll('line').attr("opacity",1);
    d3.selectAll('circle').style("stroke",'none');
}
function setEvent() {
    d3.select("#paper_number").property("value",curPaperNumber).on('change',function(){
        curPaperNumber=(+this.value);
        update();
    });
    d3.select("#seperation").property("value",SEPERATION).on('change',function () {
        SEPERATION=(+this.value);
        update();
    });
    d3.select("#iteration")
        .property("value",MAX_ITERATION)
        .on('change',function () {
            MAX_ITERATION=(+this.value);
            update();
        });
    d3.select("#transition")
        //.attr("min",height/2)
        //.attr("max",height)
        .property("value",TRANS_TIME)
        .on('change',function () {
            TRANS_TIME=(+this.value);
            update();
        });
    d3.select("#demo").on("change",function(){
        isdemo = this.checked;
        update();
    });

    d3.select("#reset").on("click",function () {
        reset();
    });

    d3.select("#paper_number")
        .on('mouseover',mouseover)
        .on('mouseleave',mouseleave)
        .on('mousemove',function(){
            Tooltip.html(this.value)
                .style("left", (d3.mouse(this)[0]) + "px")
                .style("top", (d3.mouse(this)[1]) + "px");
        });
    d3.select("#seperation")
        .on('mouseover',mouseover)
        .on('mouseleave',mouseleave)
        .on('mousemove',function(){
            Tooltip.html(this.value)
                .style("left", (d3.mouse(this)[0]+140)+"px")
                .style("top", d3.mouse(this)[1] + "px");
        });
    d3.select("#iteration")
        .on('mouseover',mouseover)
        .on('mouseleave',mouseleave)
        .on('mousemove',function(){
            Tooltip.html(this.value)
                .style("left", (d3.mouse(this)[0]+320)+"px")
                .style("top", d3.mouse(this)[1] + "px");
        });
    d3.select("#transition")
        .on('mouseover',mouseover)
        .on('mouseleave',mouseleave)
        .on('mousemove',function(){
            Tooltip.html(this.value)
                .style("left", (d3.mouse(this)[0]+500)+"px")
                .style("top", d3.mouse(this)[1] + "px");
        });

}
function main(json_data){
    global_data=json_data;
    preprocess(global_data);

    d3.select("body")
        .append("svg")
        .attr("width",WIDTH)
        .attr("height",HEIGHT);

    let svg=d3.select("svg");
    svg.append("g").attr("id","g_lines");
    //.attr("transform",`translate(${margin.left},${margin.top}`);
    svg.append("g").attr("id","g_circles");
    //.attr("transform",`translate(${margin.left},${margin.top}`);

    setEvent();

    update();

}
//main();
d3.json("../data/author_graph.json").then(main).catch(error=>console.log(error));
/*d3.dsv(',','../data/scopus_visual_analytics_part1.csv',
        d=>{return {authors:d.Authors,title:d.Title};}
).then(main).catch(error=>console.log(error));*/