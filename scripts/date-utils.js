define("DateUtils",[ "as"],
function(as) { "use strict";
	var DateUtils = (function() {
		// Author: Matt Kruse <matt@mattkruse.com>
		// Modified by appstract to pass jslint.

	    var MONTH_NAMES = "January,February,March,April,May,June,July,August,September,October,November,December,Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec";
	    var DAY_NAMES = "Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sun,Mon,Tue,Wed,Thu,Fri,Sat";
		var LZ = function(x) { return (x<0||x>9?"":"0")+parseFloat(x); };
		// ------------------------------------------------------------------
		// Utility functions for parsing in getDateFromFormat()
		// ------------------------------------------------------------------
		var _isInteger = function(val) {
			var i, digits="1234567890";
			for(i=0; i < val.length; i++) {
				if(digits.indexOf(val.charAt(i))===-1) { return false; }
			}
			return true;
		};
		var _getInt = function(str,i,minlength,maxlength) {
			var x;
			for(x=maxlength; x>=minlength; x--) {
				var token=str.substring(i,i+x);
				if(token.length < minlength) { return null; }
				if(_isInteger(token)) { return token; }
			}
			return null;
		};
		var returnVal = {
		// ------------------------------------------------------------------
		// formatDate (date_object, format)
		// Returns a date in the output format specified.
		// The format string uses the same abbreviations as in getDateFromFormat()
		// ------------------------------------------------------------------
		formatDate: function(date,format) {
			format=format.toString();
			var result="";
			var i_format=0;
			var c="";
			var token="";
			var y=date.getFullYear();
			var M=date.getMonth()+1;
			var d=date.getDate();
			var E=date.getDay();
			var H=date.getHours();
			var m=date.getMinutes();
			var s=date.getSeconds();
			var yyyy,yy,MMM,MM,dd,hh,h,mm,ss,ampm,HH,KK,K,kk,k;
			// Convert real date parts into formatted versions
			var value={};
			value["y"]=y;
			value["yyyy"]=y;
			value["yy"]=y.toString().substring(2,4);
			value["M"]=M;
			value["MM"]=LZ(M);
			value["MMM"]=MONTH_NAMES[M-1];
			value["NNN"]=MONTH_NAMES[M+11];
			value["d"]=d;
			value["dd"]=LZ(d);
			value["E"]=DAY_NAMES[E+7];
			value["EE"]=DAY_NAMES[E];
			value["H"]=H;
			value["HH"]=LZ(H);
			if(H===0) { value["h"]=12;
			} else if(H>12) { value["h"]=H-12; 
			} else { value["h"] = H; }
			value["hh"]=LZ(value["h"]);
			if(H>11) { value["K"]=H-12; } else { value["K"]=H; }
			value["k"]=H+1;
			value["KK"]=LZ(value["K"]);
			value["kk"]=LZ(value["k"]);
			if(H > 11) { value["a"]="PM";
			} else { value["a"]="AM"; }
			value["m"]=m;
			value["mm"]=LZ(m);
			value["s"]=s;
			value["ss"]=LZ(s);
			while(i_format < format.length) {
				c=format.charAt(i_format);
				token="";
				while((format.charAt(i_format)===c) && (i_format < format.length)) {
					token += format.charAt(i_format++);
				}
				if(!!value[token]) { result=result + value[token];
				} else { result = result + token; }
			}
			return result;
		},
		
		// ------------------------------------------------------------------
		// getDateFromFormat( date_string , format_string )
		//
		// This function takes a date string and a format string. It matches
		// If the date string matches the format string, it returns the 
		// getTime() of the date. If it does not match, it returns 0.
		// ------------------------------------------------------------------
		getDateFromFormat: function(val,format) {
			if(!val) {
				return 0;
			}
			var i;
		
			val=val.toString();
			format=format.toString();
			var i_val=0;
			var i_format=0;
			var c="";
			var token="";
			var token2="";
			var x,y;
			var now=new Date();
			var year=now.getYear();
			var month=now.getMonth()+1;
			var date=1;
			var hh=now.getHours();
			var mm=now.getMinutes();
			var ss=now.getSeconds();
			var ampm="";
		
			while(i_format < format.length) {
				// Get next token from format string
				c=format.charAt(i_format);
				token="";
				while((format.charAt(i_format)===c) && (i_format < format.length)) {
					token += format.charAt(i_format++);
				}
				// Extract contents of value based on format token
				if(token==="yyyy" || token==="yy" || token==="y") {
					if(token==="yyyy") { x=4; y=4; }
					if(token==="yy") { x=2; y=2; }
					if(token==="y") { x=2; y=4; }
					var yearstr=_getInt(val,i_val,x,y);
					if(!yearstr) { return 0; }
					year = parseInt(yearstr, 10);
					i_val += yearstr.length;
					if(yearstr.length===2) {
						if(year > 70) { year=1900+year;
						} else { year=2000+year; }
					}
				} else if(token==="MMM"||token==="NNN") {
					month=0;
					for(i=0; i<MONTH_NAMES.length; i++) {
						var month_name=MONTH_NAMES[i];
						if(val.substring(i_val,i_val+month_name.length).toLowerCase()===month_name.toLowerCase()) {
							if(token==="MMM"||(token==="NNN"&&i>11)) {
								month=i+1;
								if(month>12) { month -= 12; }
								i_val += month_name.length;
								break;
							}
						}
					}
					if((month < 1) || (month > 12)) { return 0; }
				} else if(token==="EE"||token==="E") {
					for(i=0; i<DAY_NAMES.length; i++) {
						var day_name=DAY_NAMES[i];
						if(val.substring(i_val,i_val+day_name.length).toLowerCase()===day_name.toLowerCase()) {
							i_val += day_name.length;
							break;
						}
					}
				} else if(token==="MM"||token==="M") {
					var monthstr=_getInt(val,i_val,token.length,2);
					month = parseInt(monthstr, 10);
					if(month<1 || month>12) { return 0; }
					i_val+=monthstr.length;
				} else if(token==="dd"||token==="d") {
					var datestr =_getInt(val,i_val,token.length,2);
					date = parseInt(datestr, 10);
					if((date<1)||(date>31)) { return 0; }
					i_val+=datestr.length;
				} else if(token==="hh"||token==="h") {
					var hhstr=_getInt(val,i_val,token.length,2);
					hh = parseInt(hhstr, 10);
					if((hh<1)||(hh>12)) { return 0; }
					i_val+=hhstr.length;
				} else if(token==="HH"||token==="H") {
					var hhstrz=_getInt(val,i_val,token.length,2);
					hh = parseInt(hhstrz, 10);
					if(!hhstrz||(hh<0)||(hh>23)) { return 0; }
					i_val+=hhstrz.length;
				} else if(token==="KK"||token==="K") {
					var hhstrzz=_getInt(val,i_val,token.length,2);
					hh = parseInt(hhstrzz, 10);
					if(!hhstrzz||(hh<0)||(hh>11)) { return 0; }
					i_val+=hhstrzz.length;
				} else if(token==="kk"||token==="k") {
					var hhstrzzz=_getInt(val,i_val,token.length,2);
					hh = parseInt(hhstrzzz, 10);
					if((hh<1)||(hh>24)) { return 0; }
					i_val+=hhstrzzz.length;hh--;
				} else if(token==="mm"||token==="m") {
					var mmstr=_getInt(val,i_val,token.length,2);
					mm = parseInt(mmstr, 10);
					if(!mmstr||(mm<0)||(mm>59)) { return 0; }
					i_val+=mmstr.length;
				} else if(token==="ss"||token==="s") {
					var ssstr=_getInt(val,i_val,token.length,2);
					ss = parseInt(ssstr, 10);
					if(!ssstr||(ss<0)||(ss>59)) { return 0; }
					i_val+=ssstr.length;
				} else if(token==="a") {
					if(val.substring(i_val,i_val+2).toLowerCase()==="am") {ampm="AM";
					} else if(val.substring(i_val,i_val+2).toLowerCase()==="pm") { ampm="PM"; 
					} else {return 0;}
					i_val+=2;
				} else {
					if(val.substring(i_val,i_val+token.length)!==token) {
						return 0;
					} else {
						i_val+=token.length;
					}
				}
			}
			// If there are any trailing characters left in the value, it doesn't match
			if(i_val !== val.length) { return 0; }
			// Is date valid for month?
			if(month===2) {
				// Check for leap year
				if(((year%4===0)&&(year%100 !== 0)) || (year%400===0)) { // leap year
					if(date > 29) { return 0; }
				} else { if(date > 28) { return 0; } }
			}
			if((month===4)||(month===6)||(month===9)||(month===11)) {
				if(date > 30) { return 0; }
			}
			// Correct hours value
			if(hh<12 && ampm==="PM") { hh=hh+12;
			} else if(hh>11 && ampm==="AM") { hh-=12; }
			var newdate=new Date(year,month-1,date,hh,mm,ss);
			return newdate.getTime();
		},

		// ------------------------------------------------------------------
		// parseDate( date_string [, prefer_euro_format] )
		//
		// This function takes a date string and tries to match it to a
		// number of possible date formats to get the value. It will try to
		// match against the following international formats, in this order:
		// y-M-d   MMM d, y   MMM d,y   y-MMM-d   d-MMM-y  MMM d
		// M/d/y   M-d-y	  M.d.y	 MMM-d	 M/d	  M-d
		// d/M/y   d-M-y	  d.M.y	 d-MMM	 d/M	  d-M
		// A second argument may be passed to instruct the method to search
		// for formats like d/M/y (european format) before M/d/y (American).
		// Returns a Date object or null if no patterns match.
		// ------------------------------------------------------------------
		parseDate: function(val, preferEuro) {
			var i, j;
			preferEuro = preferEuro || false;
			var generalFormats=['y-M-d','MMM d, y','MMM d,y','y-MMM-d','d-MMM-y','MMM d'];
			var monthFirst=['M/d/y','M-d-y','M.d.y','MMM-d','M/d','M-d'];
			var dateFirst =['d/M/y','d-M-y','d.M.y','d-MMM','d/M','d-M'];
			var checkList=['generalFormats',preferEuro?'dateFirst':'monthFirst',preferEuro?'monthFirst':'dateFirst'];
			var d=null;
			for(i=0; i<checkList.length; i++) {
				var l=window[checkList[i]];
				for(j=0; j<l.length; j++) {
					d=returnVal.getDateFromFormat(val,l[j]);
					if(d!==0) { return new Date(d); }
				}
			}
			return null;
		},
		
		// ------------------------------------------------------------------
		// isDate ( date_string, format_string )
		// Returns true if date string matches format of format string and
		// is a valid date. Else returns false.
		// It is recommended that you trim whitespace around the value before
		// passing it to this function, as whitespace is NOT ignored!
		// ------------------------------------------------------------------
		isDate: function(val,format) {
			var date=returnVal.getDateFromFormat(val,format);
			if(date===0) { return false; }
			return true;
		},

		// -------------------------------------------------------------------
		// compareDates(date1,date1format,date2,date2format)
		//   Compare two date strings to see which is greater.
		//   Returns:
		//   1 if date1 is greater than date2
		//   0 if date2 is greater than date1 of if they are the same
		//  -1 if either of the dates is in an invalid format
		// -------------------------------------------------------------------
		compareDates: function(date1,dateformat1,date2,dateformat2) {
			var d1=returnVal.getDateFromFormat(date1,dateformat1);
			var d2=returnVal.getDateFromFormat(date2,dateformat2);
			if(d1===0 || d2===0) {
				return -1;
			} else if(d1 > d2) {
				return 1;
			}
			return 0;
		},

		//
		//additional functions by appstract:
		//

		//returns a string representing the date given in seconds
		secondsToDate: function(sec, format) {
			return returnVal.formatDate(new Date(sec*1000), format);
		},

		utcSeconds: function() {
			return ((new Date()).getTime() / 1000) | 0; //getTime() is relative to the local timezone's epoch, so in effect it is UTC.
		},

		utcMiliseconds: function() {
			return (new Date()).getTime();
		},

		//returns a date in seconds as specified by the given string
		dateToSeconds: function(str, format) {
			return returnVal.getDateFromFormat(str, format)/1000;
		},

		timeToSeconds: function(str) {
			if(!str || typeof(str) !== "string") { return 1; }
			var s, i, j = 0, sec = 0;
			s = str.split(":");
			for(i = s.length - 1; i >= 0;) {
				s[i] = parseInt(s[i], 10);
				switch(j) {
					case 0://seconds
						sec += s[i];
						break;
					case 1://minutes
						sec += s[i]*60;
						break;
					case 2://hours
						sec += s[i]*60*60;
						break;
					case 3://days
						sec += s[i]*60*60*24;
						break;
				}

				j++;
				i--;
			}
			return sec;
		}
		
		}; //end returnVal block.
		return returnVal;
	}());

	return DateUtils;
});