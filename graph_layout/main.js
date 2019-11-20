function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
const WIDTH = 800, //- margin.left - margin.right,
    HEIGHT = 600; // - margin.top - margin.bottom;
const R=10;
const TRANS_TIME=500;
const SEPERATION=4;
let g;
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
function G(n,m) {
    this.vertexNum=n;
    this.edgeNum=m;
    this.adjList=[];
    this.edges=[];
    this.vertices=[];
    for(let i=0;i<n;++i){
        this.adjList.push([]);
        this.vertices.push({
            id:i,
            pos:new Point(0,0),
            displacement:new Point(0,0),
            name:''
        });
    }
}
G.prototype={
    addEdge: function (u,v) {
        if(u>=this.vertexNum||v>=this.vertexNum){
            console.log("illegal edge");
            return;
        }
        this.edges.push([u,v]);
        this.adjList[u].push(this.edges.length-1);
        this.adjList[v].push(this.edges.length-1);
    },
    initPos: function (initLayout) {
        initLayout(this.vertexNum).map((item,index)=>{
           this.vertices[index].pos=new Point(item[0],item[1]);
        });
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

    let K=SEPERATION*Math.sqrt(space.x*space.y/g.vertexNum);
    console.log(K);
    let MAX_ITERATION=15;
    let fa=d=>+d*d/K;
    let fr=d=>K*K/d;

    let minXY=space.x<space.y?space.x:space.y;
    let E=g.edges,V=g.vertices;

    for(let i=MAX_ITERATION;i>0;--i){
        update();
        await sleep(TRANS_TIME);
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
    }
}
function genGraph() {
    let g=new G(6,5);
    g.addEdge(0,1);
    g.addEdge(1,2);
    g.addEdge(2,3);
    g.addEdge(3,4);
    g.addEdge(2,4);
    g.addEdge(0,3);
    return g;
}
function update() {
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
    //console.log(maxV);
    //console.log(minV);

    let scale_x = d3.scaleLinear().domain([minV.pos.x, maxV.pos.x]).range([R, WIDTH-R]);
    let scale_y = d3.scaleLinear().domain([minV.pos.y, maxV.pos.y]).range([R, HEIGHT-R]);

    let circles=d3.select("#g_circles")
        .selectAll("circle")
        .data(g.vertices);
    circles.exit().remove();
    circles.attr("id",d=>d.id)
        .style("stroke","none")
        .transition().duration(TRANS_TIME)
        .attr("cx",d=>scale_x(d.pos.x))
        .attr("cy",d=>scale_y(d.pos.y))
        .attr("r",R);

    let newCircles=circles.enter().append("circle")
    //.style("opacity","0")
        .attr("id",d=>d.id)
        .attr("absX",d=>d.pos.x)
        .attr("absY",d=>d.pos.y)
        .attr("cx",d=>scale_x(d.pos.x))
        .attr("cy",d=>scale_y(d.pos.y))
        .attr("r",R);

    let lines = d3.select("#g_lines")
        .selectAll("line")
        .data(g.edges);
    lines.exit().remove();
    lines
        .transition().duration(TRANS_TIME)
        .style("stroke-width",R)
        .attr("x1",d=>scale_x(g.vertices[d[0]].pos.x)).attr("y1",d=>scale_y(g.vertices[d[0]].pos.y))
        .attr("x2",d=>scale_x(g.vertices[d[1]].pos.x)).attr("y2",d=>scale_y(g.vertices[d[1]].pos.y))
    let newLines=lines.enter()
        .append("line")
        //.style("opacity","0")
        .style("stroke-width",R)
        .attr("x1",d=>scale_x(g.vertices[d[0]].pos.x)).attr("y1",d=>scale_y(g.vertices[d[0]].pos.y))
        .attr("x2",d=>scale_x(g.vertices[d[1]].pos.x)).attr("y2",d=>scale_y(g.vertices[d[1]].pos.y))
}
function main(){
    d3.select("body")
        .append("svg")
        .attr("width",WIDTH)
        .attr("height",HEIGHT);

    let svg=d3.select("svg");
    svg.append("g").attr("id","g_lines");
    //.attr("transform",`translate(${margin.left},${margin.top}`);
    svg.append("g").attr("id","g_circles");
    //.attr("transform",`translate(${margin.left},${margin.top}`);

    g=genGraph();
    g.initPos(naiveLayout);
    let colNum=Math.ceil(Math.sqrt(g.vertexNum));
    FRLayout(g,{x:colNum,y:colNum});
    console.log(g);

}
main();
/*d3.dsv(',','../data/scopus_visual_analytics_part1.csv',
        d=>{return {authors:d.Authors,title:d.Title};}
).then(main).catch(error=>console.log(error));*/