function G(n,m) {
    this.vertexNum=n;
    this.edgeNum=m;
    this.adjList=[];
    for(let i=0;i<n;++i){
        this.adjList.push(new Set());
    }
}
G.prototype={
    addEdge: function (u,v) {
        if(u>=this.vertexNum||v>=this.vertexNum){
            console.log("illegal edge");
            return;
        }
        this.adjList[u].add(v);
        this.adjList[v].add(u);
    }
};
function FRLayout(g) {
    
}
function genGraph() {
    let g=new G(3,2);
    g.addEdge(0,1);
    g.addEdge(1,2);
    return g;
}
function main(){
    let g=genGraph();
    console.log(g);
}
main();
/*d3.dsv(',','../data/scopus_visual_analytics_part1.csv',
        d=>{return {authors:d.Authors,title:d.Title};}
).then(main).catch(error=>console.log(error));*/