import Voronoi from './rhill-voronoi-core.js'; // Update the import path to the Voronoi library you're using

export default class VoronoiSVG {
    constructor(wide, high, distBetweenPoints) {
        this.voronoi = new Voronoi();
        this.sites = [];
        this.diagram = null;
        this.margin = 0.15;
        this.canvas = {width: wide, height: high}; // You can set the default dimensions here
        this.bbox = {xl: 0, xr: wide, yt: 0, yb: high};
    }

    init() {
        this.canvas = document.getElementById('voronoiCanvas');
        // this.randomSites(100,true, distBetweenPoints);
    }

    benchmarkToggle() {
        if ( this.benchmarkTimer ) {
            this.benchmarkStop();
            }
        else {
            this.benchmarkStart();
            }
        }

    benchmarkStart() {
        this.benchmarkMaxSites = Math.floor(parseFloat(document.getElementById('voronoiNumberSites').value));
        this.benchmarkPointer = 0;
        this.benchmarkTimer = setTimeout(this.benchmarkDo, 250);
        document.getElementById('voronoiBenchmark').value = 'Stop';
        }

    benchmarkDo() {
        var vd = VoronoiDemo;
        vd.randomSites(vd.benchmarkMaxSites, true);
        vd.render();
        vd.benchmarkTimes[vd.benchmarkPointer] = vd.diagram.execTime;
        vd.benchmarkPointer++;
        if ( vd.benchmarkPointer < vd.benchmarkTimes.length ) {
            document.getElementById('benchmarkResult').innerHTML = new Array(vd.benchmarkTimes.length-vd.benchmarkPointer+1).join('.');
            vd.benchmarkTimer = setTimeout(vd.benchmarkDo, 250);
            }
        else {
            vd.benchmarkStop();
            }
        }

    relaxSites() {
        if (!this.diagram) {return;}
        var cells = this.diagram.cells,
            iCell = cells.length,
            cell,
            site, sites = [],
            again = false,
            rn, dist;
        var p = 1 / iCell * 0.1;
        while (iCell--) {
            cell = cells[iCell];
            rn = Math.random();
            // probability of apoptosis
            if (rn < p) {
                continue;
                }
            site = this.cellCentroid(cell);
            dist = this.distance(site, cell.site);
            again = again || dist > 1;
            // don't relax too fast
            if (dist > 2) {
                site.x = (site.x+cell.site.x)/2;
                site.y = (site.y+cell.site.y)/2;
                }
            // probability of mytosis
            if (rn > (1-p)) {
                dist /= 2;
                sites.push({
                    x: site.x+(site.x-cell.site.x)/dist,
                    y: site.y+(site.y-cell.site.y)/dist,
                    });
                }
            sites.push(site);
            }
        this.compute(sites);
        if (again) {
            var me = this;
            this.timeout = setTimeout(function(){
                me.relaxSites();
                }, this.timeoutDelay);
            }
        }
    cellCentroid(cell) {
        var x = 0, y = 0,
            halfedges = cell.halfedges,
            iHalfedge = halfedges.length,
            halfedge,
            v, p1, p2;
        while (iHalfedge--) {
            halfedge = halfedges[iHalfedge];
            p1 = halfedge.getStartpoint();
            p2 = halfedge.getEndpoint();
            v = p1.x*p2.y - p2.x*p1.y;
            x += (p1.x+p2.x) * v;
            y += (p1.y+p2.y) * v;
            }
        v = this.cellArea(cell) * 6;
        return {x:x/v,y:y/v};
        }
    
	distance(one, two) {
		var dx = one.x-two.x,
			dy = one.y-two.y;
		return Math.sqrt(dx*dx+dy*dy);
		}

        
	cellArea(cell) {
		var area = 0,
			halfedges = cell.halfedges,
			iHalfedge = halfedges.length,
			halfedge,
			p1, p2;
		while (iHalfedge--) {
			halfedge = halfedges[iHalfedge];
			p1 = halfedge.getStartpoint();
			p2 = halfedge.getEndpoint();
			area += p1.x * p2.y;
			area -= p1.y * p2.x;
			}
		area /= 2;
		return area;
		}


    benchmarkStop() {
        if ( this.benchmarkTimer ) {
            clearTimeout(this.benchmarkTimer);
            this.benchmarkTimer = null;
            }
        var sum = 0;
        var fastest = Number.MAX_VALUE;
        var slowest = -Number.MAX_VALUE;
        this.benchmarkTimes.map(function(v){
            sum += v;
            fastest = Math.min(v, fastest);
            slowest = Math.max(v, slowest);
            });
        sum -= fastest;
        sum -= slowest;
        var avg = sum / (this.benchmarkPointer-2);
        document.getElementById('benchmarkResult').innerHTML =
            'average exec time for ' +
            this.benchmarkMaxSites +
            ' sites = ' +
            avg.toFixed(1) + ' ms ' +
            ' (' + (avg*1000/this.benchmarkMaxSites).toFixed(1) + ' µs/site)' +
            ', fastest = ' + fastest + ' ms, slowest = ' + slowest + ' ms.'
            ;
        document.getElementById('voronoiBenchmark').value = 'Benchmark';
        }

