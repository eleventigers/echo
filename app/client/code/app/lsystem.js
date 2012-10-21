L = function (prods) {

 function defProds(ch){
		var r = "";
		switch(ch){
			case "a":
				r = "ab";
				break;
			case "b":
				r = "a";
				break;
		}
		return r;
	}

	(typeof prods != "undefined") ? this.prods = prods : this.prods = defProds;

}

L.prototype.constructor = L;

L.prototype.build = function(axiom, iter){

	var r = "";

	for (var i = 0; i < axiom.length; i++){

		var axCut = axiom.slice(i, axiom.length);
		
		if (axCut[1] == "("){
			var params;
			var pEnd = axCut.indexOf(")");
			if (pEnd != -1){
				var pS = axCut.slice(2, pEnd);
				if (pS.indexOf(",") != -1){
					params = pS.split(",");
				} else { params = pS; }

			}
			if (this.prods.hasOwnProperty(axCut[0])){
				var aR = this.prods[axCut[0]](params);
				if (aR){
					r += aR;
				}	

			}	
		} else {
			if (this.prods.hasOwnProperty(axCut[0])){
				var aR = this.prods[axCut[0]]();
				if (aR){
					r += aR;
				}
			}	
		}


	}

	(typeof r == "undefined" || r =="") ? r = axiom : r;

	console.log(r);

	return (iter == 0 || typeof iter == "undefined") ? r : this.build(r, iter-1);

}

