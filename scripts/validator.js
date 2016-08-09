define("Validator", ["as", "Utils", "$"], function(as, Utils, $) {
	/*description 
    V1.0: basic functionality
    V1.1: added some comments, self-initialization and support for "submit-less" mode.
    
    
    */

	/**
    * Emits custom events:
    *   validationfailed
    *   validatedsubmit
    */
	var AutoValidateButton = as.defineClass(as.View, {
		events: {
			"click": "onClick"
		},
		createElement: function(button) {
			return button;
		},
		onClick: function() {
			var ok = Validator.updateFormValidStatus();
			if(ok) {
				this.el.trigger("validatedsubmit");
				if(this.el.hasClass("auto-validate-always-prevent-default")) { //never submit. useful for ajaxy forms.
					return false;
				}
			} else {
				this.el.trigger("validationfailed");
				return false; //stop submit when validation fails.
			}
		}
	});

	var Validator = as.defineClass(as.Base, {
		//no non-static properties
	}, {
		buttonlessValidatorInitialized: false,
		validationKeys: {
			"email": "isValidEmailAddress",
			"ean": "isValidEANNumber",
			"zipdk": "isValidPostCode",
			"postnr": "isValidPostCode",
			"streetnr": "isValidStreetNumber",
			"lettersdk": "isDanishLettersAndSpaces",
			"anything": "isAnything",
			"number": "isNumber",
			"positivenumber": "isPositiveNumber",
			"phonenumber": "isPhoneNumber"
		},
		//can work in 3 different ways: either
		//1) with a specified submit button
		//2) without specified submit button - will find ".auto-validate-submit" in the DOM
		//3) without specified submit button and with no matching button in the DOM: form validation will work without submit.
		installFormAutoValidation: function(button, options) {
			options = options || {};
			if(!button) {
				button = $(".auto-validate-submit");
				if(button.length === 0) {
					if(this.buttonlessValidatorInitialized) { return; }
					this.buttonlessValidatorInitialized = true;
					button = null;
				}
			}

			var dublicateCheckProperty = "data-validator-submit-installed";
			if(button && (button.length !== 1 || button.attr(dublicateCheckProperty))) { return; }
			if(button) {
				button.attr(dublicateCheckProperty, true);
			}

			if(!options.noValidateOnBlur) {
				$("body").on("focusout", ".validate-field", Validator.onValidateFieldFocusOut);
			}
			if(button) {
				return new AutoValidateButton(button);
			}
			return null;
		},
		onValidateFieldFocusOut: function(e) {
			Validator.updateFieldValidStatus($(e.target));
		},
		serializeForm: function(formElement) { //unlike jQuery serialize() this function includes all elements, including unchecked checkboxes.
			return Array.prototype.join.call(formElement.find(".form-input").map(function(idx, input) {
				var value = (/^(?:checkbox|radio)$/i).test(input.type.toLowerCase()) ? input.checked : input.value;
				return input.name + "=" + encodeURIComponent(value);
			}), "&");
		},
		updateFieldValidStatus: function(elem) {
			var ok = true, val, msg, method, parts, minLength, maxLength, msgField, msgSourceEntry, msgOK, box;
			var method = elem.attr("data-validation");
			if(method) {
				if(elem.hasClass("skip-validation")) { return; }
				val = elem.val();
				if(method.lastIndexOf("regex:", 0) === 0) {
					ok = new RegExp(method.substr("regex:".length)).test(val);
				} else if(method.lastIndexOf("/", 0) === 0 && method.indexOf("/", method.length - 1) === method.length - 1) {
					ok = new RegExp(method.substr(1, method.length - 2)).test(val);
				} else {
					parts = method.split(":");
					if(Validator.validationKeys[parts[0]]) {
						maxLength = parts.length > 2 ? (parts[2] | 0) : (parts.length > 1 ? (parts[1] | 0) : 9999);
						minLength = parts.length > 2 ? (parts[1] | 0) : 0;
						//note that if val.length is 0 we do not run the validator function - since (if 0 is a valid length) it is OK by definition.
						//this is important for e.g. email validation where we want to allow empty fields by allowing length 0.
						ok = val.length >= minLength && val.length <= maxLength && (val.length === 0 || Validator[Validator.validationKeys[parts[0]]](val));
					} else {
						alert("could not find validation method " + method);
						return false;
					}

				}
				msg = elem.attr("data-validation-message");
			} else if(elem.attr("data-val")) { //microsoft MVC unobtrusive clientside validation.
				val = elem.val();
				if((msg = elem.attr("data-val-regex"))) {
					ok = new RegExp(elem.attr("data-val-regex-pattern")).test(val);
				}
				if((msg = elem.attr("data-val-required"))) {
					ok = !val.trim();
				}

				if(ok) { msg = null; } //must clear - since the message field is used for indicating validation type above.
			}

			box = elem.closest(".form-form-item");
			if (box.length !== 1) { box = elem; }
			box.toggleClass("validation-error", !ok);
			
			if(msg) {
				//the message show/hide is complicated by the fact that multiple value fields can use the same message field. we use expando objects to handle this...
				elem[0].dataRefID = elem[0].dataRefID || Utils.uniqueNumber(); //store a unique reference id for this field.
				if(msg.charAt(0) !== "#" && msg.charAt(0) !== ".") { msg = "#" + msg; } //assume id.
				msgField = $(msg);
				msgField[0].dataSources = msgField[0].dataSources || []; //map of reference id's -> booleans for fields which determine if this message is shown or not.
				msgField[0].dataSources[elem[0].dataRefID] = ok;
				msgOK = true;
				for(msgSourceEntry in msgField[0].dataSources) { //show message if any source fields are not ok.
					if(msgField[0].dataSources.hasOwnProperty(msgSourceEntry)) {
						msgOK = msgOK && msgField[0].dataSources[msgSourceEntry];
					}
				}
				$(msg).toggle(!msgOK);
			}
			return ok;
		},
		updateFormValidStatus: function (base) {
			base = base || $("body");
			var elem, fields = base.find(".validate-field"), allOK = true, lastFailed = null;
			for(var i = 0; i < fields.length; ++i) {
				var elem = fields.eq(i);
				if(!this.updateFieldValidStatus(elem)) {
					lastFailed = elem;
					allOK = false;
				}
			}
			if(lastFailed) {
				//lastFailed[0].scrollIntoView();
				window.scrollTo(0, lastFailed.offset().top - window.innerHeight / 2);
			}

			return allOK;
		},
		//examples: http://erhvervsstyrelsen.dk/e_fakturering
		isValidEANNumber: function(value) {
			if(typeof value !== "string" || value.length !== 13) { return false; }
			var param = value.substr(0, 12);
			var checkDigit = value.charCodeAt(12);
			var i, sum = 0, odd = true, checkResult;

			for(i = param.length - 1; i >= 0; i--) {
				sum += (odd ? 3 : 1) * (param.charCodeAt(i) - "0".charCodeAt(0));
				odd = !odd;
			}
			checkResult = ((10 - (sum % 10)) % 10) + "0".charCodeAt(0);
			return checkResult === checkDigit;
		},
		isValidEmailAddress: function(email) {
			var re = /^(([^<>()\[\]\\.,;:\s@\"]+(\.[^<>()\[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
			return re.test(email);
		},
		isValidPostCode: function(number) {
			var re = /^[\d]{4}$/;
			return re.test(number);
		},
		isValidStreetNumber: function(number) {
			var re = /^[0-9\-]*$/;
			return re.test(number);
		},
		isDanishLettersAndSpaces: function(str) {
			return /^[A-ZÆØÅa-zæøå\s]*$/.test(str);
		},
		//useful for validations where only the number of characters matter, not the content.
		isAnything: function() {
			return true;
		},
		isNumber: function(number) {
			var re = /^\-?\d+$/;
			return re.test(number);
		},
		isPositiveNumber: function(number) {
			var re = /^\d+$/;
			return re.test(number);
		},
		isPhoneNumber: function(number) {
			var re = /^\-?[\d\ ]+$/;
			return re.test(number);
		}

	});

	$(function() {
		Validator.installFormAutoValidation();
	});

	return Validator;
});