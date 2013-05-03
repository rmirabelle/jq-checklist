#jq-checklist

##A better way to multi-select

Checklist is a jQuery plugin replacement for <code>&lt;select multiple&gt;</code> with
some useful enhancements.

[[img/example.png]]

### Toggle to select/deselect

This obviates the need for awkward command key combinations when making mulitple selections.
To select multiple items, simply click one after the other.
Click a selected item to deselect it without affecting the rest of your selections.

### Search

Checklist includes an optional search box.

* Type some text and press *Enter* to instantly filter the list to items matching the search.
* Make your selections from the filtered list.
* Click in the search box to start a new search - previous selections are maintained.
* Search for '' to clear the filter and return to the full list, with all selections maintained.

### Check Your Status

* A status bar indicates the total number of selected items (even if the list is filtered)

### Select All/None

* Convenient links in the footer make selecting easier

##Getting Started

### 1. Include scripts...

<blockquote>Updated version will support the latest jQuery and will not require the metadata plugin</blockquote>

```html
<script src="jquery-1.4.2.js"></script>
<script src="metadata.js"></script>
<script src="jq-checklist.min.js"></script>
<link href="checklist.css" rel="stylesheet">
```

### 2. Create a div containing one or more checkboxes with some data...

<blockquote>Updated version of jq-checklist (coming soon) will use "data-" attributes instead</blockquote>

```html
<div id="cool" class="{title:'My Checklist'}">
    <input type="checkbox" name="users[]" value="1" class="{label:'Smith, Robert', tip:'Robert is a standup guy'}" checked/>
    <input type="checkbox" name="users[]" value="2" class="{label:'Smith, Steve M.'}"/>
</div>
```

### 3. Call the plugin...

```js
$().ready(function(){
	$('#cool').checklist();
});
```

The HTML chunk above expands to this at runtime:

```html
<div id="cool-frame" class="checklist-frame">
	<div class="checklist-header">My Awesome Title</div>
	<div class="checklist-search">
		<input type="text">
	</div>
	<div id="cool" class="{title:'My Awesome Title'} checklist-body">
		<ul>
			<li class="{data:'Smith, Robert'}">
				<label class="check">Smith, Robert</label>
				<input type="checkbox" name="users[]" value="1" class="checkreplace" style="display:none">
			</li>
			<li class="{data:'Smith, Steve M.'}">
				<label class="uncheck">Smith, Steve M.</label>
				<input type="checkbox" name="users[]" value="2" class="checkreplace" style="display:none">
			</li>
		</ul>
	</div>
	<div class="checklist-summary">1 selected</div>
	<div class="checklist-footer">Select <a href="#" class="all">All</a> | <a href="#" class="none">None</a></div>
</div>
```

###Observations

* The checkboxes are assigned an associated `label` and are wrapped in an `li`
* The `li` contains a `data` attribute equal to the checkbox value. This is used for searching and filtering.
When you enter a new value into the input, the `li` is shown or hidden depending on whether its data matches the current value.
* The checkboxes are assigned a css class of `.checkreplace`, which this plugin reads at runtime to hide them,
so that you interact with the labels instead.
* Labels toggle between css class of `.check` and `.uncheck` when clicked.
* The `title` data assigned to the original div is translated into the title
* Each of the component divs is assigned a css class beginning with `checklist-` This prefix is configurable
* The outermost wrapper div is assigned an id equal to the original div's id + `-frame`. This allows you to target the
overall width of the checklist via css, e.g. `#cool-frame {width:300px;}`



##Configuration

Configure jq-checklist by passing an object literal to its constructor.

###Complete Configuration example:

```js
$().ready(function() {
    $('#mydiv').checklist({
	    header: true,
	    search: true,
	    summary: true,
	    footer: true,
	    readonly: false,
	    prefix: 'cl-',
	    on_check: function(num_checked) {
		    alert(num_checked);
	    }
    });
});
```

###Configuration Options

* **header** (boolean): Set to `false` to exlude the header and title from the checklist
* **search** (boolean): Set to `false` to exclude the search box and disable filtering
* **summary** (boolean*): Set to `false` to exclude the summary bar which displays the total number of checked/selected items
* **footer** (boolean): Set to `false` to exclude the footer which contains the "select all | select none" links
* **readonly** (boolean): Set to `true` ignore/disable clicks on the checklist items
* **on_check** (function): Callback function to execute when an item is checked or unchecked. This function will receive the number of checked items as a parameter
* **prefix** (string) - The css prefix assigned to each of the component parts of the checklist: frame, header, search, body, summary, footer.
For example if we set `prefix` to `cl-` the css class assigned to the components would be `cl-frame`, `cl-header`, etc.
<blockquote>Remember that you will need to define your own .css rules or modify the existing *checklist.css* rules if you change the default prefix (`checklist-`)</blockquote>

## API

You can drill into the API for this plugin like so:

```js
var api = $('#cool').data('checklist');
```

###get_checked()

returns a jQuery collection of all the checked checkboxes:

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

## 3 Plugins in One

jq-checklist is actually 3 jQuery plugins rolled into one:

 * **1. `jq-checklist`** the main plugin
 * **2. `checkreplace`** handles just the checkbox replacement
 * **3. `itemfilter`** can be used to create a searchable list from any repeating element

The `checkreplace` and `itemfilter` plugins can be run individually if needed.