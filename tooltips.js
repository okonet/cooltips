// Tooltips Class
// A superclass to work with simple CSS selectors
var Tooltips = Class.create();
Tooltips.prototype = {
	initialize: function(selector, options) {
		var tooltips = $$(selector);
		tooltips.each( function(tooltip) {
			new Tooltip(tooltip, options);
		});
	}
};
// Tooltip Class
var Tooltip = Class.create();
Tooltip.prototype = {
	initialize: function(el, options) {
		this.el = $(el);
		this.initialized = false;
		this.setOptions(options);
		
		// Event handlers
		this.showEvent = this.show.bindAsEventListener(this);
		this.hideEvent = this.hide.bindAsEventListener(this);
		this.updateEvent = this.update.bindAsEventListener(this);
		Event.observe(this.el, "mouseover", this.showEvent );
		Event.observe(this.el, "mouseout", this.hideEvent );
		
		// Content for Tooltip is either given through 
		// 'content' option or 'title' attribute of the trigger element. If 'content' is present, then 'title' attribute is ignored.
		// 'content' is an element or the id of an element from which the innerHTML is taken as content of the tooltip
		if (options && options['content']) {
			this.content = $(options['content']).innerHTML;
		} else {
			this.content = this.el.title.stripScripts().strip();
		}
		// Removing title from DOM element to avoid showing it
		this.content = this.el.title.stripScripts().strip();
		this.el.title = "";

		// If descendant elements has 'alt' attribute defined, clear it
		this.el.descendants().each(function(el){
			if(Element.readAttribute(el, 'alt'))
				el.alt = "";
		});
	},
	setOptions: function(options) {
		this.options = {
			backgroundColor: '#999', // Default background color
			borderColor: '#666', // Default border color
			textColor: '', // Default text color (use CSS value)
			textShadowColor: '', // Default text shadow color (use CSS value)
			maxWidth: 250,	// Default tooltip width
			align: "left", // Default align
			delay: 250, // Default delay before tooltip appears in ms
			mouseFollow: true, // Tooltips follows the mouse moving
			opacity: .75, // Default tooltips opacity
			appearDuration: .25, // Default appear duration in sec
			hideDuration: .25 // Default disappear duration in sec
		};
		Object.extend(this.options, options || {});
	},
	show: function(e) {
		this.xCord = Event.pointerX(e);
		this.yCord = Event.pointerY(e);
		if(!this.initialized)
			this.timeout = window.setTimeout(this.appear.bind(this), this.options.delay);
	},
	hide: function(e) {
		if(this.initialized) {
			this.appearingFX.cancel();
			if(this.options.mouseFollow)
				Event.stopObserving(this.el, "mousemove", this.updateEvent);
			new Effect.Fade(this.tooltip, {duration: this.options.hideDuration, afterFinish: function() { Element.remove(this.tooltip) }.bind(this) });
		}
		this._clearTimeout(this.timeout);
		
		this.initialized = false;
	},
	update: function(e){
		this.xCord = Event.pointerX(e);
		this.yCord = Event.pointerY(e);
		this.setup();
	},
	appear: function() {
		// Building tooltip container
		this.tooltip = new Element("div", { className: "tooltip", style: "display: none" });
		
		var arrow = new Element("div", { className: "xarrow" }).insert('<b class="a1"></b><b class="a2"></b><b class="a3"></b><b class="a4"></b><b class="a5"></b><b class="a6"></b>');
		
		var top = new Element("div", { className: "xtop" }).insert(
			new Element("div", { className: "xb1", style: "background-color:" + this.options.borderColor + ";" })
		).insert(
			new Element("div", { className: "xb2", style: "background-color:" + this.options.backgroundColor + "; border-color:" + this.options.borderColor + ";" })
		).insert(
			new Element("div", { className: "xb3", style: "background-color:" + this.options.backgroundColor + "; border-color:" + this.options.borderColor + ";" })
		).insert(
			new Element("div", { className: "xb4", style: "background-color:" + this.options.backgroundColor + "; border-color:" + this.options.borderColor + ";" })
		);
		
		var bottom = new Element("div", { className: "xbottom" }).insert(
			new Element("div", { className: "xb4", style: "background-color:" + this.options.backgroundColor + "; border-color:" + this.options.borderColor + ";" })
		).insert(
			new Element("div", { className: "xb3", style: "background-color:" + this.options.backgroundColor + "; border-color:" + this.options.borderColor + ";" })
		).insert(
			new Element("div", { className: "xb2", style: "background-color:" + this.options.backgroundColor + "; border-color:" + this.options.borderColor + ";" })
		).insert(
			new Element("div", { className: "xb1", style:"background-color:" + this.options.borderColor + ";" })
		);
		
		var content = new Element("div", { className: "xboxcontent", style: "background-color:" + this.options.backgroundColor + "; border-color:" + this.options.borderColor + 
			((this.options.textColor != '') ? "; color:" + this.options.textColor : "") + 
			((this.options.textShadowColor != '') ? "; text-shadow:2px 2px 0" + this.options.textShadowColor + ";" : "") }).update(this.content);
			
		// Building and injecting tooltip into DOM
		this.tooltip.insert(arrow).insert(top).insert(content).insert(bottom);
		$(document.body).insert({'top':this.tooltip});
		
		// Coloring arrow element
		this.tooltip.select('.xarrow b').each(function(el){
			if(!el.hasClassName('a1'))
				el.setStyle({backgroundColor: this.options.backgroundColor, borderColor: this.options.borderColor });
			else
				el.setStyle({backgroundColor: this.options.borderColor });
		}.bind(this));
		
		Element.extend(this.tooltip); // IE needs element to be manually extended
		this.options.width = this.tooltip.getWidth() + 1; // Quick fix for Firefox 3
		this.tooltip.style.width = this.options.width + 'px'; // IE7 needs width to be defined
		
		this.setup();
		
		if(this.options.mouseFollow)
			Event.observe(this.el, "mousemove", this.updateEvent);
			
		this.initialized = true;
		this.appearingFX = new Effect.Appear(this.tooltip, {duration: this.options.appearDuration, to: this.options.opacity });
	},
	setup: function(){
		// If content width is more then allowed max width, set width to max
		if(this.options.width > this.options.maxWidth) {
			this.options.width = this.options.maxWidth;
			this.tooltip.style.width = this.options.width + 'px';
		}
			
		// Tooltip doesn't fit the current document dimensions
		if(this.xCord + this.options.width >= Element.getWidth(document.body)) {
			this.options.align = "right";
			this.xCord = this.xCord - this.options.width + 20;
			this.tooltip.down('.xarrow').setStyle({left: this.options.width - 24 + 'px'});
		} else {
			this.options.align = "left";
			this.tooltip.down('.xarrow').setStyle({left: 12 + 'px'});
		}
		
		this.tooltip.style.left = this.xCord - 7 + "px";
		this.tooltip.style.top = this.yCord + 12 + "px";
	},
	_clearTimeout: function(timer) {
		clearTimeout(timer);
		clearInterval(timer);
		return null;
	}
};