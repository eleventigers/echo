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


	var chars = (typeof axiom == "string") ? axiom.split("") : undefined;
	var replaced = "";
	
	if (typeof chars != "undefined"){
		for (var i = 0; i < chars.length; i++){
			var rS = this.prods(chars[i]);
			replaced += rS;
		}	

	}

	return (iter == 0 || typeof iter == "undefined") ? replaced : this.build(replaced, iter-1);

}

