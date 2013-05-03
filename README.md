#Checklist for jQuery

This plugin creates a flexible checklist from a container
with one or more checkbox elements within it.

By default this plugin constructs the following component elements:

* **title** a custom title
* **search** a text input for filtering the results of the list as you type
* **body** the standard checkboxes are replaced with custom checkboxes with
           clickable labels and custom check/uncheck graphics
* **summary** shows how many items in the list are currently checked.
* **footer** includes links for checking all checkboxes or none

[[img/example.png]]

##Configuration options

```js

$('#cool').checklist({
	/**
	 * The css prefix assigned to each of
	 * the component parts of the checklist:
	 * frame, header, search, body, summary, footer.
	 * @example if set to 'checklist-' the css
	 * for the components would be checklist-frame,
	 * checklist-header, etc.
	 */
	prefix: 'checklist-',
	header: true, //should we include the header & title?
	search: true, //should we include the search box to filter the results?
	summary: true, //should we include the summary which displays totals?
	footer: true, //should we include the footer with select all and none controls?
	readonly: false, //should the checkboxes be read-only?
	//callback to fire when an item is checked
	on_check: function(num_checked) {
		alert(num_checked);
	}
});

```

## 3 Plugins in one

This file defines 3 plugins:

 * **1. checklist** the main plugin
 * **2. checkreplace** handles just the checkbox replacement
 * **3. itemfilter** can be used to create a searchable list from any repeating element

The checkreplace and itemfilter plugins can be run individually if needed.

##Example
The following basic HTML setup:

```html
<div id="cool" class="{title:'My Awesome Title'}">
	<input type="checkbox" name="users[]" value="1" class="{label:'Bill Smith', tip:'Bill is a standup guy'}" checked/>
	<input type="checkbox" name="users[]" value="2" class="{label:'Robert is cool'}"/>
</div>
```
and basic javascript:

```js
$().ready(function(){
	$('#cool').checklist();
});
```

expands to this at runtime:

```html
<div id="cool-frame" class="checklist-frame">
	<div class="checklist-header">My Awesome Title</div>
	<div class="checklist-search">
		<input type="text">
	</div>
	<div id="cool" class="{title:'My Awesome Title'} checklist-body">
		<ul>
			<li class="{data:'Bill Smith'}">
				<label class="check">Bill Smith</label>
				<input type="checkbox" name="users[]" value="1" class="checkreplace" style="display:none">
			</li>
			<li class="{data:'Robert Smith'}">
				<label class="uncheck">Robert Smith</label>
				<input type="checkbox" name="users[]" value="2" class="checkreplace" style="display:none">
			</li>
		</ul>
	</div>
	<div class="checklist-summary">1 selected</div>
	<div class="checklist-footer">Select <a href="#" class="all">All</a> | <a href="#" class="none">None</a></div>
</div>
```

##Observations

* The checkboxes are assigned an associated label and are wrapped in an li
* The li contains a data attribute equal to the checkbox value attribute. This is used for searching and filtering. When you enter a new value into the input, the li is shown or hidden depending on whether its data matches the current value.
* The checkboxes are assigned a css class of checkreplace, which this plugin reads at runtime to hide them, so that you interact with the labels instead.
* Labels toggle between css class of 'check' and 'uncheck' when clicked.
* The 'title' metadata assigned to the original div is translated into the title
* Each of the component divs is assigned a css class beginning with 'checklist-' This prefix is configurable
* The outermost wrapper div is assigned an id equal to the original div's id + '-frame'. This allows you to target the overal width of the checklist via css, e.g. #cool-frame {width:300px;}

##API methods

You can drill into the API for this plugin like so:

`var api = $('#cool').data('checklist');`

###get_checked()
returns a jQuery array of all the checked checkboxes:

```js
var items = $('#cool').data('checklist').get_checked();
```

You can then get the checked values simply:

```js
var arr = [];
items.each(function(){
    arr.push($(this).val());
});
```

###bubble_checked()
moves all checked items to the top of the select list

```js
$('#cool').data('checklist').bubble_checked();
```
