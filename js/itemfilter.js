(function ($) {
	/**
	 * @name itemfilter
	 * @author Robert Mirabelle
	 *
	 * This plugin allows you to filter (show/hide) selected items in almost
	 * any type of list via a search box.
	 *
	 * As you type into the search box, matching items are shown and non-matching
	 * items are hidden.
	 *
	 * The list of items is most often either options from a select list
	 * or line items from an ordered or unordered list, but with a little
	 * creativity, can be extended to include almost any repeating element.
	 *
	 * Configuration Options:
	 * [search] - the jQuery selector for the text input used to perform the search
	 * [items] - the jQuery selector for the repeating elements (i.e. 'option', 'li')
	 * [filter_on] - jQuery function for the value we want to filter on
	 *
	 * Valid values for [filter_on] include:
	 * 'text' - filter on the text of the repeating element
	 * 'value' - filter on the value attribute of the repeating element
	 * 'label' - filter on the first label inside the repeating element
	 *
	 * @example
	 * <div id="filtered">
	 * <input type="text"/>
	 * <select>
	 *    <option value="Johnson">Bill Johnson</option>
	 *    <option value="Jones">Mark Jones</option>
	 * </select>
	 * </div>
	 *
	 * $('#filtered').itemfilter({filter_on:'value'});
	 *
	 * @example
	 * <input type="text"/>
	 * <ul>
	 *    <li>Bill</li>
	 *    <li>Mark</li>
	 * </ul>
	 *
	 * $('ul').itemfilter({items:'li'});
	 *
	 * @example
	 * In this example, we do a little hacking and add
	 * a data attribute to each non-header row.
	 * Standard elements such as tr and li do not reliably
	 * support the 'value' attribute, but 'data' is good.
	 *
	 * <div id="mydiv">
	 * <input type="text" id="search"/>
	 * <table id="mytable">
	 *    <tr>
	 *        <th>Last Name</th>
	 *        <th>First Name</th>
	 *    </tr>
	 *    <tr class="filterable" data="Johnson">
	 *        <td>Johnson</td>
	 *        <td>Bill</td>
	 *    </tr>
	 *    <tr class="filterable" data="Jones">
	 *        <td>Jones</td>
	 *        <td>Mark</td>
	 *    </tr>
	 * </table>
	 * </div>
	 * $('#mydiv').itemfilter({items:'.filterable', filter_on:'data'});
	 */

	$.fn.itemfilter = function (options) {

		var api = this.data('itemfilter');
		if (api) return api;

		var defaults = {
			//selector for the list items
			items: 'option',
			//what property contains the value to search against
			filter_on: 'text',
			//selector for the search text
			search_box: 'input:text',
			//the color of the search text when not active
			css_off: '#999',
			//the color of the search text when active
			css_on: '#000'
		};

		var settings = $.extend(defaults, options);

		this.each(function () {
			api = new ItemFilter(settings);
			api.init($(this));
			$(this).data('itemfilter', api);
		});

		return api;
	};

	function ItemFilter(conf) {

		var element = null,
			settings = conf,
			items = [],
			regex = new RegExp(),
			matches = [],
			val = '',
			pattern = '',
			container = '';

		/**
		 * API
		 */
		$.extend(this, {
			init: function (el) {
				element = el;
				items = element.find(settings.items);
				container = items.parent();
				build_search();
			},
			/**
			 * Clear the search filter/restore visibility of all items
			 */
			clear_search: function () {
				element.find(settings.search_box).val('');
				search("");
			}
		});

		/**
		 * Wire up the search input
		 */
		function build_search() {
			var search_box = element.find(settings.search_box);
			if (!search_box.length) {
				return;
			}
			search_box.css({color: settings.css_off}).val('search');
			search_box.click(function () {
				$(this).css({color: settings.css_on}).val('');
			});
			search_box.blur(function () {
				if ($(this).val() === '') {
					$(this).css({color: settings.css_off}).val('search');
				}
			});
			search_box.on('keyup', function (e) {
				//don't count the SHIFT key as a key press
				if (e.which == 16) return;
				search($(this).val());
			});
		}

		/**
		 * Rebuild the list by detaching all items
		 * from the DOM and then re-attaching them
		 * from the array of matched items.
		 * You cannot simply hide() the elements as
		 * expected because webkit doesn't support
		 * this properly.
		 * @param arr
		 */
		function build_list(arr) {
			items.each(function () {
				$(this).detach();
			});
			var len = arr.length;
			for (var x = 0; x < len; x++) {
				container.append(arr[x]);
			}
		}

		/**
		 * Get the effective value for the line item so we
		 * can show or hide it based on the search. The value
		 * depends on the value for settings.filter_on.
		 * @param item jQuery object
		 * @returns string
		 */
		function get_value(item) {
			switch (settings.filter_on) {
			/**
			 * If filtering on value, we look for
			 * the item's value attribute
			 */
				case 'value':
					val = $(item).attr('value');
					break;
			/**
			 * If filtering on text, we look for
			 * the item's content
			 */
				case 'text':
					val = $(item).text();
					break;
			/**
			 * if filtering on labels, we look for the
			 * item's first label and return its text
			 */
				case 'label':
					val = $(item).find('label:first').text();
					break;
				default:
					throw('Cannot filter on ' + settings.filter_on);

			}
			return val;
		}

		/**
		 * Search the items for the string.
		 * Create an array of items that match.
		 * Trigger rebuilding the item list.
		 * @param str The search value
		 */
		function search(str) {
			if (str.length == 0) {
				build_list(items);
			} else {
				str = str.split('\\').join('\\\\');
				matches.length = 0;
				pattern = "^" + str;
				regex = new RegExp(pattern, 'i');
				var len = items.length;
				for (var x = 0; x < len; x++) {
					val = get_value(items[x]);
					if (val.match(regex)) {
						matches.push(items[x]);
					}
				}
				build_list(matches);
			}
		}
	}
})(jQuery);