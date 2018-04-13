/* Javascript library containing equivalence table for GT:PD */

var codes = [];

gtde.equivalenceTable[0] = '---';
codes = [39, 41];
for(var i in codes){
	var code = codes[i];
	gtde.equivalenceTable[code] = 'Protagonista';
}
gtde.equivalenceTable[129] = 'Lanterna';