import Voronoi from './rhill-voronoi-core.js'; // Update the import path to the Voronoi library you're using

export default class VoronoiRelaxedSvg {
	constructor(wide, high) {
        this.voronoi = new Voronoi()
        this.diagram = null
        this.margin = 0.1
        this.canvas = {width: wide, height: high}; // You can set the default dimensions here
        this.bbox = {xl:0,xr:wide,yt:0,yb:high}
        this.sites = []
        this.timeoutDelay = 2
    }

	init() {
		this.canvas = document.getElementById('voronoiCanvas');
		}

	clearSites() {
		this.compute([]);
		}

	randomSites(n, clear) {
		var sites = [];
		if (!clear) {
			sites = this.sites.slice(0);
			}
		// create vertices
		var xmargin = this.canvas.width*this.margin,
			ymargin = this.canvas.height*this.margin,
			xo = xmargin,
			dx = this.canvas.width-xmargin*2,
			yo = ymargin,
			dy = this.canvas.height-ymargin*2;
		for (var i=0; i<n; i++) {
            sites.push({x:Math.round((xo+Math.random()*dx)*10)/10,y:Math.round((yo+Math.random()*dy)*10)/10});
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

        relaxSites(callback, iterations = 15) {
            if (!this.diagram) { return; }
        
            for (let currentIteration = 0; currentIteration < iterations; currentIteration++) {
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
                        site.x = (site.x + cell.site.x) / 2;
                        site.y = (site.y + cell.site.y) / 2;
                    }
                    // probability of mytosis
                    if (rn > (1 - p)) {
                        dist /= 2;
                        sites.push({
                            x: site.x + (site.x - cell.site.x) / dist,
                            y: site.y + (site.y - cell.site.y) / dist,
                        });
                    }
                    sites.push(site);
                }
                this.compute(sites);
            }
        
            if (callback) {
                callback();
            }
        }    

	distance(a, b) {
		var dx = a.x-b.x,
			dy = a.y-b.y;
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

	compute(sites) {
		this.sites = sites;
		this.voronoi.recycle(this.diagram);
		this.diagram = this.voronoi.compute(sites, this.bbox);
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
    

	};