    clearSites() {
        this.sites = [];
        this.diagram = this.voronoi.compute(this.sites, this.bbox);
        this.updateStats();
        }

    randomSites(n, clear, minDistance) {
        console.log(minDistance)
        var sites = [];
        if (!clear) {
            sites = this.sites.slice(0);
        }
    
        const maxAttempts = 1000;
    
        // create vertices
        var xmargin = this.canvas.width * this.margin,
            ymargin = this.canvas.height * this.margin,
            xo = xmargin,
            dx = this.canvas.width - xmargin * 2,
            yo = ymargin,
            dy = this.canvas.height - ymargin * 2;
    
        function distance(a, b) {
            return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
        }
    
        function isTooClose(site, sites) {
            for (let i = 0; i < sites.length; i++) {
                if (distance(site, sites[i]) < minDistance) {
                    return true;
                }
            }
            return false;
        }
    
        for (var i = 0; i < n; i++) {
            let attempts = 0;
            let site;
            do {
                site = {
                    x: Math.round((xo + Math.random() * dx) * 10) / 10,
                    y: Math.round((yo + Math.random() * dy) * 10) / 10,
                };
                attempts++;
            } while (isTooClose(site, sites) && attempts < maxAttempts);
    
            if (attempts < maxAttempts) {
                sites.push(site);
            }
        }
    
        this.compute(sites);
        // relax sites
        if (this.timeout) {
            clearTimeout(this.timeout)
            this.timeout = null;
            }
        var me = this;
        this.timeout = setTimeout(function(){
            me.relaxSites();
            }, this.timeoutDelay);
        }
    
    recompute() {
        this.diagram = this.voronoi.compute(this.sites, this.bbox);
        this.updateStats();
        }

    updateStats() {
        if (!this.diagram) {return;}
        var e = document.getElementById('voronoiStats');
        if (!e) {return;}
        e.innerHTML = '('+this.diagram.cells.length+' Voronoi cells computed from '+this.diagram.cells.length+' Voronoi sites in '+this.diagram.execTime+' ms &ndash; rendering <i>not</i> included)';
        }

    generateSVG() {
        if (!this.diagram) {return '';}

        // SVG namespace
        const SVG_NS = 'http://www.w3.org/2000/svg';
    
        // Create an SVG element
        let svg = document.createElementNS(SVG_NS, 'svg');
        svg.setAttribute('width', this.canvas.width);
        svg.setAttribute('height', this.canvas.height);
        svg.setAttribute('viewBox', `0 0 ${this.canvas.width} ${this.canvas.height}`);
        svg.setAttribute('xmlns', SVG_NS);
        svg.setAttribute('version', '1.1');
    
        // Draw Voronoi cells
        let cells = this.diagram.cells;
        for (let i = 0, n = cells.length; i < n; i++) {
            let cell = cells[i];
            if (cell.halfedges.length > 0) {
                let path = document.createElementNS(SVG_NS, 'path');
                let d = '';
    
                // Generate path data for the cell
                cell.halfedges.forEach((halfedge, index) => {
                    let startPoint = halfedge.getStartpoint();
                    if (index === 0) {
                        d += `M ${startPoint.x} ${startPoint.y} `;
                    }
                    let endPoint = halfedge.getEndpoint();
                    d += `L ${endPoint.x} ${endPoint.y} `;
                });
    
                // Close the path
                d += 'Z';
                path.setAttribute('d', d);
    
                // Style the path
                path.setAttribute('fill', 'none');
                path.setAttribute('stroke', '#000');
    
                // Append the path to the SVG element
                svg.appendChild(path);
            }
        }
    
        // Serialize SVG to string
        let serializer = new XMLSerializer();
        let svgString = serializer.serializeToString(svg);
    
        return svgString;
        }
        
    compute(sites) {
        this.sites = sites;
        this.voronoi.recycle(this.diagram);
        this.diagram = this.voronoi.compute(sites, this.bbox);
        this.updateStats();
        }
    

    render() {
        var ctx = this.canvas.getContext('2d');
        // background
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.rect(0,0,this.canvas.width,this.canvas.height);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.strokeStyle = '#888';
        ctx.stroke();
        // voronoi
        if (!this.diagram) {return;}
        // edges
        ctx.beginPath();
        ctx.strokeStyle = '#000';
        var edges = this.diagram.edges,
            iEdge = edges.length,
            edge, v;
        while (iEdge--) {
            edge = edges[iEdge];
            v = edge.va;
            ctx.moveTo(v.x,v.y);
            v = edge.vb;
            ctx.lineTo(v.x,v.y);
            }
        ctx.stroke();
        // edges
        ctx.beginPath();
        ctx.fillStyle = 'red';
        var vertices = this.diagram.vertices,
            iVertex = vertices.length;
        while (iVertex--) {
            v = vertices[iVertex];
            ctx.rect(v.x-1,v.y-1,3,3);
            }
        ctx.fill();
        // sites
        ctx.beginPath();
        ctx.fillStyle = '#44f';
        var sites = this.sites,
            iSite = sites.length;
        while (iSite--) {
            v = sites[iSite];
            ctx.rect(v.x-2/3,v.y-2/3,2,2);
            }
        ctx.fill();
        }


}
